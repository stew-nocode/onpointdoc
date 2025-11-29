#!/usr/bin/env node

/**
 * Script pour rafraîchir TOUS les champs des tickets depuis JIRA
 * 
 * Processus:
 * 1. Récupère tous les tickets OD depuis Supabase
 * 2. Pour chaque ticket, récupère les données complètes depuis JIRA
 * 3. Mappe tous les champs selon la stratégie définie
 * 4. Met à jour les tickets dans Supabase
 * 
 * Usage:
 *   node scripts/refresh-all-tickets-from-jira.mjs [--limit N] [--dry-run]
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  '';

// Configuration JIRA
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

if (!jiraUrl || !jiraUsername || !jiraToken) {
  console.error('❌ Variables JIRA manquantes');
  process.exit(1);
}

const JIRA_URL = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_EMAIL = jiraUsername.replace(/^["']|["']$/g, '').trim();
const JIRA_API_TOKEN = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;
const RESUME = process.argv.includes('--resume');

// Fichier de sauvegarde de progression
const PROGRESS_FILE = path.join(__dirname, 'refresh-progress.json');

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔄 RAFRAÎCHISSEMENT COMPLET DES TICKETS DEPUIS JIRA');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

if (DRY_RUN) {
  console.log('⚠️  MODE DRY-RUN : Aucune modification ne sera effectuée\n');
}

/**
 * Convertit ADF (Atlassian Document Format) en texte simple
 */
function adfToText(adf) {
  if (!adf || typeof adf !== 'object') return String(adf || '');
  
  if (adf.content && Array.isArray(adf.content)) {
    return adf.content
      .map(node => {
        if (node.type === 'text' && node.text) {
          return node.text;
        }
        if (node.content) {
          return adfToText(node);
        }
        return '';
      })
      .join(' ')
      .trim();
  }
  
  return String(adf);
}

/**
 * Parse une date ISO 8601
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

/**
 * Mappe le type de ticket JIRA vers Supabase
 */
function mapTicketType(jiraIssueType) {
  if (!jiraIssueType) return 'REQ';
  
  const normalized = jiraIssueType.toLowerCase();
  if (normalized === 'bug') return 'BUG';
  if (normalized === 'requêtes' || normalized === 'requete' || normalized === 'requête') return 'REQ';
  if (normalized === 'task' || normalized === 'story') return 'REQ';
  if (normalized === 'assistance') return 'ASSISTANCE';
  
  return 'REQ'; // Par défaut
}

/**
 * Mappe la priorité JIRA vers Supabase
 */
function mapPriority(jiraPriority) {
  if (!jiraPriority) return 'Medium';
  
  const normalized = String(jiraPriority).toLowerCase();
  if (normalized.includes('priorité 1') || normalized.includes('priorite 1') || normalized.includes('1')) {
    return 'Critical';
  }
  if (normalized.includes('priorité 2') || normalized.includes('priorite 2') || normalized.includes('2')) {
    return 'High';
  }
  if (normalized.includes('priorité 3') || normalized.includes('priorite 3') || normalized.includes('3')) {
    return 'Medium';
  }
  if (normalized.includes('priorité 4') || normalized.includes('priorite 4') || normalized.includes('4')) {
    return 'Low';
  }
  
  // Mapping par nom
  if (normalized.includes('critical') || normalized.includes('highest')) return 'Critical';
  if (normalized.includes('high')) return 'High';
  if (normalized.includes('low') || normalized.includes('lowest')) return 'Low';
  
  return 'Medium'; // Par défaut
}

/**
 * Extrait une valeur d'un custom field tableau
 */
function extractCustomFieldValue(field) {
  if (!field) return null;
  if (Array.isArray(field) && field.length > 0) {
    return field[0].value || field[0].name || field[0].id || null;
  }
  if (field.value) return field.value;
  if (field.name) return field.name;
  if (field.id) return field.id;
  return null;
}

/**
 * Normalise le canal pour correspondre à l'enum Supabase
 */
function normalizeCanal(canalValue) {
  if (!canalValue) return null;
  
  const normalized = String(canalValue).trim();
  const canalMap = {
    'Whatsapp': 'Whatsapp',
    'Email': 'Email',
    'E-mail': 'E-mail',
    'Appel': 'Appel',
    'Appel Téléphonique': 'Appel Téléphonique',
    'Appel WhatsApp': 'Appel WhatsApp',
    'Chat SMS': 'Chat SMS',
    'Chat WhatsApp': 'Chat WhatsApp',
    'Constat Interne': 'Constat Interne',
    'En présentiel': 'En présentiel',
    'En prsentiel': 'En prsentiel',
    'Non enregistré': 'Non enregistré',
    'Online (Google Meet, Teams...)': 'Online (Google Meet, Teams...)',
    'Autre': 'Autre',
    'Non renseigné': null
  };
  
  return canalMap[normalized] || null;
}

