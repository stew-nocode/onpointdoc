#!/usr/bin/env node

/**
 * Script pour importer les tickets depuis le CSV Jira
 * 
 * Actions:
 * 1. Lit le CSV des tickets
 * 2. Lit le fichier de correspondance OBCS → OD
 * 3. Mappe les clés OBCS vers OD
 * 4. Met à jour les tickets existants (upsert par jira_issue_key)
 * 5. Crée les entreprises manquantes (sauf exclusions)
 * 6. Crée les utilisateurs manquants
 * 7. Ignore les tickets avec entreprises exclues ou utilisateurs "inconnu"/"non renseigné"
 * 8. Utilise les IDs CSV pour modules/sous-modules/fonctionnalités
 * 9. Mappe les statuts, priorités, canaux, types de bug
 * 
 * Usage:
 *   node scripts/import-tickets-from-csv.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { shouldExcludeCompany } from './config/excluded-companies.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local en priorité si présent
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

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

// Chemins des fichiers
const TICKETS_CSV_PATH = path.join(
  __dirname,
  '../docs/ticket/premier liste de ticket - Tous les tickets Bug et requêtes support mis à jour - Tous les tickets Bug et requêtes support mis à jour-Grid view (1).csv (1).csv'
);
const CORRESPONDANCE_CSV_PATH = path.join(
  __dirname,
  '../docs/ticket/correspondance - Jira (3).csv'
);

/**
 * Charge et parse le fichier de correspondance OBCS → OD
 */
function loadCorrespondanceMapping() {
  console.log('📖 Chargement du fichier de correspondance OBCS → OD...');
  
  try {
    const content = readFileSync(CORRESPONDANCE_CSV_PATH, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const mapping = new Map();
    for (const record of records) {
      const obcsKey = record['Lien de ticket sortant (Duplicate)']?.trim();
      const odKey = record['Clé de ticket']?.trim();
      
      if (obcsKey && odKey && obcsKey.startsWith('OBCS-')) {
        mapping.set(obcsKey, odKey);
      }
    }

    console.log(`✅ ${mapping.size} correspondances OBCS → OD chargées\n`);
    return mapping;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la correspondance:', error.message);
    return new Map();
  }
}

/**
 * Mappe une clé OBCS vers OD si nécessaire
 */
function mapJiraKey(jiraKey, correspondanceMap) {
  if (!jiraKey) return null;
  
  const trimmed = jiraKey.trim();
  
  // Si c'est déjà une clé OD, la retourner telle quelle (même sans correspondance dans le fichier)
  if (trimmed.startsWith('OD-')) {
    return trimmed;
  }
  
  // Si c'est une clé OBCS, chercher la correspondance
  if (trimmed.startsWith('OBCS-')) {
    const odKey = correspondanceMap.get(trimmed);
    if (odKey) {
      return odKey;
    }
    // Si pas de correspondance, retourner null (ticket ignoré)
    console.warn(`⚠️  Pas de correspondance OD pour ${trimmed} - ticket ignoré`);
    return null;
  }
  
  // Autre format, retourner tel quel
  return trimmed;
}

/**
 * Normalise le nom d'utilisateur pour vérifier s'il doit être ignoré
 */
function shouldIgnoreUser(userName) {
  if (!userName) return true;
  
  const normalized = userName.trim().toUpperCase();
  return (
    normalized === '' ||
    normalized.startsWith('INCONNU') ||
    normalized.startsWith('NON RENSEIGNÉ') ||
    normalized.startsWith('NON RENSEIGNE')
  );
}

/**
 * Mappe la priorité du CSV vers l'enum Supabase
 */
function mapPriority(csvPriority) {
  if (!csvPriority) return 'Medium';
  
  const normalized = csvPriority.trim().toUpperCase();
  
  // Mapping Priorité 1 → Critical, Priorité 2 → High, etc.
  if (normalized.includes('PRIORITÉ 1') || normalized.includes('PRIORITE 1')) {
    return 'Critical';
  }
  if (normalized.includes('PRIORITÉ 2') || normalized.includes('PRIORITE 2')) {
    return 'High';
  }
  if (normalized.includes('PRIORITÉ 3') || normalized.includes('PRIORITE 3')) {
    return 'Medium';
  }
  if (normalized.includes('PRIORITÉ 4') || normalized.includes('PRIORITE 4')) {
    return 'Low';
  }
  
  // Valeurs directes
  if (normalized === 'CRITICAL' || normalized === 'CRITIQUE') return 'Critical';
  if (normalized === 'HIGH' || normalized === 'HAUTE') return 'High';
  if (normalized === 'MEDIUM' || normalized === 'MOYENNE') return 'Medium';
  if (normalized === 'LOW' || normalized === 'FAIBLE') return 'Low';
  
  return 'Medium'; // Par défaut
}

/**
 * Normalise le canal pour correspondre à l'enum Supabase
 */
function normalizeCanal(csvCanal) {
  if (!csvCanal) return null;
  
  const normalized = csvCanal.trim();
  
  // Mapping spécial : "Non renseigné" → "Non enregistré" (valeur existante dans l'enum)
  if (normalized === 'Non renseigné' || normalized === 'Non renseigne') {
    return 'Non enregistré';
  }
  
  // Mapping des canaux
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
    'En prsentiel': 'En prsentiel', // Typo dans l'enum
    'Non enregistré': 'Non enregistré',
    'Online (Google Meet, Teams...)': 'Online (Google Meet, Teams...)',
    'Autre': 'Autre'
  };
  
  return canalMap[normalized] || normalized;
}

