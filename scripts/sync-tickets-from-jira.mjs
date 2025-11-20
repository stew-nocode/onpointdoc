/**
 * Script de synchronisation des tickets JIRA vers Supabase
 * 
 * Synchronise uniquement les tickets avec des différences de statut
 * Respecte les conventions du projet : gestion d'erreurs, logging, types stricts
 * 
 * Usage: node scripts/sync-tickets-from-jira.mjs [--limit=N] [--dry-run]
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const JIRA_URL = (process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '').replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_USERNAME = (process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '').replace(/^["']|["']$/g, '').trim();
const JIRA_TOKEN = (process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '').replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

// Vérifier les variables d'environnement
if (!JIRA_URL || !JIRA_USERNAME || !JIRA_TOKEN) {
  console.error('❌ Variables JIRA manquantes dans .env.local');
  console.error('   Requis: JIRA_URL, JIRA_USERNAME, JIRA_TOKEN');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables Supabase manquantes dans .env.local');
  console.error('   Requis: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;
const dryRun = args.includes('--dry-run');

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_TOKEN}`).toString('base64');

/**
 * Récupère les tickets Supabase avec jira_issue_key
 */
async function getTicketsToSync() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/tickets?jira_issue_key=not.is.null&select=id,title,ticket_type,status,jira_issue_key&order=created_at.desc&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Supabase (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Récupère le statut JIRA d'un ticket
 */
async function getJiraStatus(jiraIssueKey) {
  try {
    const response = await fetch(`${JIRA_URL}/rest/api/3/issue/${jiraIssueKey}?fields=status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const issue = await response.json();
    return issue.fields?.status?.name || null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du statut JIRA pour ${jiraIssueKey}:`, error.message);
    return null;
  }
}

/**
 * Synchronise un ticket via l'API webhook
 */
async function syncTicket(ticketId, jiraIssueKey) {
  try {
    // Récupérer les données complètes du ticket JIRA
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

    // Préparer les données au format attendu par syncJiraToSupabase
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

    if (dryRun) {
      return { success: true, dryRun: true };
    }

    // Synchroniser directement via l'API Supabase
    // On met à jour le statut et jira_sync directement
    const supabaseStatus = jiraData.status.name; // Pour BUG/REQ, on stocke directement le statut JIRA

    // 1. Mettre à jour le ticket
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          status: supabaseStatus,
          last_update_source: 'jira',
          updated_at: jiraData.updated
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Erreur mise à jour ticket (${updateResponse.status}): ${errorText}`);
    }

    // 2. Mettre à jour jira_sync (UPSERT avec PATCH)
    const syncResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/jira_sync?ticket_id=eq.${ticketId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          jira_issue_key: jiraIssueKey,
          jira_status: jiraData.status.name,
          jira_priority: jiraData.priority.name,
          last_status_sync: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          sync_error: null,
          origin: 'jira'
        })
      }
    );

    // Si PATCH ne trouve pas l'enregistrement, créer avec POST
    if (!syncResponse.ok && syncResponse.status === 404) {
      const createResponse = await fetch(
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
            jira_status: jiraData.status.name,
            jira_priority: jiraData.priority.name,
            last_status_sync: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
            sync_error: null,
            origin: 'jira'
          })
        }
      );
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.warn(`⚠️  Erreur création jira_sync: ${errorText}`);
      }
    } else if (!syncResponse.ok) {

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      console.warn(`⚠️  Erreur mise à jour jira_sync: ${errorText}`);
      // Ne pas faire échouer la synchronisation si jira_sync échoue
    }

    // 3. Enregistrer dans ticket_status_history si le statut a changé
    // (On récupère d'abord l'ancien statut)
    const oldTicketResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets?id=eq.${ticketId}&select=status`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (oldTicketResponse.ok) {
      const oldTickets = await oldTicketResponse.json();
      if (oldTickets && oldTickets.length > 0 && oldTickets[0].status !== supabaseStatus) {
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
              ticket_id: ticketId,
              status_from: oldTickets[0].status,
              status_to: supabaseStatus,
              source: 'jira'
            })
          }
        );
      }
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔄 Synchronisation des tickets JIRA vers Supabase\n');
  console.log('═'.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
  console.log(`Limite: ${limit} tickets\n`);

  try {
    // 1. Récupérer les tickets Supabase
    console.log('📥 Récupération des tickets Supabase...');
    const tickets = await getTicketsToSync();
    console.log(`✅ ${tickets.length} tickets récupérés\n`);

    if (tickets.length === 0) {
      console.log('ℹ️  Aucun ticket à synchroniser');
      return;
    }

    // 2. Vérifier les statuts JIRA pour chaque ticket
    console.log('🔍 Vérification des statuts JIRA...\n');
    const ticketsToSync = [];

    for (const ticket of tickets) {
      const jiraStatus = await getJiraStatus(ticket.jira_issue_key);
      
      if (!jiraStatus) {
        console.warn(`⚠️  ${ticket.jira_issue_key}: Impossible de récupérer le statut JIRA`);
        continue;
      }

      // Comparer les statuts (normaliser pour la comparaison)
      const supabaseStatus = ticket.status || 'Nouveau';
      const needsSync = supabaseStatus !== jiraStatus;

      if (needsSync) {
        ticketsToSync.push({
          ...ticket,
          jiraStatus,
          supabaseStatus
        });
        console.log(`📋 ${ticket.jira_issue_key}: "${supabaseStatus}" → "${jiraStatus}"`);
      }

      // Attendre un peu pour ne pas surcharger l'API JIRA
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n✅ ${ticketsToSync.length} ticket(s) à synchroniser\n`);

    if (ticketsToSync.length === 0) {
      console.log('ℹ️  Tous les tickets sont déjà synchronisés');
      return;
    }

    // 3. Synchroniser les tickets
    if (dryRun) {
      console.log('🔍 MODE DRY RUN - Aucune modification ne sera effectuée\n');
    } else {
      console.log('🔄 Synchronisation en cours...\n');
    }

    let successCount = 0;
    let errorCount = 0;

    for (const ticket of ticketsToSync) {
      try {
        console.log(`🔄 ${ticket.jira_issue_key} (${ticket.title.substring(0, 50)}...)`);
        
        await syncTicket(ticket.id, ticket.jira_issue_key);
        
        console.log(`   ✅ Synchronisé: "${ticket.supabaseStatus}" → "${ticket.jiraStatus}"`);
        successCount++;

        // Attendre entre chaque synchronisation
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n═'.repeat(60));
    console.log(`✅ Synchronisation terminée:`);
    console.log(`   Succès: ${successCount}`);
    console.log(`   Erreurs: ${errorCount}`);
    console.log(`   Total: ${ticketsToSync.length}\n`);

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter
main().catch((error) => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});