/**
 * Normalise le type de bug
 */
function normalizeBugType(bugTypeValue) {
  if (!bugTypeValue) return null;
  
  const normalized = String(bugTypeValue).trim();
  // Liste des valeurs possibles de l'enum bug_type_enum
  const validBugTypes = [
    'Autres', 'Mauvais déversement des données', 'Dysfonctionnement sur le Calcul des salaires',
    'Duplication anormale', 'Enregistrement impossible', 'Page d\'erreur',
    'Historique vide/non exhaustif', 'Non affichage de pages/données', 'Lenteur Système',
    'Import de fichiers impossible', 'Suppression impossible', 'Récupération de données impossible',
    'Edition impossible', 'Dysfonctionnement des filtres', 'Error 503',
    'Impression impossible', 'Erreur de calcul/Erreur sur Dashboard', 'Dysfonctionnement Workflow',
    'Erreur serveur', 'Dysfonctionnement des liens d\'accès', 'Formulaire indisponible',
    'Erreur Ajax', 'Export de données impossible', 'Connexion impossible'
  ];
  
  if (validBugTypes.includes(normalized)) {
    return normalized;
  }
  
  return null;
}

/**
 * Trouve un profil par accountId JIRA
 */
async function findProfileByJiraAccountId(accountId) {
  if (!accountId) return null;
  
  // Chercher par jira_user_id ou account
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .or(`jira_user_id.eq.${accountId},account.eq.${accountId}`)
    .limit(1)
    .maybeSingle();
  
  return profile?.id || null;
}

/**
 * Normalise un nom pour la comparaison (enlève accents, majuscules)
 */
function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Calcule la similarité entre deux noms (Levenshtein simplifié)
 */
function nameSimilarity(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2) return 1.0;
  if (n1.includes(n2) || n2.includes(n1)) return 0.8;
  
  // Distance de Levenshtein simplifiée
  const longer = n1.length > n2.length ? n1 : n2;
  const shorter = n1.length > n2.length ? n2 : n1;
  const distance = levenshteinDistance(n1, n2);
  const similarity = 1 - (distance / longer.length);
  
  return similarity;
}

/**
 * Distance de Levenshtein
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * Trouve un profil support (agent/manager) par nom avec similarité
 */
async function findSupportProfileByName(jiraName, jiraAccountId) {
  if (!jiraName) return null;
  
  const normalizedJiraName = normalizeName(jiraName);
  
  // 1. Chercher d'abord par accountId JIRA
  if (jiraAccountId) {
    const { data: profileById } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .or(`jira_user_id.eq.${jiraAccountId},account.eq.${jiraAccountId}`)
      .limit(1)
      .maybeSingle();
    
    if (profileById) {
      return profileById.id;
    }
  }
  
  // 2. Chercher par nom exact (case-insensitive, sans accents)
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['agent', 'manager'])
    .limit(1000)
    .maybeSingle();
  
  // Récupérer tous les profils support pour comparaison
  const { data: allSupportProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['agent', 'manager']);
  
  if (!allSupportProfiles || allSupportProfiles.length === 0) {
    return null;
  }
  
  // 3. Chercher par similarité de nom
  let bestMatch = null;
  let bestSimilarity = 0;
  const SIMILARITY_THRESHOLD = 0.7; // 70% de similarité minimum
  
  for (const profile of allSupportProfiles) {
    if (!profile.full_name) continue;
    
    const similarity = nameSimilarity(jiraName, profile.full_name);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      if (similarity >= SIMILARITY_THRESHOLD) {
        bestMatch = profile;
      }
    }
  }
  
  // Si on a trouvé un match avec similarité >= 70%, l'utiliser
  if (bestMatch) {
    return bestMatch.id;
  }
  
  // 4. Si la meilleure similarité trouvée est < 70%, créer un nouveau profil
  const normalizedJiraNameForEmail = jiraName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
  
  const emailFictif = `${normalizedJiraNameForEmail}@onpointjira.local`;
  
  console.log(`   ➕ Création d'un nouveau profil support: ${jiraName} (${emailFictif})`);
  if (bestSimilarity > 0) {
    console.log(`      (Meilleure similarité trouvée: ${(bestSimilarity * 100).toFixed(1)}% - en dessous du seuil de 70%)`);
  }
  
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      full_name: jiraName,
      email: emailFictif,
      role: 'agent', // Par défaut agent
      jira_user_id: jiraAccountId || null,
      account: jiraAccountId || null
    })
    .select('id')
    .single();
  
  if (createError) {
    console.error(`   ❌ Erreur lors de la création du profil: ${createError.message}`);
    return null;
  }
  
  console.log(`   ✅ Profil créé avec ID: ${newProfile.id}`);
  return newProfile?.id || null;
}