/**
 * Normalise le type de bug pour correspondre à l'enum Supabase
 */
function normalizeBugType(csvBugType) {
  if (!csvBugType) return null;
  
  const normalized = csvBugType.trim();
  
  // Les valeurs doivent correspondre exactement à l'enum bug_type_enum
  const validTypes = [
    'Autres',
    'Mauvais déversement des données',
    'Dysfonctionnement sur le Calcul des salaires',
    'Duplication anormale',
    'Enregistrement impossible',
    'Page d\'erreur',
    'Historique vide/non exhaustif',
    'Non affichage de pages/données',
    'Lenteur Système',
    'Import de fichiers impossible',
    'Suppression impossible',
    'Récupération de données impossible',
    'Edition impossible',
    'Dysfonctionnement des filtres',
    'Error 503',
    'Impression impossible',
    'Erreur de calcul/Erreur sur Dashboard',
    'Dysfonctionnement Workflow',
    'Erreur serveur',
    'Dysfonctionnement des liens d\'accès',
    'Formulaire indisponible',
    'Erreur Ajax',
    'Export de données impossible',
    'Connexion impossible'
  ];
  
  // Vérifier si le type correspond exactement
  if (validTypes.includes(normalized)) {
    return normalized;
  }
  
  // Si pas de correspondance exacte, retourner null (sera ignoré)
  console.warn(`⚠️  Type de bug non reconnu: ${normalized}`);
  return null;
}

/**
 * Mappe le type de ticket
 */
function mapTicketType(csvType) {
  if (!csvType) return 'BUG';
  
  const normalized = csvType.trim().toUpperCase();
  
  if (normalized === 'BUG') return 'BUG';
  if (normalized === 'REQ' || normalized === 'REQUÊTE' || normalized === 'REQUETE') return 'REQ';
  if (normalized === 'ASSISTANCE') return 'ASSISTANCE';
  
  return 'BUG'; // Par défaut
}

/**
 * Parse une date depuis le format CSV
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Format attendu: "23/10/2025 22:00" ou "2025-10-23 22:00"
    const cleaned = dateStr.trim();
    
    // Si format DD/MM/YYYY
    if (cleaned.includes('/')) {
      const [datePart, timePart] = cleaned.split(' ');
      const [day, month, year] = datePart.split('/');
      const date = new Date(`${year}-${month}-${day}${timePart ? ' ' + timePart : ''}`);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }
    
    // Si format ISO ou autre
    const date = new Date(cleaned);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Trouve ou crée une entreprise
 */
async function findOrCreateCompany(companyName) {
  if (!companyName || shouldExcludeCompany(companyName)) {
    return null;
  }
  
  const normalized = companyName.trim();
  
  // Chercher l'entreprise existante
  const { data: existing, error: searchError } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', normalized)
    .limit(1)
    .single();
  
  if (existing) {
    return existing.id;
  }
  
  // Créer l'entreprise
  const { data: created, error: createError } = await supabase
    .from('companies')
    .insert({ name: normalized })
    .select('id')
    .single();
  
  if (createError) {
    console.error(`❌ Erreur lors de la création de l'entreprise "${normalized}":`, createError.message);
    return null;
  }
  
  console.log(`✅ Entreprise créée: ${normalized}`);
  return created.id;
}

/**
 * Trouve ou crée un utilisateur (client)
 */
