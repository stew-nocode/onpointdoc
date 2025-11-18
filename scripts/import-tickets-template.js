/* eslint-disable no-console */
/**
 * Template pour l'import des tickets depuis JIRA/Airtable
 * 
 * Ce script sert de base pour l'import des tickets.
 * Il gère :
 * - Le mapping JIRA → Supabase
 * - Les dépendances (profiles, products, modules, etc.)
 * - La création des relations (jira_sync, ticket_status_history)
 * 
 * Usage: node scripts/import-tickets.js
 * 
 * Variables d'environnement requises:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// ============================================
// MAPPING DES DONNÉES
// ============================================

/**
 * Mapping des types JIRA → Supabase
 */
const typeMap = {
  'Bug': 'BUG',
  'Task': 'REQ',
  'Story': 'REQ',
  'Sub-task': 'REQ',
  'Epic': 'REQ',
  'Improvement': 'REQ'
};

/**
 * Mapping des statuts JIRA → Supabase
 */
const statusMap = {
  'To Do': 'Nouveau',
  'In Progress': 'En_cours',
  'Done': 'Resolue',
  'Closed': 'Resolue',
  'Resolved': 'Resolue',
  'Reopened': 'En_cours',
  'In Review': 'En_cours',
  'Blocked': 'En_cours'
};

/**
 * Mapping des priorités JIRA → Supabase
 */
const priorityMap = {
  'Lowest': 'Low',
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Highest': 'High',
  'Critical': 'High',
  'Blocker': 'High'
};

/**
 * Mapping des canaux JIRA → Supabase
 */
const channelMap = {
  'Email': 'Email',
  'WhatsApp': 'Whatsapp',
  'Phone': 'Appel',
  'Other': 'Autre'
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Récupère l'ID Supabase d'un profil par email
 */
async function getProfileIdByEmail(email) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  return data?.id;
}

/**
 * Récupère l'ID Supabase d'une entreprise par ID JIRA
 */
async function getCompanyIdByJiraId(jiraCompanyId) {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('jira_company_id', jiraCompanyId)
    .single();
  return data?.id;
}

/**
 * Récupère l'ID Supabase d'un produit par nom
 */
async function getProductIdByName(name) {
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('name', name)
    .single();
  return data?.id;
}

/**
 * Récupère l'ID Supabase d'un module par nom et product_id
 */
async function getModuleIdByName(name, productId) {
  const { data } = await supabase
    .from('modules')
    .select('id')
    .eq('name', name)
    .eq('product_id', productId)
    .single();
  return data?.id;
}

// ============================================
// IMPORT DES TICKETS
// ============================================

/**
 * Transforme une ligne de données source en ticket Supabase
 */
