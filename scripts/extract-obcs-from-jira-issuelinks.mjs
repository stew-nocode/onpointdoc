#!/usr/bin/env node

/**
 * Script pour extraire les correspondances OBCS depuis les Issue Links "Duplicate" 
 * des tickets OD dans JIRA
 * 
 * Ce script :
 * 1. Récupère tous les tickets OD depuis Supabase
 * 2. Pour chaque ticket, interroge JIRA pour récupérer les Issue Links
 * 3. Extrait les correspondances OBCS depuis les Issue Links de type "Duplicate"
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

// Configuration JIRA
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!jiraUrl || !jiraUsername || !jiraToken) {
  console.error('❌ Variables JIRA manquantes');
  process.exit(1);
}

const JIRA_URL = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_EMAIL = jiraUsername.replace(/^["']|["']$/g, '').trim();
const JIRA_API_TOKEN = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Configuration Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

/**
 * Récupère un ticket depuis JIRA avec ses Issue Links
 */
async function getTicketFromJira(ticketKey) {
  try {
    const response = await fetch(`${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=key,summary,issuelinks`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Ticket non trouvé
      }
      const errorText = await response.text();
      throw new Error(`JIRA API Error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Extrait les correspondances OBCS depuis les Issue Links d'un ticket OD
 */
function extractOBCSFromIssueLinks(jiraTicket) {
  const correspondances = [];
  const odKey = jiraTicket.key;
  const summary = jiraTicket.fields?.summary || '';
  const issueLinks = jiraTicket.fields?.issuelinks || [];

  for (const link of issueLinks) {
    // Chercher les liens de type "Duplicate" avec un outwardIssue qui commence par "OBCS-"
    if (link.type?.name === 'Duplicate' && link.outwardIssue?.key) {
      const obcsKey = link.outwardIssue.key;
      if (obcsKey.startsWith('OBCS-')) {
        correspondances.push({
          odKey: odKey,
          obcsKey: obcsKey,
          summary: summary,
          linkType: link.type.name
        });
      }
    }
  }

  return correspondances;
}

async function extractCorrespondances() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 EXTRACTION DES CORRESPONDANCES OBCS DEPUIS JIRA (Issue Links)');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Récupérer tous les tickets OD depuis Supabase
    console.log('📥 Récupération des tickets OD depuis Supabase...');
    const { data: odTickets, error: supabaseError } = await supabase
      .from('tickets')
      .select('jira_issue_key, title')
      .like('jira_issue_key', 'OD-%')
      .order('jira_issue_key', { ascending: true });

    if (supabaseError) {
      console.error('❌ Erreur Supabase:', supabaseError.message);
      return;
    }

    console.log(`✅ ${odTickets.length} tickets OD trouvés dans Supabase\n`);

    if (odTickets.length === 0) {
      console.log('⚠️  Aucun ticket OD trouvé dans Supabase.');
      return;
    }

    // 2. Récupérer chaque ticket depuis JIRA et extraire les correspondances
    console.log('📥 Récupération des correspondances depuis JIRA...\n');
    const correspondances = [];
    let processed = 0;
    let notFound = 0;
    let errors = 0;

    for (const ticket of odTickets) {
      const odKey = ticket.jira_issue_key;
      processed++;

      try {
        const jiraTicket = await getTicketFromJira(odKey);

        if (!jiraTicket) {
          notFound++;
          if (processed % 100 === 0) {
            console.log(`   📊 ${processed}/${odTickets.length} tickets traités... (${correspondances.length} correspondances)`);
          }
          continue;
        }

        const extracted = extractOBCSFromIssueLinks(jiraTicket);
        if (extracted.length > 0) {
          correspondances.push(...extracted);
        }

        if (processed % 50 === 0) {
          console.log(`   📊 ${processed}/${odTickets.length} tickets traités... (${correspondances.length} correspondances trouvées)`);
        }
      } catch (error) {
        errors++;
        console.error(`   ❌ Erreur pour ${odKey}: ${error.message}`);
      }

      // Petite pause pour ne pas surcharger l'API JIRA
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ ${correspondances.length} correspondances trouvées`);
    console.log(`   📊 Tickets traités: ${processed}`);
    console.log(`   ⚠️  Tickets non trouvés dans JIRA: ${notFound}`);
    console.log(`   ❌ Erreurs: ${errors}\n`);

    if (correspondances.length === 0) {
      console.log('⚠️  Aucune correspondance trouvée.');
      return;
    }

    // 3. Afficher quelques exemples
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('📋 EXEMPLES DE CORRESPONDANCES');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');

    correspondances.slice(0, 10).forEach((corr, idx) => {
      console.log(`${idx + 1}. ${corr.obcsKey} → ${corr.odKey}`);
      console.log(`   ${corr.summary.substring(0, 80)}...\n`);
    });

    if (correspondances.length > 10) {
      console.log(`   ... et ${correspondances.length - 10} autres correspondances\n`);
    }

    // 4. Sauvegarder dans un fichier CSV compatible avec le format existant
    console.log('💾 Sauvegarde des correspondances...\n');
    
    const csvRows = ['Résumé,Clé de ticket,Lien de ticket sortant (Duplicate)'];
    for (const corr of correspondances) {
      const summaryEscaped = corr.summary.replace(/"/g, '""');
      csvRows.push(`"${summaryEscaped}",${corr.odKey},${corr.obcsKey}`);
    }

    const csvPath = path.join(__dirname, '../docs/ticket/correspondances-jira-extraites-issuelinks.csv');
    writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
    console.log(`✅ CSV sauvegardé dans: ${csvPath}`);

    // 5. Sauvegarder aussi en JSON pour référence
    const jsonPath = path.join(__dirname, '../docs/ticket/correspondances-jira-extraites-issuelinks.json');
    writeFileSync(jsonPath, JSON.stringify(correspondances, null, 2), 'utf-8');
    console.log(`✅ JSON sauvegardé dans: ${jsonPath}\n`);

    console.log('✅ Extraction terminée');
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

extractCorrespondances();





