/**
 * Script pour synchroniser ou créer un ticket depuis JIRA
 * Si le ticket n'existe pas dans Supabase, il sera créé
 * Usage: node scripts/sync-or-create-ticket.mjs OD-2993
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
  console.error('❌ Usage: node scripts/sync-or-create-ticket.mjs <JIRA_ISSUE_KEY>');
  process.exit(1);
}

const JIRA_URL = (process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '').replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_USERNAME = (process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '').replace(/^["']|["']$/g, '').trim();
const JIRA_TOKEN = (process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '').replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_TOKEN}`).toString('base64');

async function syncOrCreateTicket() {
  console.log(`🔄 Synchronisation/Création du ticket ${jiraIssueKey}...\n`);

  try {
    // 1. Récupérer les données complètes depuis JIRA
    console.log('📥 Récupération des données JIRA...');
    const jiraResponse = await fetch(`${JIRA_URL}/rest/api/3/issue/${jiraIssueKey}`, {
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
    const jiraType = jiraIssue.fields?.issuetype?.name || '';
    
    // Déterminer le type de ticket
    const ticketType = jiraType.toLowerCase().includes('bug') ? 'BUG' 
      : (jiraType.toLowerCase().includes('requête') || jiraType.toLowerCase().includes('requete')) ? 'REQ' 
      : 'ASSISTANCE';

    console.log(`✅ Données JIRA récupérées:`);
    console.log(`   Titre: ${jiraIssue.fields.summary}`);
    console.log(`   Type: ${ticketType}`);
    console.log(`   Statut: ${jiraStatus}\n`);

    // 2. Vérifier si le ticket existe dans Supabase
    const ticketResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?jira_issue_key=eq.${jiraIssueKey}&select=id,title,status`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const tickets = await ticketResponse.json();
    const existingTicket = tickets && tickets.length > 0 ? tickets[0] : null;

    if (existingTicket) {
      // Mettre à jour le ticket existant
      console.log(`📝 Ticket existant trouvé, mise à jour...`);
      console.log(`   Statut actuel: "${existingTicket.status}" → "${jiraStatus}"\n`);

      if (existingTicket.status === jiraStatus) {
        console.log('ℹ️  Les statuts sont déjà synchronisés');
        return;
      }

      // Mettre à jour
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/tickets?id=eq.${existingTicket.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
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

      // Historique
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
            ticket_id: existingTicket.id,
            status_from: existingTicket.status,
            status_to: jiraStatus,
            source: 'jira'
          })
        }
      );

      // jira_sync
      await fetch(
        `${SUPABASE_URL}/rest/v1/jira_sync?ticket_id=eq.${existingTicket.id}`,
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
            last_synced_at: new Date().toISOString()
          })
        }
      );

      console.log('✅ Ticket mis à jour avec succès !\n');
    } else {
      // Créer le ticket
      console.log(`📝 Ticket non trouvé, création...\n`);

      const createResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/tickets`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            title: jiraIssue.fields.summary || 'Ticket JIRA',
            description: typeof jiraIssue.fields.description === 'string' 
              ? jiraIssue.fields.description 
              : JSON.stringify(jiraIssue.fields.description || {}),
            ticket_type: ticketType,
            status: jiraStatus,
            priority: 'Medium', // Par défaut
            jira_issue_key: jiraIssueKey,
            origin: 'jira',
            created_at: jiraIssue.fields.created || new Date().toISOString(),
            updated_at: jiraIssue.fields.updated || new Date().toISOString()
          })
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Erreur création (${createResponse.status}): ${errorText}`);
      }

      const newTicket = await createResponse.json();
      const ticketId = Array.isArray(newTicket) ? newTicket[0].id : newTicket.id;

      // Créer jira_sync
      await fetch(
        `${SUPABASE_URL}/rest/v1/jira_sync`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ticket_id: ticketId,
            jira_issue_key: jiraIssueKey,
            jira_status: jiraStatus,
            last_status_sync: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
            origin: 'jira'
          })
        }
      );

      console.log('✅ Ticket créé avec succès !\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

syncOrCreateTicket();

