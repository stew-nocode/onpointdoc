#!/usr/bin/env node

/**
 * Script pour trouver les tickets OD en cherchant le champ OBCS d'origine dans chaque ticket OD
 * 
 * Processus:
 * 1. Identifie les tickets OBCS du CSV qui n'ont pas de correspondance OD
 * 2. Récupère tous les tickets OD depuis JIRA (ou Supabase)
 * 3. Pour chaque ticket OD, examine le champ qui contient le OBCS d'origine
 * 4. Croise avec les OBCS sans correspondance
 * 5. Liste les tickets OD à importer
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';
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
      if (response.status === 429) {
        console.log(`   ⏳ Rate limit atteint pour ${ticketKey}, attente de 10 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        // Réessayer une fois
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
 * Extrait le OBCS d'origine d'un ticket OD en cherchant dans tous ses champs
 */
function extractOBCSFromODTicket(jiraTicket) {
  const fields = jiraTicket.fields || {};
  const obcsKeys = [];

  // Méthode 1: Chercher dans les Issue Links (outwardIssue de type Duplicate)
  const issueLinks = fields.issuelinks || [];
  for (const link of issueLinks) {
    if (link.type?.name === 'Duplicate' && link.outwardIssue?.key) {
      const key = link.outwardIssue.key;
      if (key.startsWith('OBCS-')) {
        obcsKeys.push({
          obcsKey: key,
          source: 'issuelink-duplicate'
        });
      }
    }
  }

  // Méthode 2: Chercher dans tous les champs personnalisés pour "OBCS-"
  for (const [fieldKey, fieldValue] of Object.entries(fields)) {
    if (!fieldValue) continue;

    // Si c'est une chaîne qui contient OBCS-
    if (typeof fieldValue === 'string') {
      const obcsMatch = fieldValue.match(/OBCS-\d+/g);
      if (obcsMatch) {
        obcsMatch.forEach(key => {
          if (!obcsKeys.find(item => item.obcsKey === key)) {
            obcsKeys.push({
              obcsKey: key,
              source: `field:${fieldKey}`
            });
          }
        });
      }
    }

    // Si c'est un objet, chercher récursivement
    if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
      const objStr = JSON.stringify(fieldValue);
      const obcsMatch = objStr.match(/OBCS-\d+/g);
      if (obcsMatch) {
        obcsMatch.forEach(key => {
          if (!obcsKeys.find(item => item.obcsKey === key)) {
            obcsKeys.push({
              obcsKey: key,
              source: `field:${fieldKey}`
            });
          }
        });
      }
    }

    // Si c'est un tableau
    if (Array.isArray(fieldValue)) {
      fieldValue.forEach(item => {
        if (typeof item === 'string' && item.includes('OBCS-')) {
          const obcsMatch = item.match(/OBCS-\d+/g);
          if (obcsMatch) {
            obcsMatch.forEach(key => {
              if (!obcsKeys.find(item => item.obcsKey === key)) {
                obcsKeys.push({
                  obcsKey: key,
                  source: `field:${fieldKey}`
                });
              }
            });
          }
        } else if (typeof item === 'object') {
          const itemStr = JSON.stringify(item);
          const obcsMatch = itemStr.match(/OBCS-\d+/g);
          if (obcsMatch) {
            obcsMatch.forEach(key => {
              if (!obcsKeys.find(item => item.obcsKey === key)) {
                obcsKeys.push({
                  obcsKey: key,
                  source: `field:${fieldKey}`
                });
              }
            });
          }
        }
      });
    }
  }

  return obcsKeys;
}

async function findODTicketsByOBCSField() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 RECHERCHE DES TICKETS OD PAR CHAMP OBCS D\'ORIGINE');
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
  const obcsWithoutODSet = new Set();
  
  for (const row of records) {
    const csvJiraKey = row['Clé de ticket']?.trim();
    
    if (csvJiraKey && csvJiraKey.startsWith('OBCS-')) {
      if (!correspondanceMap.has(csvJiraKey)) {
        obcsWithoutOD.push({
          obcsKey: csvJiraKey,
          row: row
        });
        obcsWithoutODSet.add(csvJiraKey);
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

  // 5. Pour chaque ticket OD, récupérer depuis JIRA et chercher le champ OBCS
  console.log('🔍 Recherche du champ OBCS d\'origine dans chaque ticket OD...\n');
  console.log('⚠️  Cette étape peut prendre du temps...\n');
  
  const odTicketsMapping = new Map(); // obcsKey → { odKey, jiraTicket, obcsRow }
  let processed = 0;
  let found = 0;

  for (const odTicket of odTicketsInSupabase) {
    const odKey = odTicket.jira_issue_key;
    processed++;

    try {
      // Récupérer le ticket depuis JIRA avec tous ses champs
      const jiraTicket = await getTicketFromJira(odKey);
      
      if (!jiraTicket) {
        if (processed % 100 === 0) {
          console.log(`   📊 ${processed}/${odTicketsInSupabase.length} tickets traités... (${found} correspondances trouvées)`);
        }
        continue;
      }

      // Extraire le(s) OBCS d'origine de ce ticket OD
      const obcsKeys = extractOBCSFromODTicket(jiraTicket);
      
      // Vérifier si un de ces OBCS est dans notre liste sans correspondance
      for (const { obcsKey } of obcsKeys) {
        if (obcsWithoutODSet.has(obcsKey)) {
          const obcsRow = obcsWithoutOD.find(item => item.obcsKey === obcsKey);
          odTicketsMapping.set(obcsKey, {
            odKey: odKey,
            obcsKey: obcsKey,
            obcsRow: obcsRow?.row,
            jiraTicket: jiraTicket
          });
          found++;
          console.log(`✅ Trouvé: ${odKey} → ${obcsKey}`);
        }
      }

      if (processed % 50 === 0) {
        console.log(`   📊 ${processed}/${odTicketsInSupabase.length} tickets traités... (${found} correspondances trouvées)`);
      }

      // Pause pour éviter le rate limiting
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`   ❌ Erreur pour ${odKey}: ${error.message}`);
    }
  }

  console.log(`\n✅ ${found} correspondances trouvées\n`);

  if (found === 0) {
    console.log('⚠️  Aucune correspondance trouvée dans les tickets OD déjà présents dans Supabase.');
    console.log('💡 Les tickets OD correspondants ne sont peut-être pas encore dans Supabase.\n');
    return;
  }

  // 6. Afficher un résumé
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📋 TICKETS OD À IMPORTER');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  
  const ticketsToImport = Array.from(odTicketsMapping.values());
  ticketsToImport.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.odKey} (OBCS source: ${item.obcsKey})`);
    console.log(`   ${item.jiraTicket.fields?.summary || 'N/A'}\n`);
  });

  if (ticketsToImport.length > 10) {
    console.log(`   ... et ${ticketsToImport.length - 10} autres tickets\n`);
  }

  // 7. Sauvegarder les résultats
  const outputPath = path.join(__dirname, '../docs/ticket/od-tickets-found-by-obcs-field.json');
  writeFileSync(outputPath, JSON.stringify(ticketsToImport, null, 2), 'utf-8');
  console.log(`💾 Résultats sauvegardés dans: ${outputPath}\n`);

  console.log('✅ Recherche terminée');
}

findODTicketsByOBCSField().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