/**
 * Trouve un profil client par nom (flexible)
 */
async function findClientProfileByName(name) {
  if (!name) return null;
  
  const normalized = String(name).trim();
  
  // Recherche exacte d'abord
  let { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('full_name', normalized)
    .eq('role', 'client')
    .limit(1)
    .maybeSingle();
  
  if (profile) return profile.id;
  
  // Recherche flexible (sans accents)
  const searchName = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  
  const { data: allClients } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'client');
  
  if (allClients) {
    const found = allClients.find(c => {
      const clientName = (c.full_name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
      return clientName === searchName;
    });
    if (found) return found.id;
  }
  
  return null;
}

/**
 * Trouve une entreprise par nom (flexible)
 */
async function findCompanyByName(name) {
  if (!name) return null;
  
  const normalized = String(name).trim();
  
  // Recherche exacte
  let { data: company } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', normalized)
    .limit(1)
    .maybeSingle();
  
  if (company) return company.id;
  
  // Recherche flexible
  const { data: allCompanies } = await supabase
    .from('companies')
    .select('id, name');
  
  if (allCompanies) {
    const found = allCompanies.find(c => {
      const companyName = (c.name || '').trim().toUpperCase();
      const searchName = normalized.toUpperCase();
      return companyName === searchName || companyName.includes(searchName) || searchName.includes(companyName);
    });
    if (found) return found.id;
  }
  
  return null;
}

/**
 * Trouve un module par ID JIRA
 */
async function findModuleByJiraId(jiraId) {
  if (!jiraId) return null;
  
  const { data: module } = await supabase
    .from('modules')
    .select('id')
    .eq('id_module_jira', parseInt(jiraId))
    .limit(1)
    .maybeSingle();
  
  return module?.id || null;
}

/**
 * Trouve un sous-module par ID JIRA
 */
async function findSubmoduleByJiraId(jiraId) {
  if (!jiraId) return null;
  
  const { data: submodule } = await supabase
    .from('submodules')
    .select('id')
    .eq('id_module_jira', parseInt(jiraId))
    .limit(1)
    .maybeSingle();
  
  return submodule?.id || null;
}

/**
 * Trouve une fonctionnalité par ID JIRA
 */
async function findFeatureByJiraId(jiraId) {
  if (!jiraId) return null;
  
  const { data: feature } = await supabase
    .from('features')
    .select('id')
    .eq('jira_feature_id', parseInt(jiraId))
    .limit(1)
    .maybeSingle();
  
  return feature?.id || null;
}

/**
 * Trouve un produit par ID JIRA ou nom
 */
async function findProductByJiraIdOrName(jiraId, name) {
  if (jiraId) {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('jira_product_id', parseInt(jiraId))
      .limit(1)
      .maybeSingle();
    
    if (product) return product.id;
  }
  
  if (name) {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .ilike('name', `%${name}%`)
      .limit(1)
      .maybeSingle();
    
    if (product) return product.id;
  }
  
  return null;
}

/**
 * Récupère et mappe un ticket depuis JIRA (avec retry)
 */
async function fetchAndMapTicketFromJira(jiraKey, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
      
      const response = await fetch(
        `${JIRA_URL}/rest/api/3/issue/${jiraKey}?fields=*all`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (response.status === 404) {
          return { error: 'Ticket non trouvé dans JIRA' };
        }
        if (response.status === 429) {
          // Rate limit - attendre avant de réessayer
          if (attempt < retries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          return { error: 'Rate limit atteint - pause nécessaire' };
        }
        if (response.status === 401 || response.status === 403) {
          return { error: `Erreur d'authentification JIRA (${response.status})` };
        }
        // Pour les autres erreurs HTTP, réessayer
        if (attempt < retries && (response.status >= 500 || response.status === 408)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return { error: `Erreur HTTP ${response.status}: ${errorText.substring(0, 100)}` };
      }

      const jiraTicket = await response.json();
      const fields = jiraTicket.fields || {};

      // Mapper tous les champs
      const ticketData = {
      // Champs directs
      title: fields.summary || null,
      description: fields.description ? adfToText(fields.description) : null,
      status: fields.status?.name || 'Nouveau',
      ticket_type: mapTicketType(fields.issuetype?.name),
      priority: mapPriority(fields.priority?.name),
      jira_issue_id: String(jiraTicket.id),
      created_at: parseDate(fields.created),
      updated_at: parseDate(fields.updated),
      resolved_at: parseDate(fields.resolutiondate),
      target_date: fields.duedate ? parseDate(fields.duedate) : (fields.customfield_10115 ? parseDate(fields.customfield_10115) : null),
      resolution: fields.resolution?.name || null,
      fix_version: fields.fixVersions?.[0]?.name || null,
      issue_type: fields.issuetype?.name || null,
      origin: 'jira',
      last_update_source: 'jira',
      
      // Custom fields
      canal: normalizeCanal(extractCustomFieldValue(fields.customfield_10055)),
      bug_type: normalizeBugType(extractCustomFieldValue(fields.customfield_10056)),
      workflow_status: extractCustomFieldValue(fields.customfield_10083),
      test_status: extractCustomFieldValue(fields.customfield_10084),
      sprint_id: fields.customfield_10020?.[0]?.id || null,
      
      // Relations (à résoudre)
      created_by: null,
      assigned_to: null,
      contact_user_id: null,
      company_id: null,
      product_id: null,
      module_id: null,
      submodule_id: null,
      feature_id: null,
      
      // Métadonnées
      jira_metadata: jiraTicket,
      custom_fields: {
        product_specific: {},
        metadata: {
          labels: fields.labels || [],
          components: fields.components || [],
          issuelinks: fields.issuelinks || []
        }
      }
    };

      // Résoudre les relations
      // Vérifier si le reporter est "Edwidge Kouassi" et forcer created_by vers "Edwige KOUASSI"
      if (fields.reporter) {
        const reporterName = fields.reporter.displayName || fields.reporter.name || '';
        const reporterAccountId = fields.reporter.accountId;
        
        const isEdwidge = 
          reporterAccountId === EDWIDGE_JIRA_ACCOUNT_ID ||
          reporterAccountId === `712020:${EDWIDGE_JIRA_ACCOUNT_ID}` ||
          (reporterName && reporterName.toLowerCase().includes('edwidge'));
        
        if (isEdwidge) {
          // Chercher le profil "Edwige KOUASSI" (agent) dans Supabase
          const { data: edwigeProfile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('full_name', '%edwige%kouassi%')
            .eq('role', 'agent')
            .limit(1)
            .maybeSingle();
          
          ticketData.created_by = edwigeProfile?.id || null;
        } else {
          // Chercher par accountId d'abord, puis par nom avec similarité
          ticketData.created_by = await findProfileByJiraAccountId(reporterAccountId) ||
                                   await findSupportProfileByName(reporterName, reporterAccountId);
        }
      }
      
      if (fields.assignee) {
        const assigneeName = fields.assignee.displayName || fields.assignee.name || '';
        const assigneeAccountId = fields.assignee.accountId;
        
        // Chercher par accountId d'abord, puis par nom avec similarité
        ticketData.assigned_to = await findProfileByJiraAccountId(assigneeAccountId) ||
                                 await findSupportProfileByName(assigneeName, assigneeAccountId);
      }
      
      if (fields.customfield_10053) {
        const contactName = extractCustomFieldValue(fields.customfield_10053);
        if (contactName) {
          ticketData.contact_user_id = await findClientProfileByName(contactName);
        }
      }
      
      if (fields.customfield_10045) {
        const companyName = extractCustomFieldValue(fields.customfield_10045);
        if (companyName) {
          ticketData.company_id = await findCompanyByName(companyName);
        }
      }
      
      // Module (customfield_10046)
      if (fields.customfield_10046) {
        const moduleJiraId = extractCustomFieldValue(fields.customfield_10046);
        if (moduleJiraId) {
          ticketData.module_id = await findModuleByJiraId(moduleJiraId);
        }
      }
      
      // Sous-module (tester tous les custom fields)
      const submoduleFields = [
        fields.customfield_10052, // Ancien
        fields.customfield_10297, // Opérations
        fields.customfield_10298, // Finance
        fields.customfield_10299, // Projet
        fields.customfield_10300, // RH
        fields.customfield_10301, // CRM
        fields.customfield_10302  // Paiement
      ];
      
      for (const submoduleField of submoduleFields) {
        if (submoduleField) {
          const submoduleJiraId = extractCustomFieldValue(submoduleField);
          if (submoduleJiraId) {
            ticketData.submodule_id = await findSubmoduleByJiraId(submoduleJiraId);
            break;
          }
        }
      }
      
      // Produit (via components ou project)
      if (fields.components?.[0]?.name) {
        ticketData.product_id = await findProductByJiraIdOrName(null, fields.components[0].name);
      }
      if (!ticketData.product_id && jiraTicket.fields?.project?.key === 'OD') {
        // Si projet OD, chercher OBC par défaut
        ticketData.product_id = await findProductByJiraIdOrName(null, 'OBC');
      }
      
      // Issue links (related_ticket_key)
      if (fields.issuelinks) {
        const duplicateLink = fields.issuelinks.find(link => 
          link.type?.name === 'Duplicate' && link.outwardIssue?.key
        );
        if (duplicateLink) {
          ticketData.related_ticket_key = duplicateLink.outwardIssue.key;
          ticketData.custom_fields.metadata.obcs_duplicate = duplicateLink.outwardIssue.key;
        }
      }

      return { data: ticketData };
    } catch (error) {
      // Détecter les types d'erreurs spécifiques
      const isNetworkError = error.message?.includes('fetch failed') || 
                            error.message?.includes('ECONNREFUSED') || 
                            error.message?.includes('ETIMEDOUT') ||
                            error.name === 'AbortError';
      
      if (isNetworkError && attempt < retries) {
        // Réessayer pour les erreurs réseau
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (isNetworkError) {
        return { error: `Erreur réseau après ${retries} tentatives: ${error.message}` };
      }
      if (error.message?.includes('timeout')) {
        return { error: `Timeout: ${error.message}` };
      }
      return { error: error.message || 'Erreur inconnue' };
    }
  }
  
  return { error: 'Échec après toutes les tentatives' };
}

/**
 * Met à jour un ticket dans Supabase
 */
async function updateTicketInSupabase(ticketId, ticketData) {
  // Nettoyer les valeurs vides
  Object.keys(ticketData).forEach(key => {
    if (ticketData[key] === '' || ticketData[key] === undefined) {
      ticketData[key] = null;
    }
  });

  if (DRY_RUN) {
    console.log(`   [DRY-RUN] Mise à jour du ticket ${ticketId}:`);
    console.log(`   ${JSON.stringify(ticketData, null, 2).substring(0, 200)}...`);
    return { success: true, dryRun: true };
  }

  const { error } = await supabase
    .from('tickets')
    .update(ticketData)
    .eq('id', ticketId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// AccountId JIRA de "Edwidge Kouassi"
const EDWIDGE_JIRA_ACCOUNT_ID = '5fb4dd9e2730d800765b5774';

// Extensions d'images supportées
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

/**
 * Vérifie si un fichier est une image
 */
function isImageFile(filename) {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Télécharge un fichier depuis JIRA
 */
async function downloadFileFromJira(attachmentId, filename, jiraKey, customUrl = null) {
  return new Promise((resolve, reject) => {
    const url = customUrl || `${JIRA_URL}/rest/api/3/attachment/content/${attachmentId}`;
    const fileUrl = new URL(url);
    const protocol = fileUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: fileUrl.hostname,
      port: fileUrl.port || (fileUrl.protocol === 'https:' ? 443 : 80),
      path: fileUrl.pathname + fileUrl.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': '*/*'
      }
    };

    const chunks = [];
    
    const req = protocol.request(options, (res) => {
      // Gérer les redirections (301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : `${fileUrl.protocol}//${fileUrl.hostname}${res.headers.location}`;
        
        req.destroy();
        return downloadFileFromJira(attachmentId, filename, jiraKey, redirectUrl)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const fileUrl = new URL(url);
    const protocol = fileUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: fileUrl.hostname,
      port: fileUrl.port || (fileUrl.protocol === 'https:' ? 443 : 80),
      path: fileUrl.pathname + fileUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const chunks = [];
    
    const req = protocol.request(options, (res) => {
      // Gérer les redirections (301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : `${fileUrl.protocol}//${fileUrl.hostname}${res.headers.location}`;
        
        req.destroy();
        return downloadImageFromUrl(redirectUrl);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

/**
 * Détermine le content type d'un fichier
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Normalise un nom de fichier pour éviter les caractères spéciaux
 */
function normalizeFilename(filename) {
  if (!filename) return 'image.jpg';
  
  // Extraire l'extension
  const ext = path.extname(filename) || '.jpg';
  const nameWithoutExt = path.basename(filename, ext);
  
  // Normaliser le nom (enlever accents, remplacer caractères spéciaux)
  const normalized = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Remplacer caractères spéciaux par _
    .replace(/_+/g, '_') // Remplacer plusieurs _ par un seul
    .replace(/^_|_$/g, ''); // Enlever _ au début/fin
  
  return (normalized || 'image') + ext.toLowerCase();
}

/**
 * Upload une image dans Supabase Storage et enregistre les métadonnées
 */
async function uploadImageToSupabase(buffer, filename, jiraKey, attachmentId, ticketId, sizeBytes) {
  const normalizedFilename = normalizeFilename(filename);
  const filePath = `tickets/${jiraKey}/${attachmentId}-${normalizedFilename}`;
  
  // Vérifier si l'attachment existe déjà
  const { data: existing } = await supabase
    .from('ticket_attachments')
    .select('id')
    .eq('ticket_id', ticketId)
    .eq('file_path', filePath)
    .limit(1)
    .maybeSingle();
  
  if (existing) {
    return { path: filePath, skipped: true };
  }
  
  const { data, error } = await supabase.storage
    .from('ticket-attachments')
    .upload(filePath, buffer, {
      contentType: getContentType(filename),
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Enregistrer les métadonnées
  const { error: metaError } = await supabase
    .from('ticket_attachments')
    .insert({
      ticket_id: ticketId,
      file_path: filePath,
      mime_type: getContentType(filename),
      size_kb: Math.ceil(sizeBytes / 1024)
    });

  if (metaError) {
    console.warn(`   ⚠️  Image téléchargée mais métadonnées non enregistrées: ${metaError.message}`);
  }

  return { path: filePath, skipped: false };
}

/**
 * Récupère les commentaires d'un ticket depuis JIRA et les insère dans Supabase
 */
async function syncCommentsFromJira(jiraKey, ticketId) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${jiraKey}/comment?expand=renderedBody`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return { synced: 0, errors: 0 };
    }

    const commentsData = await response.json();
    const comments = commentsData.comments || [];
    let synced = 0;
    let errors = 0;

    for (const comment of comments) {
      try {
        // Vérifier si le commentaire existe déjà
        const { data: existing } = await supabase
          .from('ticket_comments')
          .select('id')
          .eq('ticket_id', ticketId)
          .eq('jira_comment_id', String(comment.id))
          .limit(1)
          .maybeSingle();

        if (existing) {
          continue; // Déjà synchronisé
        }

        // Trouver l'auteur du commentaire
        let userId = null;
        if (comment.author) {
          const authorName = comment.author.displayName || comment.author.name || '';
          const authorAccountId = comment.author.accountId;
          
          userId = await findProfileByJiraAccountId(authorAccountId) ||
                   await findSupportProfileByName(authorName, authorAccountId);
        }

        // Convertir le body ADF en texte
        const commentText = adfToText(comment.body);

        // Insérer le commentaire
        const { error: insertError } = await supabase
          .from('ticket_comments')
          .insert({
            ticket_id: ticketId,
            user_id: userId,
            content: commentText,
            jira_comment_id: String(comment.id),
            origin: 'jira_comment',
            created_at: parseDate(comment.created)
          });

        if (insertError) {
          console.warn(`   ⚠️  Erreur lors de l'insertion du commentaire ${comment.id}: ${insertError.message}`);
          errors++;
        } else {
          synced++;
        }
      } catch (error) {
        console.warn(`   ⚠️  Erreur lors du traitement du commentaire ${comment.id}: ${error.message}`);
        errors++;
      }
    }

    return { synced, errors };
  } catch (error) {
    console.warn(`   ⚠️  Erreur lors de la récupération des commentaires: ${error.message}`);
    return { synced: 0, errors: 1 };
  }
}

/**
 * Télécharge les images d'un ticket depuis JIRA
 */
async function downloadTicketImages(jiraKey, ticketId, jiraTicket) {
  let downloaded = 0;
  let errors = 0;

  try {
    // 1. Télécharger les attachments (images)
    const attachments = jiraTicket.fields?.attachment || [];
    const imageAttachments = attachments.filter(att => isImageFile(att.filename));

    for (const attachment of imageAttachments) {
      try {
        const buffer = await downloadFileFromJira(attachment.id, attachment.filename, jiraKey);
        const result = await uploadImageToSupabase(
          buffer,
          attachment.filename,
          jiraKey,
          attachment.id,
          ticketId,
          attachment.size
        );
        
        if (!result.skipped) {
          downloaded++;
        }
      } catch (error) {
        console.warn(`   ⚠️  Erreur lors du téléchargement de ${attachment.filename}: ${error.message}`);
        errors++;
      }
    }

    // 2. Récupérer les commentaires depuis JIRA (séparément car pas toujours dans fields)
    let comments = [];
    try {
      const commentsResponse = await fetch(
        `${JIRA_URL}/rest/api/3/issue/${jiraKey}/comment`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );
      
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        comments = commentsData.comments || [];
      }
    } catch (error) {
      console.warn(`   ⚠️  Erreur lors de la récupération des commentaires pour les images: ${error.message}`);
    }
    
    // Télécharger les images des commentaires
    for (const comment of comments) {
      const body = comment.body || '';
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      
      // Extraire les URLs d'images du body ADF
      try {
        const bodyObj = typeof body === 'object' ? body : JSON.parse(bodyStr);
        if (bodyObj && bodyObj.content) {
          const extractImagesFromADF = (node) => {
            const images = [];
            if (node.type === 'image' && node.attrs && node.attrs.url) {
              const url = node.attrs.url;
              if (isImageFile(url)) {
                images.push({ url, commentId: comment.id, filename: url.split('/').pop() });
              }
            }
            if (node.content && Array.isArray(node.content)) {
              node.content.forEach(child => {
                images.push(...extractImagesFromADF(child));
              });
            }
            return images;
          };
          
          const commentImages = extractImagesFromADF(bodyObj);
          for (const img of commentImages) {
            try {
              const buffer = await downloadImageFromUrl(img.url);
              const commentAttachmentId = `comment-${img.commentId}`;
              const result = await uploadImageToSupabase(
                buffer,
                img.filename || 'image.jpg',
                jiraKey,
                commentAttachmentId,
                ticketId,
                buffer.length
              );
              
              if (!result.skipped) {
                downloaded++;
              }
            } catch (error) {
              console.warn(`   ⚠️  Erreur lors du téléchargement de l'image du commentaire: ${error.message}`);
              errors++;
            }
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    return { downloaded, errors };
  } catch (error) {
    console.warn(`   ⚠️  Erreur lors du téléchargement des images: ${error.message}`);
    return { downloaded: 0, errors: 1 };
  }
}

/**
 * Charge la progression sauvegardée
 */
function loadProgress() {
  if (!RESUME || !existsSync(PROGRESS_FILE)) {
    return null;
  }
  
  try {
    const progressData = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    console.log(`📂 Reprise depuis la sauvegarde:`);
    console.log(`   - Dernier ticket traité: ${progressData.lastProcessedKey || 'Aucun'}`);
    console.log(`   - Tickets traités: ${progressData.processedCount || 0}`);
    console.log(`   - Tickets mis à jour: ${progressData.updatedCount || 0}`);
    console.log(`   - Erreurs: ${progressData.errorCount || 0}\n`);
    return progressData;
  } catch (error) {
    console.warn(`⚠️  Impossible de charger la progression: ${error.message}`);
    return null;
  }
}

/**
 * Sauvegarde la progression
 */
function saveProgress(progress) {
  try {
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de la progression: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function refreshAllTickets() {
  try {
    // Charger la progression si reprise
    const savedProgress = loadProgress();
    let startFromKey = null;
    if (savedProgress && savedProgress.lastProcessedKey) {
      startFromKey = savedProgress.lastProcessedKey;
    }
    
    // 1. Récupérer tous les tickets OD depuis Supabase (avec pagination)
    console.log('📥 Récupération des tickets OD depuis Supabase...');
    
    let allTickets = [];
    let start = 0;
    const pageSize = 1000;
    let hasMore = true;
    let totalCount = 0;

    while (hasMore) {
      let query = supabase
        .from('tickets')
        .select('id, jira_issue_key, title, ticket_type', { count: 'exact' })
        .in('ticket_type', ['BUG', 'REQ'])
        .like('jira_issue_key', 'OD-%')
        .order('jira_issue_key', { ascending: true })
        .range(start, start + pageSize - 1);

      if (LIMIT && allTickets.length + pageSize > LIMIT) {
        query = query.limit(LIMIT - allTickets.length);
      }

      const { data: tickets, error: ticketsError, count } = await query;

      if (ticketsError) {
        console.error('❌ Erreur lors de la récupération des tickets:', ticketsError.message);
        break;
      }

      if (count !== null) {
        totalCount = count;
      }

      if (tickets && tickets.length > 0) {
        allTickets = allTickets.concat(tickets);
        console.log(`   📊 ${allTickets.length}/${totalCount || '?'} tickets récupérés...`);
      }

      hasMore = tickets && tickets.length === pageSize && (!LIMIT || allTickets.length < LIMIT);
      start += pageSize;
    }

    const tickets = allTickets;

    if (!tickets || tickets.length === 0) {
      console.log('⚠️  Aucun ticket à traiter.');
      return;
    }

    console.log(`✅ ${tickets.length} tickets OD trouvés (total: ${totalCount || tickets.length})\n`);

    if (tickets.length === 0) {
      console.log('⚠️  Aucun ticket à traiter.');
      return;
    }

    // Filtrer les tickets déjà traités si reprise
    let ticketsToProcess = tickets;
    if (startFromKey) {
      const startIndex = tickets.findIndex(t => t.jira_issue_key === startFromKey);
      if (startIndex >= 0) {
        ticketsToProcess = tickets.slice(startIndex + 1); // Reprendre après le dernier traité
        console.log(`   ⏭️  Reprise après ${startFromKey}, ${ticketsToProcess.length} tickets restants\n`);
      }
    }
    
    // Initialiser les compteurs depuis la sauvegarde
    let processed = savedProgress?.processedCount || 0;
    let updated = savedProgress?.updatedCount || 0;
    let errors = savedProgress?.errorCount || 0;
    const errorDetails = savedProgress?.errorDetails || [];
    let lastProcessedKey = savedProgress?.lastProcessedKey || null;
    
    // 2. Traiter chaque ticket
    console.log('🔄 Mise à jour des tickets depuis JIRA...\n');
    
    // Sauvegarder la progression tous les 50 tickets
    const SAVE_INTERVAL = 50;
    let lastSaveCount = processed;

    for (const ticket of ticketsToProcess) {
      processed++;
      const jiraKey = ticket.jira_issue_key;

      try {
        console.log(`[${processed}/${tickets.length}] ${jiraKey}...`);

        // Récupérer et mapper depuis JIRA
        const result = await fetchAndMapTicketFromJira(jiraKey);

        if (result.error) {
          console.error(`   ❌ ${result.error}`);
          errors++;
          errorDetails.push({ jiraKey, error: result.error });
          continue;
        }

        // Mettre à jour dans Supabase
        const updateResult = await updateTicketInSupabase(ticket.id, result.data);

        if (updateResult.error) {
          console.error(`   ❌ Erreur Supabase: ${updateResult.error}`);
          errors++;
          errorDetails.push({ jiraKey, error: updateResult.error });
        } else {
          if (!updateResult.dryRun) {
            console.log(`   ✅ Mis à jour`);
            updated++;
            
            // Synchroniser les commentaires
            const commentsResult = await syncCommentsFromJira(jiraKey, ticket.id);
            if (commentsResult.synced > 0) {
              console.log(`   💬 ${commentsResult.synced} commentaire(s) synchronisé(s)`);
            }
            
            // Télécharger les images
            const imagesResult = await downloadTicketImages(jiraKey, ticket.id, result.data.jira_metadata);
            if (imagesResult.downloaded > 0) {
              console.log(`   📸 ${imagesResult.downloaded} image(s) téléchargée(s)`);
            }
          } else {
            console.log(`   ✅ [DRY-RUN]`);
            updated++;
          }
        }

        // Mettre à jour le dernier ticket traité
        lastProcessedKey = jiraKey;
        
        // Sauvegarder la progression régulièrement
        if (processed - lastSaveCount >= SAVE_INTERVAL) {
          saveProgress({
            lastProcessedKey,
            processedCount: processed,
            updatedCount: updated,
            errorCount: errors,
            errorDetails: errorDetails.slice(-50), // Garder seulement les 50 dernières erreurs
            timestamp: new Date().toISOString()
          });
          lastSaveCount = processed;
          console.log(`   💾 Progression sauvegardée (${processed}/${tickets.length} traités, ${updated} mis à jour)\n`);
        }
        
        // Pause pour éviter le rate limiting (augmenter la pause si beaucoup d'erreurs)
        if (processed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Augmenté à 1 seconde
        }
        
        // Si trop d'erreurs consécutives, pause plus longue
        if (errors > 0 && errors % 50 === 0) {
          console.log(`   ⏸️  Pause de 5 secondes après ${errors} erreurs...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`   ❌ Erreur inattendue: ${error.message}`);
        errors++;
        errorDetails.push({ jiraKey, error: error.message });
      }
    }

    // 3. Résumé
    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(`   ✅ Tickets traités: ${processed}`);
    console.log(`   ✅ Tickets mis à jour: ${updated}`);
    console.log(`   ❌ Erreurs: ${errors}`);

    if (errorDetails.length > 0 && errorDetails.length <= 20) {
      console.log('\n════════════════════════════════════════════════════════════════════════════════');
      console.log('❌ DÉTAILS DES ERREURS');
      console.log('════════════════════════════════════════════════════════════════════════════════');
      errorDetails.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.jiraKey}: ${err.error}`);
      });
    }

    // Sauvegarder la progression finale
    saveProgress({
      lastProcessedKey,
      processedCount: processed,
      updatedCount: updated,
      errorCount: errors,
      errorDetails: errorDetails.slice(-50),
      timestamp: new Date().toISOString(),
      completed: true
    });
    
    console.log('\n✅ Rafraîchissement terminé');
    console.log(`💾 Progression sauvegardée dans: ${PROGRESS_FILE}`);
    console.log(`💡 Pour reprendre en cas d'interruption: node scripts/refresh-all-tickets-from-jira.mjs --resume`);
  } catch (error) {
    // Sauvegarder la progression même en cas d'erreur fatale
    if (lastProcessedKey) {
      saveProgress({
        lastProcessedKey,
        processedCount: processed,
        updatedCount: updated,
        errorCount: errors,
        errorDetails: errorDetails.slice(-50),
        timestamp: new Date().toISOString(),
        error: error.message
      });
      console.log(`\n💾 Progression sauvegardée avant l'erreur fatale`);
      console.log(`💡 Pour reprendre: node scripts/refresh-all-tickets-from-jira.mjs --resume`);
    }
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

refreshAllTickets();

