/**
 * Script pour synchroniser un ticket spécifique depuis JIRA
 * Usage: node scripts/sync-single-ticket.mjs OD-2993
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const jiraIssueKey = process.argv[2];

if (!jiraIssueKey) {
  console.error('❌ Usage: node scripts/sync-single-ticket.mjs <JIRA_ISSUE_KEY>');
  console.error('   Exemple: node scripts/sync-single-ticket.mjs OD-2993');
  process.exit(1);
}

const JIRA_URL = (process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '').replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_USERNAME = (process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '').replace(/^["']|["']$/g, '').trim();
const JIRA_TOKEN = (process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '').replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

if (!JIRA_URL || !JIRA_USERNAME || !JIRA_TOKEN) {
  console.error('❌ Variables JIRA manquantes');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_TOKEN}`).toString('base64');

async function syncTicket() {
  console.log(`🔄 Synchronisation du ticket ${jiraIssueKey}...\n`);

  try {
    // 1. Récupérer le ticket Supabase
    console.log('📥 Récupération du ticket Supabase...');
    const ticketResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?jira_issue_key=eq.${jiraIssueKey}&select=id,title,status,ticket_type`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!ticketResponse.ok) {
      throw new Error(`Erreur Supabase (${ticketResponse.status})`);
    }

    const tickets = await ticketResponse.json();
    if (!tickets || tickets.length === 0) {
      console.error(`❌ Ticket Supabase non trouvé pour ${jiraIssueKey}`);
      process.exit(1);
    }

    const ticket = tickets[0];
    console.log(`✅ Ticket trouvé: ${ticket.title}`);
    console.log(`   Statut actuel Supabase: "${ticket.status}"\n`);

    // 2. Récupérer le statut JIRA
    console.log('📥 Récupération du statut JIRA...');
    const jiraResponse = await fetch(`${JIRA_URL}/rest/api/3/issue/${jiraIssueKey}?fields=status,priority,updated`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!jiraResponse.ok) {
      const errorText = await jiraResponse.text();
      throw new Error(`Erreur JIRA (${jiraResponse.status}): ${errorText}`);
    }

    const jiraIssue = await jiraResponse.json();
    const jiraStatus = jiraIssue.fields?.status?.name || '';
    console.log(`✅ Statut JIRA: "${jiraStatus}"\n`);

    if (ticket.status === jiraStatus) {
      console.log('ℹ️  Les statuts sont déjà synchronisés');
      return;
    }

    // 3. Mettre à jour le ticket Supabase
    console.log(`🔄 Mise à jour: "${ticket.status}" → "${jiraStatus}"\n`);
    
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticket.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: jiraStatus,
          last_update_source: 'jira',
          updated_at: jiraIssue.fields.updated || new Date().toISOString()
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Erreur mise à jour (${updateResponse.status}): ${errorText}`);
    }

    // 4. Enregistrer dans ticket_status_history
    await fetch(
      `${SUPABASE_URL}/rest/v1/ticket_status_history`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticket.id,
          status_from: ticket.status,
          status_to: jiraStatus,
          source: 'jira'
        })
      }
    );

    // 5. Mettre à jour jira_sync
    await fetch(
      `${SUPABASE_URL}/rest/v1/jira_sync?ticket_id=eq.${ticket.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jira_status: jiraStatus,
          last_status_sync: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          sync_error: null
        })
      }
    );

    console.log('✅ Synchronisation réussie !');
    console.log(`   Nouveau statut: "${jiraStatus}"\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

syncTicket();