async function findOrCreateUser(userName, email, companyId) {
  if (shouldIgnoreUser(userName)) {
    return null;
  }
  
  const normalizedName = userName.trim();
  
  // Chercher l'utilisateur existant par nom (case-insensitive)
  const { data: existing, error: searchError } = await supabase
    .from('profiles')
    .select('id, full_name, email, company_id')
    .ilike('full_name', normalizedName)
    .eq('role', 'client')
    .limit(1)
    .single();
  
  if (existing) {
    // Mettre à jour l'entreprise si nécessaire
    if (companyId && !existing.company_id) {
      await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', existing.id);
    }
    return existing.id;
  }
  
  // Créer l'utilisateur
  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({
      full_name: normalizedName,
      email: email || null,
      role: 'client',
      company_id: companyId || null
    })
    .select('id')
    .single();
  
  if (createError) {
    console.error(`❌ Erreur lors de la création de l'utilisateur "${normalizedName}":`, createError.message);
    return null;
  }
  
  console.log(`✅ Utilisateur créé: ${normalizedName}`);
  return created.id;
}

/**
 * Trouve un agent par nom (gère les accents et variations)
 */
async function findAgentByName(agentName) {
  if (!agentName || shouldIgnoreUser(agentName)) {
    return null;
  }
  
  const normalizedName = agentName.trim();
  
  // Chercher d'abord avec une recherche exacte (case-insensitive)
  let { data: agent, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .ilike('full_name', normalizedName)
    .in('role', ['agent', 'manager'])
    .limit(1)
    .maybeSingle();
  
  // Si pas trouvé, chercher avec une recherche plus flexible (sans accents)
  if (!agent && !error) {
    // Normaliser le nom pour la recherche (enlever accents, mettre en majuscules)
    const searchName = normalizedName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    
    // Récupérer tous les agents/managers et chercher manuellement
    const { data: allAgents } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['agent', 'manager']);
    
    if (allAgents) {
      agent = allAgents.find(a => {
        const agentNameNormalized = (a.full_name || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase();
        return agentNameNormalized === searchName;
      });
    }
  }
  
  if (!agent) {
    console.warn(`⚠️  Agent non trouvé: ${normalizedName}`);
    return null;
  }
  
  return agent.id;
}

/**
 * Importe les tickets depuis le CSV
 */
async function importTickets() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📥 IMPORT DES TICKETS DEPUIS LE CSV JIRA');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // 1. Charger le mapping de correspondance OBCS → OD
  const correspondanceMap = loadCorrespondanceMapping();

  // 2. Charger le CSV des tickets
  console.log('📖 Chargement du CSV des tickets...');
  const csvContent = readFileSync(TICKETS_CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  console.log(`✅ ${records.length} tickets trouvés dans le CSV\n`);

  // 3. Statistiques
  let processed = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  // 4. Traiter chaque ticket
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    
    try {
      // Récupérer les colonnes du CSV
      const csvJiraKey = row['Clé de ticket']?.trim();
      const title = row['Résumé']?.trim();
      const description = row['Description']?.trim();
      const jiraIssueId = row['ID Jira Clé de ticket']?.trim();
      const companyName = row['Entreprises']?.trim();
      const reporterName = row['Rapporteur']?.trim();
      const userName = row['Utilisateurs']?.trim();
      const canal = row['Canal']?.trim();
      const moduleName = row['Module']?.trim();
      const submoduleName = row['Sous-Module(s)']?.trim();
      const featureName = row['Fonctionnalités']?.trim();
      const ticketType = row['Type_Ticket']?.trim();
      const priority = row['Priorité']?.trim();
      const bugType = row['Type de bug']?.trim();
      const status = row['Etat']?.trim();
      const createdDate = row['Date de creation de Jira']?.trim();
      const resolvedDate = row['Date de résolution']?.trim();
      const updatedDate = row['Date de mise à jour Jira']?.trim();
      
      // IDs Jira depuis le CSV (rechercher les UUID correspondants dans Supabase)
      const moduleJiraId = row['ID Module']?.trim();
      const submoduleJiraId = row['ID Sous-Module(s)']?.trim();
      const featureJiraId = row['ID Fonctionnalités']?.trim();
      const projectJiraId = row['ID Projet']?.trim();

      // Vérifier les champs requis
      if (!csvJiraKey || !title) {
        skipped++;
        continue;
      }

      // Mapper la clé Jira OBCS → OD
      const jiraIssueKey = mapJiraKey(csvJiraKey, correspondanceMap);
      if (!jiraIssueKey) {
        skipped++;
        continue;
      }

      // Vérifier l'entreprise (exclure si nécessaire)
      if (shouldExcludeCompany(companyName)) {
        skipped++;
        continue;
      }

      // Trouver ou créer l'entreprise
      let companyId = null;
      if (companyName) {
        companyId = await findOrCreateCompany(companyName);
      }

      // Trouver ou créer l'utilisateur client
      let contactUserId = null;
      if (userName && !shouldIgnoreUser(userName)) {
        contactUserId = await findOrCreateUser(userName, null, companyId);
        if (!contactUserId) {
          skipped++;
          continue;
        }
      }

      // Trouver l'agent rapporteur
      let createdBy = null;
      if (reporterName) {
        createdBy = await findAgentByName(reporterName);
      }

      // Trouver les IDs Supabase depuis les IDs Jira
      let moduleId = null;
      if (moduleJiraId) {
        const { data: module } = await supabase
          .from('modules')
          .select('id')
          .eq('id_module_jira', parseInt(moduleJiraId))
          .limit(1)
          .maybeSingle();
        moduleId = module?.id || null;
      }

      let submoduleId = null;
      if (submoduleJiraId) {
        const { data: submodule } = await supabase
          .from('submodules')
          .select('id')
          .eq('id_module_jira', parseInt(submoduleJiraId))
          .limit(1)
          .maybeSingle();
        submoduleId = submodule?.id || null;
      }

      let featureId = null;
      if (featureJiraId) {
        const { data: feature } = await supabase
          .from('features')
          .select('id')
          .eq('jira_feature_id', parseInt(featureJiraId))
          .limit(1)
          .maybeSingle();
        featureId = feature?.id || null;
      }

      let productId = null;
      if (projectJiraId) {
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('jira_product_id', parseInt(projectJiraId))
          .limit(1)
          .maybeSingle();
        productId = product?.id || null;
      }

      // Mapper les valeurs
      const mappedTicketType = mapTicketType(ticketType);
      const mappedPriority = mapPriority(priority);
      const mappedCanal = normalizeCanal(canal);
      const mappedBugType = normalizeBugType(bugType);
      const mappedStatus = status || 'Nouveau';
      const createdAt = parseDate(createdDate);
      const resolvedAt = parseDate(resolvedDate);
      const updatedAt = parseDate(updatedDate);

      // Vérifier si le ticket existe déjà (uniquement pour les statistiques)
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id')
        .eq('jira_issue_key', jiraIssueKey)
        .limit(1)
        .maybeSingle();

      // Préparer les données du ticket
      const ticketData = {
        title,
        description: description || null,
        ticket_type: mappedTicketType,
        status: mappedStatus,
        priority: mappedPriority,
        canal: mappedCanal,
        jira_issue_key: jiraIssueKey,
        jira_issue_id: jiraIssueId || null,
        product_id: productId || null,
        module_id: moduleId || null,
        submodule_id: submoduleId || null,
        feature_id: featureId || null,
        company_id: companyId || null,
        contact_user_id: contactUserId || null,
        created_by: createdBy || null,
        bug_type: mappedBugType,
        resolved_at: resolvedAt || null,
        origin: 'jira',
        created_at: createdAt || new Date().toISOString(),
        updated_at: updatedAt || new Date().toISOString()
      };

      // Nettoyer les valeurs vides (convertir '' en null)
      Object.keys(ticketData).forEach(key => {
        if (ticketData[key] === '') {
          ticketData[key] = null;
        }
      });

      // Utiliser UPSERT pour éviter les duplicate key errors et les race conditions
      const { data: upsertedTicket, error: upsertError } = await supabase
        .from('tickets')
        .upsert(ticketData, {
          onConflict: 'jira_issue_key',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (upsertError) {
        errors.push({ jiraKey: jiraIssueKey, error: upsertError.message });
        console.error(`❌ Erreur lors de l'upsert du ticket ${jiraIssueKey}:`, upsertError.message);
      } else {
        // Compter comme créé ou mis à jour selon l'existence préalable
        if (existingTicket) {
          updated++;
        } else {
          created++;
        }
        
        if ((i + 1) % 50 === 0) {
          console.log(`   📊 Progression: ${i + 1}/${records.length} tickets traités...`);
        }
      }

      processed++;
    } catch (error) {
      errors.push({ row: i + 1, error: error.message });
      console.error(`❌ Erreur lors du traitement de la ligne ${i + 1}:`, error.message);
      skipped++;
    }
  }

  // 5. Afficher le résumé
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log(`   ✅ Tickets traités: ${processed}`);
  console.log(`   ➕ Tickets créés: ${created}`);
  console.log(`   🔄 Tickets mis à jour: ${updated}`);
  console.log(`   ⏭️  Tickets ignorés: ${skipped}`);
  console.log(`   ❌ Erreurs: ${errors.length}\n`);

  if (errors.length > 0) {
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('❌ ERREURS DÉTECTÉES');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.jiraKey || `Ligne ${err.row}`}: ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... et ${errors.length - 10} autres erreurs`);
    }
    console.log('');
  }

  console.log('✅ Import terminé');
}

// Exécuter l'import
importTickets().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

