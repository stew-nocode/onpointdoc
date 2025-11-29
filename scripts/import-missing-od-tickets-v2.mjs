#!/usr/bin/env node

/**
 * Script pour importer les tickets OD manquants depuis JIRA
 * 
 * Processus:
 * 1. Identifie les tickets OBCS du CSV qui n'ont pas de correspondance OD
 * 2. Pour chaque OBCS sans correspondance, cherche dans JIRA un ticket OD qui a un Issue Link "Duplicate" vers cet OBCS
 * 3. Si trouvé, récupère le ticket OD depuis JIRA et l'importe dans Supabase
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
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
 * Récupère un ticket depuis JIRA avec ses Issue Links
 */
async function getTicketFromJira(ticketKey) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=key,summary,issuelinks`,
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
      if (response.status === 429) {
        // Rate limiting - attendre un peu
        console.log(`   ⏳ Rate limit atteint pour ${ticketKey}, attente de 5 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Réessayer une fois
        const retryResponse = await fetch(
          `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=key,summary,issuelinks`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );
        if (!retryResponse.ok) {
          return null;
        }
        return await retryResponse.json();
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
 * Récupère un ticket depuis JIRA avec TOUS ses champs
 */
async function getFullTicketFromJira(ticketKey) {
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
      if (response.status === 429) {
        console.log(`   ⏳ Rate limit atteint pour ${ticketKey}, attente de 5 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        const retryResponse = await fetch(
          `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=*all&expand=names`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );
        if (!retryResponse.ok) {
          return null;
        }
        return await retryResponse.json();
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Trouve le ticket OD qui a un Issue Link "Duplicate" vers un OBCS donné
 * 
 * Stratégie : Chercher dans les tickets OD qui ont un lien vers cet OBCS
 * On va chercher dans tous les tickets OD existants (dans Supabase et potentiellement dans JIRA)
 */
async function findODTicketForOBCS(obcsKey) {
  // Approche : Chercher dans tous les tickets OD de Supabase
  // et vérifier leurs Issue Links depuis JIRA
  // Si pas trouvé, le ticket OD n'existe peut-être pas encore ou n'est pas encore dans Supabase
  
  // Pour l'instant, on va simplement chercher si un ticket OBCS a un lien inverse
  // Mais JIRA ne permet pas de chercher facilement "tous les tickets OD qui ont un lien vers OBCS-XXXX"
  
  // Solution : Récupérer le ticket OBCS lui-même et voir s'il a un lien inverse vers un OD
  // Mais ce n'est pas comme ça que ça fonctionne...
  
  // En fait, le lien "Duplicate" est unidirectionnel : OD → OBCS (outwardIssue)
  // Donc on doit chercher dans les tickets OD leurs Issue Links
  
  // Pour optimiser, on va chercher dans tous les tickets OD existants dans Supabase
  // Mais aussi, on peut chercher dans JIRA directement si on connaît un pattern
  
  // Approche simplifiée : Chercher dans tous les tickets OD de Supabase
  // Si le ticket OD n'est pas trouvé, il faudra peut-être chercher différemment
  
  return null; // Temporaire, sera implémenté différemment
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

  // 4. Récupérer tous les tickets OD depuis Supabase
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
  console.log('🔍 Recherche des correspondances dans les Issue Links des tickets OD...\n');
  console.log('⚠️  Cette étape peut prendre du temps car elle nécessite de vérifier chaque ticket OD dans JIRA...\n');
  
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

      // Pause pour éviter le rate limiting
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`   ❌ Erreur pour ${odKey}: ${error.message}`);
    }
  }

  console.log(`\n✅ ${odTicketsToImport.length} tickets OD à importer trouvés\n`);

  if (odTicketsToImport.length === 0) {
    console.log('⚠️  Aucun ticket OD à importer trouvé dans les tickets déjà présents dans Supabase.');
    console.log('💡 Les tickets OD correspondants ne sont peut-être pas encore dans Supabase.');
    console.log('   Il faudra peut-être les chercher directement dans JIRA.\n');
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

  console.log('\n💡 Pour importer ces tickets dans Supabase, il faudra utiliser');
  console.log('   la même logique que le script import-tickets-from-csv.mjs');
  console.log('   mais en récupérant les données complètes depuis JIRA.\n');
}

importMissingODTickets().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





