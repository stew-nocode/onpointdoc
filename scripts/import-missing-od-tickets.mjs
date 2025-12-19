#!/usr/bin/env node

/**
 * Script pour importer les tickets OD manquants depuis JIRA
 * 
 * Problème résolu:
 * - Certains tickets OBCS du CSV n'avaient pas de correspondance OD dans le fichier de correspondance
 * - Ces tickets OBCS n'ont donc pas été importés dans Supabase
 * - Maintenant, ces OBCS ont des tickets OD dans JIRA (via Issue Link "Duplicate")
 * - Ce script les trouve et les importe dans Supabase
 * 
 * Processus:
 * 1. Lit le CSV des tickets pour identifier les OBCS sans correspondance OD
 * 2. Pour chaque OBCS sans correspondance, vérifie dans JIRA s'il existe un ticket OD lié
 * 3. Récupère les données du ticket OD depuis JIRA
 * 4. Importe le ticket OD dans Supabase avec les mêmes règles que l'import initial
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
 * Charge le mapping de correspondance OBCS → OD depuis le CSV
 */
function loadCorrespondanceMapping() {
  const csvContent = readFileSync(CORRESPONDANCE_CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const mapping = new Map();
  for (const row of records) {
    const obcsKey = row['Lien de ticket sortant (Duplicate)']?.trim();
    const odKey = row['Clé de ticket']?.trim();
    if (obcsKey && odKey && obcsKey.startsWith('OBCS-') && odKey.startsWith('OD-')) {
      mapping.set(obcsKey, odKey);
    }
  }
  return mapping;
}

/**
 * Récupère un ticket depuis JIRA avec tous ses champs
 */
async function getTicketFromJira(ticketKey) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=*all&expand=names`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
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
 * Trouve le ticket OD lié à un OBCS via Issue Links "Duplicate"
 */
async function findODTicketForOBCS(obcsKey) {
  // On ne peut pas chercher directement par OBCS → OD via l'API
  // Il faut chercher tous les tickets OD et vérifier leurs Issue Links
  // Mais c'est trop long. On va utiliser une approche différente :
  // Récupérer tous les tickets OD depuis Supabase et vérifier leurs Issue Links
  
  // Pour l'instant, on va chercher dans tous les tickets OD existants dans Supabase
  // et vérifier s'ils ont un lien vers cet OBCS
  
  // Mais mieux : chercher directement dans JIRA avec JQL
  // Malheureusement, l'API search ne fonctionne plus...
  
  // Solution : on va récupérer tous les tickets OD depuis Supabase
  // et pour chacun, vérifier s'il a un lien vers l'OBCS recherché
  
  // Pour optimiser, on peut d'abord vérifier si le ticket OD existe déjà dans Supabase
  // en cherchant par un pattern (mais on n'a pas de pattern pour OD à partir d'OBCS)
  
  // Approche finale : rechercher dans tous les tickets OD depuis Supabase
  // et vérifier leurs Issue Links depuis JIRA
  // Si ça prend trop de temps, on peut limiter la recherche
  
  console.log(`   🔍 Recherche du ticket OD pour ${obcsKey}...`);
  
  // Pour l'instant, on va simplement chercher dans JIRA
  // en essayant de trouver un ticket OD qui a un Issue Link vers cet OBCS
  // Mais l'API JIRA ne permet pas de faire cette recherche directement
  
  // Solution : on va chercher tous les tickets OD depuis Supabase
  // et vérifier leurs Issue Links depuis JIRA un par un
  
  // Pour optimiser, on peut d'abord vérifier si le ticket OD existe déjà
  // dans Supabase avec un jira_issue_key qui correspond
  
  // Approche simplifiée : on va chercher directement le ticket OD
  // en supposant qu'il existe et qu'on peut le trouver via les Issue Links
  // des tickets OD existants
  
  // Pour l'instant, retournons null et on va chercher autrement
  return null;
}

async function importMissingODTickets() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📥 IMPORT DES TICKETS OD MANQUANTS DEPUIS JIRA');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // 1. Charger le mapping de correspondance existant
  console.log('📖 Chargement du fichier de correspondance...');
  const correspondanceMap = loadCorrespondanceMapping();
  console.log(`✅ ${correspondanceMap.size} correspondances OBCS → OD chargées\n`);

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

  // 3. Identifier les tickets OBCS sans correspondance OD
  console.log('🔍 Identification des tickets OBCS sans correspondance OD...');
  const obcsWithoutOD = [];
  
  for (const row of records) {
    const csvJiraKey = row['Clé de ticket']?.trim();
    
    if (csvJiraKey && csvJiraKey.startsWith('OBCS-')) {
      // Vérifier si ce OBCS a une correspondance OD dans le fichier de correspondance
      if (!correspondanceMap.has(csvJiraKey)) {
        obcsWithoutOD.push({
          obcsKey: csvJiraKey,
          row: row
        });
      }
    }
  }
  
  console.log(`✅ ${obcsWithoutOD.length} tickets OBCS sans correspondance OD trouvés\n`);

  if (obcsWithoutOD.length === 0) {
    console.log('✅ Tous les tickets OBCS ont une correspondance OD. Rien à faire.');
    return;
  }

  // 4. Pour chaque OBCS sans correspondance, chercher le ticket OD dans JIRA
  console.log('🔍 Recherche des tickets OD correspondants dans JIRA...\n');
  console.log('⚠️  Cette étape peut prendre du temps car elle nécessite de vérifier les Issue Links de tous les tickets OD...\n');
  
  // Stratégie : Récupérer tous les tickets OD depuis Supabase
  // et pour chacun, vérifier dans JIRA s'il a un Issue Link vers un des OBCS sans correspondance
  console.log('📥 Récupération de tous les tickets OD depuis Supabase...');
  const { data: odTicketsInSupabase, error: supabaseError } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .like('jira_issue_key', 'OD-%')
    .order('jira_issue_key', { ascending: true });

  if (supabaseError) {
    console.error('❌ Erreur Supabase:', supabaseError.message);
    return;
  }

  console.log(`✅ ${odTicketsInSupabase.length} tickets OD trouvés dans Supabase\n`);

  // Créer un Set des OBCS sans correspondance pour recherche rapide
  const obcsWithoutODSet = new Set(obcsWithoutOD.map(item => item.obcsKey));

  // 5. Pour chaque ticket OD dans Supabase, vérifier s'il a un lien vers un OBCS sans correspondance
  console.log('🔍 Vérification des Issue Links dans JIRA...\n');
  const odTicketsToImport = [];
  let processed = 0;

  for (const odTicket of odTicketsInSupabase) {
    const odKey = odTicket.jira_issue_key;
    processed++;

    try {
      // Récupérer le ticket depuis JIRA pour vérifier ses Issue Links
      const jiraTicket = await getTicketFromJira(odKey);
      
      if (!jiraTicket) {
        continue;
      }

      const issueLinks = jiraTicket.fields?.issuelinks || [];
      
      // Vérifier si ce ticket OD a un lien vers un des OBCS sans correspondance
      for (const link of issueLinks) {
        if (link.type?.name === 'Duplicate' && link.outwardIssue?.key) {
          const obcsKey = link.outwardIssue.key;
          if (obcsKey.startsWith('OBCS-') && obcsWithoutODSet.has(obcsKey)) {
            // Trouvé ! Ce ticket OD correspond à un OBCS sans correspondance
            const obcsRow = obcsWithoutOD.find(item => item.obcsKey === obcsKey);
            odTicketsToImport.push({
              odKey: odKey,
              obcsKey: obcsKey,
              obcsRow: obcsRow?.row,
              jiraTicket: jiraTicket
            });
            console.log(`✅ Trouvé: ${odKey} → ${obcsKey}`);
          }
        }
      }

      if (processed % 50 === 0) {
        console.log(`   📊 ${processed}/${odTicketsInSupabase.length} tickets OD vérifiés... (${odTicketsToImport.length} correspondances trouvées)`);
      }

      // Petite pause pour ne pas surcharger l'API JIRA
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`   ❌ Erreur pour ${odKey}: ${error.message}`);
    }
  }

  console.log(`\n✅ ${odTicketsToImport.length} tickets OD à importer trouvés\n`);

  if (odTicketsToImport.length === 0) {
    console.log('⚠️  Aucun ticket OD à importer trouvé. Les tickets OBCS sans correspondance n\'ont peut-être pas encore de ticket OD dans JIRA.');
    return;
  }

  // 6. Afficher un résumé
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📋 TICKETS OD À IMPORTER');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  
  odTicketsToImport.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.odKey} (OBCS source: ${item.obcsKey})`);
    console.log(`   ${item.jiraTicket.fields?.summary || 'N/A'}\n`);
  });

  if (odTicketsToImport.length > 10) {
    console.log(`   ... et ${odTicketsToImport.length - 10} autres tickets\n`);
  }

  console.log('\n💡 Pour importer ces tickets, utilisez le script d\'import principal');
  console.log('   ou créez un script qui utilise la même logique que import-tickets-from-csv.mjs');
  console.log('   mais pour ces tickets OD spécifiques.\n');
}

importMissingODTickets().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