async function transformTicketToSupabase(row) {
  // Exemple de structure de row (à adapter selon vos données)
  // {
  //   "JIRA Key": "PROJ-123",
  //   "Titre": "Bug dans le calcul",
  //   "Description": "...",
  //   "Type": "Bug",
  //   "Statut": "In Progress",
  //   "Priorité": "High",
  //   "Canal": "Email",
  //   "Email Contact": "client@example.com",
  //   "Entreprise JIRA ID": 11103,
  //   "Produit": "OBC",
  //   "Module": "RH",
  //   "Créé par": "agent@example.com",
  //   "Assigné à": "manager@example.com",
  //   "Date création": "2024-01-15T10:00:00Z"
  // }

  // Mapping des IDs
  const contactEmail = row['Email Contact'] || row['Contact Email'];
  const contactUserId = await getProfileIdByEmail(contactEmail);
  if (!contactUserId) {
    throw new Error(`Contact non trouvé: ${contactEmail}`);
  }

  const productName = row['Produit'] || row['Product'];
  const productId = await getProductIdByName(productName);
  if (!productId) {
    throw new Error(`Produit non trouvé: ${productName}`);
  }

  const moduleName = row['Module'] || row['Module Name'];
  const moduleId = await getModuleIdByName(moduleName, productId);
  if (!moduleId) {
    throw new Error(`Module non trouvé: ${moduleName} pour produit ${productName}`);
  }

  const createdByEmail = row['Créé par'] || row['Created By'];
  const createdBy = await getProfileIdByEmail(createdByEmail);
  if (!createdBy) {
    throw new Error(`Créateur non trouvé: ${createdByEmail}`);
  }

  // Mapping optionnel
  let assignedTo = null;
  if (row['Assigné à'] || row['Assigned To']) {
    assignedTo = await getProfileIdByEmail(row['Assigné à'] || row['Assigned To']);
  }

  let submoduleId = null;
  if (row['Sous-module'] || row['Submodule']) {
    // À implémenter selon votre structure
  }

  let featureId = null;
  if (row['Fonctionnalité'] || row['Feature']) {
    // À implémenter selon votre structure
  }

  // Construction du ticket
  const ticket = {
    title: row['Titre'] || row['Title'] || row['Summary'],
    description: row['Description'] || null,
    ticket_type: typeMap[row['Type']] || 'BUG',
    status: statusMap[row['Statut']] || 'En_cours',
    priority: priorityMap[row['Priorité']] || 'Medium',
    canal: channelMap[row['Canal']] || 'Autre',
    contact_user_id: contactUserId,
    product_id: productId,
    module_id: moduleId,
    submodule_id: submoduleId,
    feature_id: featureId,
    created_by: createdBy,
    assigned_to: assignedTo,
    jira_issue_key: row['JIRA Key'] || row['Issue Key'],
    origin: 'jira',
    created_at: row['Date création'] || new Date().toISOString(),
    updated_at: row['Date modification'] || new Date().toISOString()
  };

  return ticket;
}

async function importTickets(ticketsData) {
  console.log(`\n🚀 Import de ${ticketsData.length} tickets...\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const row of ticketsData) {
    try {
      // Transformer la ligne en ticket Supabase
      const ticket = await transformTicketToSupabase(row);

      // Insérer le ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticket)
        .select('id, jira_issue_key')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Créer l'entrée jira_sync
      await supabase.from('jira_sync').insert({
        ticket_id: data.id,
        jira_issue_key: ticket.jira_issue_key,
        origin: 'jira',
        last_synced_at: new Date().toISOString()
      });

      // Créer l'entrée ticket_status_history
      await supabase.from('ticket_status_history').insert({
        ticket_id: data.id,
        status_to: ticket.status,
        changed_by: ticket.created_by,
        changed_at: ticket.created_at,
        source: 'jira'
      });

      console.log(`✅ "${ticket.title}" importé (${data.jira_issue_key})`);
      successCount++;
    } catch (err) {
      const errorMsg = err.message || 'Erreur inconnue';
      console.error(`❌ Erreur pour "${row['Titre'] || row['Title']}": ${errorMsg}`);
      errors.push({ row: row['Titre'] || row['Title'], error: errorMsg });
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Importés: ${successCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  if (errors.length > 0) {
    console.log(`\n❌ Détails des erreurs:`);
    errors.forEach(({ row, error }) => {
      console.log(`   - ${row}: ${error}`);
    });
  }
  console.log(`\n✨ Import terminé!\n`);
}

// ============================================
// DONNÉES À IMPORTER (à remplacer par vos données)
// ============================================

const ticketsData = [
  // Exemple de structure (à remplacer par vos vraies données)
  // {
  //   "JIRA Key": "PROJ-123",
  //   "Titre": "Bug dans le calcul",
  //   "Description": "Le calcul de la paie est incorrect",
  //   "Type": "Bug",
  //   "Statut": "In Progress",
  //   "Priorité": "High",
  //   "Canal": "Email",
  //   "Email Contact": "client@example.com",
  //   "Entreprise JIRA ID": 11103,
  //   "Produit": "OBC",
  //   "Module": "RH",
  //   "Créé par": "agent@example.com",
  //   "Date création": "2024-01-15T10:00:00Z"
  // }
];

// Exécuter l'import
if (ticketsData.length > 0) {
  importTickets(ticketsData)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Erreur fatale:', err);
      process.exit(1);
    });
} else {
  console.log('⚠️  Aucune donnée à importer. Ajoutez vos données dans ticketsData.');
  process.exit(0);
}

