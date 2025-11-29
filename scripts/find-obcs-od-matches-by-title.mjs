#!/usr/bin/env node

/**
 * Script pour trouver des correspondances entre tickets OBCS et OD par titre exact
 * 
 * Recherche les tickets OBCS qui n'ont pas de correspondance dans le fichier
 * mais qui pourraient correspondre à des tickets OD dans Supabase par titre exact.
 * 
 * Usage:
 *   node scripts/find-obcs-od-matches-by-title.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local en priorité si présent
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

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

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
 * Charge et parse le fichier de correspondance OBCS → OD
 */
function loadCorrespondanceMapping() {
  console.log('📖 Chargement du fichier de correspondance OBCS → OD...');
  
  try {
    const content = readFileSync(CORRESPONDANCE_CSV_PATH, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const mapping = new Map();
    for (const record of records) {
      const obcsKey = record['Lien de ticket sortant (Duplicate)']?.trim();
      const odKey = record['Clé de ticket']?.trim();
      
      if (obcsKey && odKey && obcsKey.startsWith('OBCS-')) {
        mapping.set(obcsKey, odKey);
      }
    }

    console.log(`✅ ${mapping.size} correspondances OBCS → OD chargées\n`);
    return mapping;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la correspondance:', error.message);
    return new Map();
  }
}

/**
 * Normalise un titre pour la comparaison (trim, lowercase, supprime espaces multiples)
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[^\w\s]/g, ''); // Supprimer la ponctuation pour comparaison plus flexible
}

async function findMatchesByTitle() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 RECHERCHE DE CORRESPONDANCES PAR TITRE EXACT');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // 1. Charger le mapping de correspondance existant
  const correspondanceMap = loadCorrespondanceMapping();

  // 2. Charger tous les tickets OD depuis Supabase
  console.log('📥 Chargement des tickets OD depuis Supabase...');
  const { data: odTickets, error: odError } = await supabase
    .from('tickets')
    .select('id, jira_issue_key, title')
    .like('jira_issue_key', 'OD-%')
    .not('title', 'is', null);

  if (odError) {
    console.error('❌ Erreur lors du chargement des tickets OD:', odError.message);
    process.exit(1);
  }

  console.log(`✅ ${odTickets.length} tickets OD chargés depuis Supabase\n`);

  // 3. Créer un index des titres OD (normalisés) pour recherche rapide
  const odTicketsByTitle = new Map();
  for (const ticket of odTickets) {
    if (ticket.title) {
      const normalizedTitle = normalizeTitle(ticket.title);
      if (!odTicketsByTitle.has(normalizedTitle)) {
        odTicketsByTitle.set(normalizedTitle, []);
      }
      odTicketsByTitle.get(normalizedTitle).push(ticket);
    }
  }

  console.log(`📊 Index créé: ${odTicketsByTitle.size} titres uniques dans Supabase\n`);

  // 4. Charger le CSV des tickets
  console.log('📖 Chargement du CSV des tickets...');
  const csvContent = readFileSync(TICKETS_CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  console.log(`✅ ${records.length} tickets trouvés dans le CSV\n`);

  // 5. Identifier les tickets OBCS sans correspondance
  const obcsWithoutMapping = [];
  for (const row of records) {
    const csvJiraKey = row['Clé de ticket']?.trim();
    const title = row['Résumé']?.trim();

    if (!csvJiraKey || !title) continue;

    // Si c'est une clé OBCS sans correspondance dans le fichier
    if (csvJiraKey.startsWith('OBCS-') && !correspondanceMap.has(csvJiraKey)) {
      obcsWithoutMapping.push({
        jiraKey: csvJiraKey,
        title: title
      });
    }
  }

  console.log(`📋 ${obcsWithoutMapping.length} tickets OBCS sans correspondance dans le fichier\n`);

  // 6. Rechercher les correspondances par titre
  console.log('🔍 Recherche de correspondances par titre exact...\n');
  
  const matches = [];
  const noMatches = [];

  for (const obcsTicket of obcsWithoutMapping) {
    const normalizedTitle = normalizeTitle(obcsTicket.title);
    const matchingOdTickets = odTicketsByTitle.get(normalizedTitle);

    if (matchingOdTickets && matchingOdTickets.length > 0) {
      matches.push({
        obcsKey: obcsTicket.jiraKey,
        obcsTitle: obcsTicket.title,
        odTickets: matchingOdTickets
      });
    } else {
      noMatches.push(obcsTicket);
    }
  }

  // 7. Afficher les résultats
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSULTATS');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log(`   ✅ Correspondances trouvées: ${matches.length}`);
  console.log(`   ❌ Pas de correspondance: ${noMatches.length}\n`);

  if (matches.length > 0) {
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('✅ CORRESPONDANCES TROUVÉES PAR TITRE');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    matches.slice(0, 20).forEach((match, index) => {
      console.log(`${index + 1}. ${match.obcsKey}`);
      console.log(`   Titre: ${match.obcsTitle}`);
      console.log(`   → Correspondance(s) OD:`);
      match.odTickets.forEach(odTicket => {
        console.log(`      - ${odTicket.jira_issue_key}: ${odTicket.title}`);
      });
      console.log('');
    });

    if (matches.length > 20) {
      console.log(`   ... et ${matches.length - 20} autres correspondances\n`);
    }

    // Sauvegarder dans un fichier pour référence
    const fs = await import('fs');
    const outputPath = path.join(__dirname, '../docs/ticket/correspondances-par-titre.json');
    fs.writeFileSync(outputPath, JSON.stringify(matches, null, 2));
    console.log(`💾 Résultats sauvegardés dans: ${outputPath}\n`);
  }

  if (noMatches.length > 0 && noMatches.length <= 50) {
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('❌ TICKETS OBCS SANS CORRESPONDANCE');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    noMatches.slice(0, 10).forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.jiraKey}`);
      console.log(`   ${ticket.title}\n`);
    });

    if (noMatches.length > 10) {
      console.log(`   ... et ${noMatches.length - 10} autres tickets sans correspondance\n`);
    }
  }

  console.log('✅ Recherche terminée');
}

// Exécuter la recherche
findMatchesByTitle().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





