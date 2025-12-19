#!/usr/bin/env node

/**
 * Script pour importer TOUS les tickets Bug et Requêtes rapportés par "Edwidge Kouassi" 
 * depuis JIRA et les lier à "Edwige KOUASSI" dans Supabase
 * 
 * Processus:
 * 1. Recherche tous les tickets OD dans JIRA avec reporter = "Edwidge Kouassi"
 * 2. Pour chaque ticket, récupère les données complètes depuis JIRA
 * 3. Mappe tous les champs selon la stratégie définie
 * 4. Crée ou met à jour les tickets dans Supabase avec created_by = "Edwige KOUASSI"
 * 
 * Usage:
 *   node scripts/import-edwige-tickets-from-jira.mjs [--dry-run]
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

// AccountId JIRA de "Edwidge Kouassi"
const EDWIDGE_JIRA_ACCOUNT_ID = '5fb4dd9e2730d800765b5774';

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('📥 IMPORT DES TICKETS "EDWIDGE KOUASSI" DEPUIS JIRA');
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
 * Récupère et mappe un ticket depuis JIRA
 */
async function fetchAndMapTicketFromJira(jiraKey, edwigeProfileId) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${jiraKey}?fields=*all`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Ticket non trouvé dans JIRA' };
      }
      if (response.status === 429) {
        return { error: 'Rate limit atteint' };
      }
      return { error: `Erreur HTTP ${response.status}` };
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
      jira_issue_key: jiraKey,
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
      
      // Toujours lier à Edwige KOUASSI
      created_by: edwigeProfileId,
      
      // Custom fields
      canal: normalizeCanal(extractCustomFieldValue(fields.customfield_10055)),
      bug_type: normalizeBugType(extractCustomFieldValue(fields.customfield_10056)),
      workflow_status: extractCustomFieldValue(fields.customfield_10083),
      test_status: extractCustomFieldValue(fields.customfield_10084),
      sprint_id: fields.customfield_10020?.[0]?.id || null,
      
      // Relations (à résoudre)
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
    if (fields.assignee?.accountId) {
      const { data: assigneeProfile } = await supabase
        .from('profiles')
        .select('id')
        .or(`jira_user_id.eq.${fields.assignee.accountId},account.eq.${fields.assignee.accountId}`)
        .limit(1)
        .maybeSingle();
      ticketData.assigned_to = assigneeProfile?.id || null;
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
    return { error: error.message };
  }
}

/**
 * Crée ou met à jour un ticket dans Supabase
 */
async function upsertTicketInSupabase(ticketData) {
  // Nettoyer les valeurs vides
  Object.keys(ticketData).forEach(key => {
    if (ticketData[key] === '' || ticketData[key] === undefined) {
      ticketData[key] = null;
    }
  });

  if (DRY_RUN) {
    console.log(`   [DRY-RUN] Upsert du ticket ${ticketData.jira_issue_key}:`);
    console.log(`   ${JSON.stringify(ticketData, null, 2).substring(0, 300)}...`);
    return { success: true, dryRun: true };
  }

  const { error, data } = await supabase
    .from('tickets')
    .upsert(ticketData, {
      onConflict: 'jira_issue_key',
      ignoreDuplicates: false
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, id: data?.id };
}

/**
 * Recherche tous les tickets OD rapportés par Edwidge Kouassi dans JIRA
 */
async function searchTicketsInJira() {
  // Récupérer tous les tickets OD Bug et Requêtes, puis filtrer par reporter
  const jql = `project = OD AND (issuetype = Bug OR issuetype = Requêtes) ORDER BY created DESC`;
  
  let allIssues = [];
  let startAt = 0;
  const maxResults = 100;
  let hasMore = true;
  let totalFound = 0;

  console.log(`   🔍 Recherche de tous les tickets OD (Bug/Requêtes)...`);

  while (hasMore) {
    try {
      // Utiliser l'API v2 avec GET (plus stable)
      const response = await fetch(
        `${JIRA_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&fields=key,summary,issuetype,status,reporter`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ⚠️  Erreur HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        hasMore = false;
        break;
      }

      const result = await response.json();
      
      if (result.errorMessages && result.errorMessages.length > 0) {
        console.log(`   ⚠️  Erreur JQL: ${result.errorMessages[0]}`);
        hasMore = false;
        break;
      }

      totalFound = result.total || 0;
      const issues = result.issues || [];
      
      // Filtrer par reporter accountId
      const filteredIssues = issues.filter(issue => {
        const reporter = issue.fields?.reporter;
        return reporter && (
          reporter.accountId === EDWIDGE_JIRA_ACCOUNT_ID ||
          reporter.accountId === `712020:${EDWIDGE_JIRA_ACCOUNT_ID}` ||
          (reporter.displayName && reporter.displayName.toLowerCase().includes('edwidge'))
        );
      });
      
      allIssues = allIssues.concat(filteredIssues);
      
      hasMore = issues.length === maxResults;
      startAt += maxResults;

      if (allIssues.length > 0 || startAt % 500 === 0) {
        console.log(`   📊 ${allIssues.length} tickets d'Edwidge trouvés sur ${startAt}/${totalFound} analysés...`);
      }

      // Pause pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ❌ Erreur lors de la recherche: ${error.message}`);
      hasMore = false;
      break;
    }
  }

  return allIssues;
}

