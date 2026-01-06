/**
 * Script pour corriger le profil "Ulrich GBO" dans Supabase
 * - Récupère l'accountId JIRA depuis un ticket assigné à Ulrich GBO
 * - Met à jour le profil avec jira_user_id et rôle "agent"
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const JIRA_URL = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const JIRA_USERNAME = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const JIRA_TOKEN = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

if (!JIRA_URL || !JIRA_USERNAME || !JIRA_TOKEN) {
  console.error('❌ Variables d\'environnement JIRA manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration JIRA
const jiraAuth = Buffer.from(`${JIRA_USERNAME}:${JIRA_TOKEN}`).toString('base64');

// ID du profil Ulrich GBO dans Supabase
const ULRICH_PROFILE_ID = 'ba09620a-09a9-4a11-a6d0-f95177ab5fe8';

// Tickets JIRA assignés à Ulrich GBO (pour récupérer l'accountId)
const TICKETS_TO_CHECK = ['OD-3001', 'OD-1849', 'OD-1660', 'OD-869'];

/**
 * Récupère l'accountId JIRA de l'assigné depuis un ticket JIRA
 */
async function getJiraAssigneeAccountId(jiraIssueKey) {
  try {
    const response = await fetch(`${JIRA_URL}/rest/api/3/issue/${jiraIssueKey}?fields=assignee`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${jiraAuth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur JIRA (${response.status}) pour ${jiraIssueKey}:`, errorText);
      return null;
    }

    const issue = await response.json();
    const assignee = issue.fields?.assignee;

    if (!assignee) {
      console.warn(`⚠️ Aucun assigné trouvé pour ${jiraIssueKey}`);
      return null;
    }

    const accountId = assignee.accountId;
    const displayName = assignee.displayName;

    console.log(`✅ Ticket ${jiraIssueKey}:`);
    console.log(`   - Assigné: ${displayName}`);
    console.log(`   - AccountId: ${accountId}`);

    return { accountId, displayName };
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération du ticket ${jiraIssueKey}:`, error.message);
    return null;
  }
}

/**
 * Met à jour le profil Ulrich GBO dans Supabase
 */
async function updateUlrichProfile(jiraAccountId) {
  try {
    console.log(`\n🔄 Mise à jour du profil Ulrich GBO...`);
    console.log(`   - jira_user_id: ${jiraAccountId}`);
    console.log(`   - role: agent`);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        jira_user_id: jiraAccountId,
        role: 'agent'
      })
      .eq('id', ULRICH_PROFILE_ID)
      .select('id, full_name, jira_user_id, role')
      .single();

    if (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      return false;
    }

    console.log('✅ Profil mis à jour avec succès:');
    console.log(`   - ID: ${data.id}`);
    console.log(`   - Nom: ${data.full_name}`);
    console.log(`   - jira_user_id: ${data.jira_user_id}`);
    console.log(`   - role: ${data.role}`);

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    return false;
  }
}

/**
 * Vérifie le profil actuel
 */
async function checkCurrentProfile() {
  console.log('🔍 Vérification du profil actuel...\n');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, jira_user_id, role, is_active')
    .eq('id', ULRICH_PROFILE_ID)
    .single();

  if (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    return null;
  }

  console.log('📋 Profil actuel:');
  console.log(`   - ID: ${data.id}`);
  console.log(`   - Nom: ${data.full_name}`);
  console.log(`   - Email: ${data.email || 'null'}`);
  console.log(`   - jira_user_id: ${data.jira_user_id || 'NULL ⚠️'}`);
  console.log(`   - role: ${data.role}`);
  console.log(`   - is_active: ${data.is_active}`);

  return data;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Script de correction du profil Ulrich GBO\n');
  console.log('='.repeat(60));

  // 1. Vérifier le profil actuel
  const currentProfile = await checkCurrentProfile();
  if (!currentProfile) {
    console.error('❌ Impossible de récupérer le profil');
    process.exit(1);
  }

  // 2. Récupérer l'accountId JIRA depuis un ticket
  console.log('\n🔍 Récupération de l\'accountId JIRA...\n');
  let jiraAccountId = null;
  let assigneeName = null;

  for (const ticketKey of TICKETS_TO_CHECK) {
    const result = await getJiraAssigneeAccountId(ticketKey);
    if (result && result.accountId) {
      jiraAccountId = result.accountId;
      assigneeName = result.displayName;
      break;
    }
    // Attendre un peu entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!jiraAccountId) {
    console.error('\n❌ Impossible de récupérer l\'accountId JIRA depuis les tickets');
    console.log('💡 Vérifiez que les tickets sont bien assignés à Ulrich GBO dans JIRA');
    process.exit(1);
  }

  // 3. Vérifier que le nom correspond
  if (assigneeName && !assigneeName.toLowerCase().includes('ulrich') && !assigneeName.toLowerCase().includes('gbo')) {
    console.warn(`\n⚠️ Attention: Le nom de l'assigné dans JIRA est "${assigneeName}"`);
    console.warn('   Cela ne correspond pas exactement à "Ulrich GBO"');
    console.log('   Continuer quand même ? (vérifiez manuellement si nécessaire)');
  }

  // 4. Mettre à jour le profil
  console.log('\n' + '='.repeat(60));
  const success = await updateUlrichProfile(jiraAccountId);

  if (success) {
    console.log('\n✅ Correction terminée avec succès !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Réassigner Ulrich GBO à un ticket dans JIRA');
    console.log('   2. Vérifier que l\'assignation se synchronise dans l\'app');
    console.log('   3. Vérifier les logs pour confirmer le mapping');
  } else {
    console.error('\n❌ Échec de la correction');
    process.exit(1);
  }
}

// Exécuter le script
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

