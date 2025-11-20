/* eslint-disable no-console */
/**
 * Script pour synchroniser manuellement un ticket JIRA vers Supabase
 * 
 * Usage: node scripts/sync-ticket-from-jira.js OD-2991
 */

import dotenv from 'dotenv';
import path from 'node:path';

// Charger .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const jiraIssueKey = process.argv[2];

if (!jiraIssueKey) {
  console.error('❌ Usage: node scripts/sync-ticket-from-jira.js <JIRA_ISSUE_KEY>');
  console.error('   Exemple: node scripts/sync-ticket-from-jira.js OD-2991');
  process.exit(1);
}

// Note: Ce script doit être exécuté dans le contexte Next.js pour utiliser les fonctions
// Pour l'instant, on va créer une version standalone qui utilise directement l'API

const JIRA_URL = process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '';
const JIRA_USERNAME = process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '';
const JIRA_TOKEN = process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!JIRA_URL || !JIRA_USERNAME || !JIRA_TOKEN) {
  console.error('❌ Variables JIRA manquantes dans .env.local');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const cleanUrl = JIRA_URL.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const cleanUsername = JIRA_USERNAME.replace(/^["']|["']$/g, '').trim();
const cleanToken = JIRA_TOKEN.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();

const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');

async function syncTicket() {
  console.log(`🔄 Synchronisation du ticket ${jiraIssueKey} depuis JIRA...\n`);

  try {
    // 1. Récupérer les données JIRA
    console.log('📥 Récupération des données JIRA...');
    const jiraResponse = await fetch(`${cleanUrl}/rest/api/3/issue/${jiraIssueKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!jiraResponse.ok) {
      const errorText = await jiraResponse.text();
      console.error(`❌ Erreur JIRA (${jiraResponse.status}): ${errorText}`);
      process.exit(1);
    }

    const jiraIssue = await jiraResponse.json();
    console.log(`✅ Ticket JIRA récupéré: ${jiraIssue.key}`);
    console.log(`   Statut: ${jiraIssue.fields.status.name}`);
    console.log(`   Type: ${jiraIssue.fields.issuetype.name}\n`);

    // 2. Trouver le ticket Supabase
    console.log('🔍 Recherche du ticket Supabase...');
    const supabaseResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?jira_issue_key=eq.${jiraIssueKey}&select=id,ticket_type,status`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error(`❌ Erreur Supabase (${supabaseResponse.status}): ${errorText}`);
      process.exit(1);
    }

    const tickets = await supabaseResponse.json();
    if (!tickets || tickets.length === 0) {
      console.error(`❌ Aucun ticket Supabase trouvé pour ${jiraIssueKey}`);
      process.exit(1);
    }

    const ticket = tickets[0];
    console.log(`✅ Ticket Supabase trouvé: ${ticket.id}`);
    console.log(`   Statut actuel: ${ticket.status}\n`);

    // 3. Appeler le webhook de synchronisation
    console.log('🔄 Synchronisation via webhook...');
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/jira`
      : 'http://localhost:3000/api/webhooks/jira';
    
    // Préparer les données JIRA au format attendu
    const jiraData = {
      key: jiraIssue.key,
      id: jiraIssue.id,
      summary: jiraIssue.fields.summary || '',
      description: typeof jiraIssue.fields.description === 'string' 
        ? jiraIssue.fields.description 
        : JSON.stringify(jiraIssue.fields.description || {}),
      status: {
        name: jiraIssue.fields.status?.name || ''
      },
      priority: {
        name: jiraIssue.fields.priority?.name || ''
      },
      issuetype: {
        name: jiraIssue.fields.issuetype?.name || ''
      },
      reporter: jiraIssue.fields.reporter ? {
        accountId: jiraIssue.fields.reporter.accountId,
        displayName: jiraIssue.fields.reporter.displayName
      } : undefined,
      assignee: jiraIssue.fields.assignee ? {
        accountId: jiraIssue.fields.assignee.accountId,
        displayName: jiraIssue.fields.assignee.displayName
      } : undefined,
      resolution: jiraIssue.fields.resolution ? {
        name: jiraIssue.fields.resolution.name
      } : undefined,
      fixVersions: jiraIssue.fields.fixVersions?.map((fv) => ({ name: fv.name })) || [],
      created: jiraIssue.fields.created || '',
      updated: jiraIssue.fields.updated || '',
      labels: jiraIssue.fields.labels || [],
      components: jiraIssue.fields.components?.map((c) => ({ name: c.name })) || []
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticket_id: ticket.id,
        jira_data: jiraData
      })
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`❌ Erreur webhook (${webhookResponse.status}): ${errorText}`);
      process.exit(1);
    }

    const result = await webhookResponse.json();
    console.log('✅ Synchronisation réussie !');
    console.log(`   Nouveau statut: ${jiraIssue.fields.status.name}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

syncTicket();

