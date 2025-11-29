#!/usr/bin/env node

/**
 * Script pour trouver les tickets OD manquants par titre et compléter l'import
 * 
 * Processus:
 * 1. Identifie les tickets OBCS du CSV qui n'ont pas de correspondance OD
 * 2. Pour chaque OBCS sans correspondance, cherche dans JIRA un ticket OD avec le même titre
 * 3. Met à jour le fichier de correspondance
 * 4. Importe les tickets OD trouvés dans Supabase
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
 * Normalise un titre pour comparaison (enlève accents, majuscules, espaces)
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

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
  return { mapping, records };
}

/**
 * Sauvegarde le fichier de correspondance mis à jour
 */
function saveCorrespondanceFile(records, newCorrespondances) {
  // Sauvegarder un backup d'abord
  const backupPath = CORRESPONDANCE_CSV_PATH.replace('.csv', `-backup-${Date.now()}.csv`);
  writeFileSync(backupPath, readFileSync(CORRESPONDANCE_CSV_PATH, 'utf-8'), 'utf-8');
  console.log(`💾 Backup créé: ${backupPath}`);

  // Ajouter les nouvelles correspondances
  for (const { obcsKey, odKey, summary } of newCorrespondances) {
    records.push({
      'Résumé': summary || '',
      'Clé de ticket': odKey,
      'Lien de ticket sortant (Duplicate)': obcsKey
    });
  }

  // Reconstruire le CSV manuellement
  const headers = ['Résumé', 'Clé de ticket', 'Lien de ticket sortant (Duplicate)'];
  const csvRows = [headers.join(',')];
  
  for (const record of records) {
    const row = [
      `"${(record['Résumé'] || '').replace(/"/g, '""')}"`,
      record['Clé de ticket'] || '',
      record['Lien de ticket sortant (Duplicate)'] || ''
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  writeFileSync(CORRESPONDANCE_CSV_PATH, csvContent, 'utf-8');
  console.log(`✅ Fichier de correspondance mis à jour\n`);
}

/**
 * Récupère tous les tickets OD depuis Supabase pour créer un index de titres
 */
async function getODTicketsFromSupabase() {
  const { data, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, title')
    .like('jira_issue_key', 'OD-%')
    .order('jira_issue_key', { ascending: true });

  if (error) {
    console.error('❌ Erreur Supabase:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Récupère un ticket OD depuis JIRA par titre (recherche approximative)
 */
async function findODTicketByTitleInJira(title) {
  // Normaliser le titre pour la recherche
  const normalizedTitle = normalizeTitle(title);
  
  // Récupérer tous les tickets OD depuis Supabase d'abord (plus rapide)
  const odTicketsInSupabase = await getODTicketsFromSupabase();
  
  // Chercher une correspondance exacte ou proche dans Supabase
  for (const ticket of odTicketsInSupabase) {
    const ticketTitleNormalized = normalizeTitle(ticket.title);
    if (ticketTitleNormalized === normalizedTitle) {
      // Trouvé ! Récupérer les détails depuis JIRA
      const jiraTicket = await getTicketFromJira(ticket.jira_issue_key);
      if (jiraTicket) {
        return jiraTicket;
      }
    }
  }

  // Si pas trouvé dans Supabase, chercher dans JIRA (plus lent)
  // On va récupérer tous les tickets OD depuis JIRA par batch
  // Mais l'API search ne fonctionne plus... 
  // On va devoir récupérer depuis Supabase tous les tickets OD et vérifier
  
  return null;
}

/**
 * Récupère un ticket depuis JIRA
 */
async function getTicketFromJira(ticketKey) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=key,summary`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const retryResponse = await fetch(
          `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=key,summary`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );
        if (!retryResponse.ok) return null;
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
 * Cherche un ticket OD dans JIRA en comparant les titres
 * Stratégie : Récupère tous les tickets OD depuis Supabase et compare les titres
 */
async function findODTicketsByTitle(obcsTickets) {
  console.log('📥 Récupération de tous les tickets OD depuis Supabase...');
  const odTickets = await getODTicketsFromSupabase();
  console.log(`✅ ${odTickets.length} tickets OD trouvés dans Supabase\n`);

  // Créer un index de titres normalisés
  const titleIndex = new Map();
  for (const ticket of odTickets) {
    const normalized = normalizeTitle(ticket.title);
    if (!titleIndex.has(normalized)) {
      titleIndex.set(normalized, []);
    }
    titleIndex.get(normalized).push(ticket);
  }

  console.log('🔍 Recherche des correspondances par titre...\n');
  const correspondances = [];
  let processed = 0;

  for (const obcsTicket of obcsTickets) {
    processed++;
    const obcsKey = obcsTicket.obcsKey;
    const obcsTitle = obcsTicket.row['Résumé']?.trim() || '';
    const normalizedObcsTitle = normalizeTitle(obcsTitle);

    if (!normalizedObcsTitle) {
      continue;
    }

    // Chercher une correspondance exacte
    const matchingTickets = titleIndex.get(normalizedObcsTitle) || [];

    if (matchingTickets.length > 0) {
      // Prendre le premier match
      const odTicket = matchingTickets[0];
      correspondances.push({
        obcsKey: obcsKey,
        odKey: odTicket.jira_issue_key,
        summary: obcsTitle,
        matchType: 'exact'
      });
      console.log(`✅ ${obcsKey} → ${odTicket.jira_issue_key} (titre exact)`);
    } else {
      // Chercher une correspondance partielle (les premiers mots)
      const obcsWords = normalizedObcsTitle.split(' ').slice(0, 5).join(' ');
      for (const [normalizedTitle, tickets] of titleIndex.entries()) {
        if (normalizedTitle.includes(obcsWords) || obcsWords.includes(normalizedTitle.substring(0, obcsWords.length))) {
          correspondances.push({
            obcsKey: obcsKey,
            odKey: tickets[0].jira_issue_key,
            summary: obcsTitle,
            matchType: 'partial'
          });
          console.log(`✅ ${obcsKey} → ${tickets[0].jira_issue_key} (titre partiel)`);
          break;
        }
      }
    }

    if (processed % 10 === 0) {
      console.log(`   📊 ${processed}/${obcsTickets.length} OBCS traités... (${correspondances.length} correspondances trouvées)`);
    }
  }

  return correspondances;
}

async function findAndCompleteImport() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 RECHERCHE DES TICKETS OD PAR TITRE ET COMPLÉTION DE L\'IMPORT');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // 1. Charger le mapping de correspondance existant
  console.log('📖 Chargement du fichier de correspondance...');
  const { mapping: correspondanceMap, records: correspondanceRecords } = loadCorrespondanceMapping();
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

  // 4. Chercher les tickets OD par titre
  const newCorrespondances = await findODTicketsByTitle(obcsWithoutOD);

  if (newCorrespondances.length === 0) {
    console.log('\n⚠️  Aucune correspondance trouvée par titre.');
    return;
  }

  // 5. Mettre à jour le fichier de correspondance
  console.log(`\n📝 Mise à jour du fichier de correspondance avec ${newCorrespondances.length} nouvelles correspondances...`);
  saveCorrespondanceFile(correspondanceRecords, newCorrespondances);

  // 6. Afficher le résumé
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log(`   ✅ ${newCorrespondances.length} nouvelles correspondances trouvées`);
  console.log(`   📝 Fichier de correspondance mis à jour`);
  console.log(`\n💡 Vous pouvez maintenant relancer l'import dans Supabase avec:`);
  console.log(`   node scripts/import-tickets-from-csv.mjs\n`);
}

findAndCompleteImport().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