/**
 * Fonction principale
 */
async function importEdwigeTickets() {
  try {
    // 1. Trouver le profil "Edwige KOUASSI" (agent) dans Supabase
    console.log('🔍 Recherche du profil "Edwige KOUASSI" dans Supabase...');
    const { data: edwigeProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, jira_user_id')
      .ilike('full_name', '%edwige%kouassi%')
      .eq('role', 'agent')
      .limit(1)
      .single();

    if (profileError || !edwigeProfile) {
      console.error('❌ Profil "Edwige KOUASSI" (agent) non trouvé dans Supabase');
      console.error('   Erreur:', profileError?.message);
      return;
    }

    console.log(`✅ Profil trouvé: ${edwigeProfile.full_name} (${edwigeProfile.email})`);
    console.log(`   ID Supabase: ${edwigeProfile.id}\n`);

    // 2. Rechercher tous les tickets dans JIRA
    console.log('🔍 Recherche des tickets dans JIRA...');
    console.log(`   JQL: project = OD AND reporter = ${EDWIDGE_JIRA_ACCOUNT_ID} AND (issuetype = Bug OR issuetype = "Requêtes")\n`);
    
    const jiraTickets = await searchTicketsInJira();
    console.log(`✅ ${jiraTickets.length} tickets trouvés dans JIRA\n`);

    if (jiraTickets.length === 0) {
      console.log('⚠️  Aucun ticket à importer.');
      return;
    }

    // 3. Traiter chaque ticket
    console.log('🔄 Import des tickets depuis JIRA...\n');
    let processed = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    for (const jiraTicket of jiraTickets) {
      processed++;
      const jiraKey = jiraTicket.key;

      try {
        console.log(`[${processed}/${jiraTickets.length}] ${jiraKey}...`);

        // Récupérer et mapper depuis JIRA
        const result = await fetchAndMapTicketFromJira(jiraKey, edwigeProfile.id);

        if (result.error) {
          console.error(`   ❌ ${result.error}`);
          errors++;
          errorDetails.push({ jiraKey, error: result.error });
          continue;
        }

        // Créer ou mettre à jour dans Supabase
        const upsertResult = await upsertTicketInSupabase(result.data);

        if (upsertResult.error) {
          console.error(`   ❌ Erreur Supabase: ${upsertResult.error}`);
          errors++;
          errorDetails.push({ jiraKey, error: upsertResult.error });
        } else {
          // Vérifier si c'était une création ou une mise à jour
          const { data: existing } = await supabase
            .from('tickets')
            .select('id')
            .eq('jira_issue_key', jiraKey)
            .limit(1)
            .maybeSingle();

          if (existing && !DRY_RUN) {
            console.log(`   🔄 Mis à jour`);
            updated++;
          } else {
            console.log(`   ➕ Créé`);
            created++;
          }
        }

        // Pause pour éviter le rate limiting
        if (processed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`   ❌ Erreur inattendue: ${error.message}`);
        errors++;
        errorDetails.push({ jiraKey, error: error.message });
      }
    }

    // 4. Résumé
    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(`   ✅ Tickets traités: ${processed}`);
    console.log(`   ➕ Tickets créés: ${created}`);
    console.log(`   🔄 Tickets mis à jour: ${updated}`);
    console.log(`   ❌ Erreurs: ${errors}`);

    if (errorDetails.length > 0 && errorDetails.length <= 20) {
      console.log('\n════════════════════════════════════════════════════════════════════════════════');
      console.log('❌ DÉTAILS DES ERREURS');
      console.log('════════════════════════════════════════════════════════════════════════════════');
      errorDetails.slice(0, 20).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.jiraKey}: ${err.error}`);
      });
      if (errorDetails.length > 20) {
        console.log(`   ... et ${errorDetails.length - 20} autres erreurs`);
      }
    }

    console.log('\n✅ Import terminé');
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

importEdwigeTickets();

