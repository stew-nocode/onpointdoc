#!/usr/bin/env node

/**
 * Script pour traiter les tickets avec "Entreprises" = "ALL"
 * et leur mettre le canal = "Constat Interne"
 * 
 * Actions:
 * 1. Trouve la correspondance OBCS → OD via le CSV de correspondance
 * 2. Met le canal = "Constat Interne"
 * 3. Met affects_all_companies = true (si applicable)
 * 
 * Usage:
 *   node scripts/update-tickets-all-constat-interne.mjs [--dry-run]
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (error) {
  console.error('⚠️  Impossible de charger .env.local:', error.message);
}

const GOOGLE_SHEET_ID = '1cwjY3Chw5Y2ce_zzBBHOg3R3n1NntmHpLbuxNU8_WOQ';
const GID = '0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

const CORRESPONDENCE_CSV_PATH = path.resolve(__dirname, '../docs/ticket/correspondance - Jira (3).csv');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log('\n════════════════════════════════════════════════════════════════════════════════');
console.log('🎯 TRAITEMENT DES TICKETS "ALL" → CONSTAT INTERNE');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

if (isDryRun) {
  console.log('⚠️  MODE DRY-RUN : Aucune modification ne sera effectuée\n');
}

/**
 * Charge le fichier CSV de correspondance OBCS → OD
 */
function loadCorrespondenceMap() {
  console.log('📖 Chargement du fichier de correspondance OBCS → OD...');
  
  if (!existsSync(CORRESPONDENCE_CSV_PATH)) {
    throw new Error(`Fichier de correspondance introuvable: ${CORRESPONDENCE_CSV_PATH}`);
  }
  
  const csvContent = readFileSync(CORRESPONDENCE_CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    bom: true,
    skip_empty_lines: true,
    relax_quotes: true,
    columns: true
  });
  
  // Le CSV a les colonnes: "Résumé", "Clé de ticket" (OD), "Lien de ticket sortant (Duplicate)" (OBCS)
  const correspondenceMap = new Map();
  
  for (const record of records) {
    const odKey = record['Clé de ticket']?.trim();
    const obcsKey = record['Lien de ticket sortant (Duplicate)']?.trim();
    
    if (odKey && obcsKey && odKey.startsWith('OD-') && obcsKey.startsWith('OBCS-')) {
      const normalizedOBCS = obcsKey.toUpperCase();
      const normalizedOD = odKey.toUpperCase();
      correspondenceMap.set(normalizedOBCS, normalizedOD);
    }
  }
  
  console.log(`   ✅ ${correspondenceMap.size} correspondances chargées\n`);
  return correspondenceMap;
}

/**
 * Télécharge et parse le Google Sheet
 */
async function downloadSheet() {
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  return textDecoder.decode(arrayBuffer);
}

/**
 * Extrait les tickets avec "Entreprises" = "ALL"
 */
function extractTicketsAll(csvContent, correspondenceMap) {
  console.log('📊 Extraction des tickets avec "Entreprises" = "ALL"...\n');
  
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  if (rawRecords.length === 0) {
    throw new Error('Aucune donnée dans le CSV');
  }
  
  console.log(`✅ ${rawRecords.length} lignes trouvées`);
  
  // Trouver les colonnes
  const headers = rawRecords[0];
  const ticketKeyIndex = headers.findIndex(h => 
    h && (h.includes('Clé') || h.includes('ticket') || h.includes('Key'))
  );
  const companyIndex = headers.findIndex(h => 
    h && (h.includes('Entreprise') || h.includes('Company') || h.includes('Client'))
  );
  
  if (ticketKeyIndex === -1) {
    throw new Error('Colonne "Clé de ticket" introuvable');
  }
  if (companyIndex === -1) {
    throw new Error('Colonne "Entreprises" introuvable');
  }
  
  console.log(`✅ Colonne Clé de ticket: index ${ticketKeyIndex}`);
  console.log(`✅ Colonne Entreprises: index ${companyIndex}\n`);
  
  // Extraire les tickets avec "Entreprises" = "ALL"
  const tickets = [];
  let filteredOut = 0;
  let noCorrespondence = 0;
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.length <= Math.max(ticketKeyIndex, companyIndex)) {
      continue;
    }
    
    const ticketKey = row[ticketKeyIndex]?.trim();
    const company = row[companyIndex]?.trim();
    
    // Filtrer uniquement les tickets avec "Entreprises" = "ALL"
    if (!company || company.toUpperCase() !== 'ALL') {
      filteredOut++;
      continue;
    }
    
    if (!ticketKey || !ticketKey.toUpperCase().startsWith('OBCS-')) {
      continue;
    }
    
    const normalizedOBCS = ticketKey.toUpperCase();
    const odKey = correspondenceMap.get(normalizedOBCS);
    
    if (!odKey) {
      noCorrespondence++;
      continue;
    }
    
    tickets.push({
      obcsKey: normalizedOBCS,
      odKey
    });
  }
  
  console.log('📋 Statistiques:');
  console.log(`   - Tickets avec "Entreprises" = "ALL" et correspondance OD: ${tickets.length}`);
  console.log(`   - Tickets exclus (autre entreprise): ${filteredOut}`);
  console.log(`   - Tickets sans correspondance OD: ${noCorrespondence}\n`);
  
  return tickets;
}

/**
 * Trouve les tickets dans Supabase par leurs clés JIRA
 */
async function findTicketsByJiraKeys(jiraKeys) {
  console.log(`🔍 Recherche de ${jiraKeys.length} ticket(s) dans Supabase...`);
  
  const tickets = [];
  const notFound = [];
  
  // Traiter par lots de 100
  const batchSize = 100;
  for (let i = 0; i < jiraKeys.length; i += batchSize) {
    const batch = jiraKeys.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, company_id, canal, affects_all_companies')
      .in('jira_issue_key', batch);
    
    if (error) {
      console.error(`❌ Erreur lors de la recherche du lot ${Math.floor(i / batchSize) + 1}:`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      tickets.push(...data);
    }
    
    const foundKeys = new Set(data?.map(t => t.jira_issue_key) || []);
    const missingInBatch = batch.filter(key => !foundKeys.has(key));
    notFound.push(...missingInBatch);
  }
  
  console.log(`   ✅ Tickets trouvés: ${tickets.length}`);
  console.log(`   ❌ Tickets non trouvés: ${notFound.length}\n`);
  
  return { tickets, notFound };
}

/**
 * Met à jour les tickets : canal = "Constat Interne" et affects_all_companies = true
 */
async function updateTickets(tickets, ticketMap) {
  console.log(`🔗 Mise à jour de ${tickets.length} ticket(s)...\n`);
  
  if (isDryRun) {
    console.log('🧪 Mode DRY-RUN : aucune modification ne sera effectuée\n');
    
    let constatInterneCount = 0;
    let affectsAllCount = 0;
    
    for (const ticketData of tickets) {
      const ticket = ticketMap.get(ticketData.odKey);
      
      if (!ticket) {
        continue;
      }
      
      if (ticket.canal === 'Constat Interne') {
        constatInterneCount++;
      }
      
      if (ticket.affects_all_companies === true) {
        affectsAllCount++;
      }
    }
    
    console.log(`   📊 Statistiques prévisionnelles:`);
    console.log(`      - Tickets déjà avec canal "Constat Interne": ${constatInterneCount}`);
    console.log(`      - Tickets déjà avec affects_all_companies = true: ${affectsAllCount}\n`);
    
    return {
      updated: tickets.length,
      canalUpdated: tickets.length - constatInterneCount,
      affectsAllUpdated: tickets.length - affectsAllCount,
      errors: []
    };
  }
  
  let totalCanalUpdated = 0;
  let totalAffectsAllUpdated = 0;
  const errors = [];
  
  // Traiter par lots de 50
  const batchSize = 50;
  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(tickets.length / batchSize);
    
    console.log(`   📦 Lot ${batchNumber}/${totalBatches} (${batch.length} ticket(s))...`);
    
    for (const ticketData of batch) {
      const ticket = ticketMap.get(ticketData.odKey);
      
      if (!ticket) {
        errors.push({ ticket: ticketData.odKey, error: 'Ticket introuvable' });
        continue;
      }
      
      try {
        const updates = {};
        let needsUpdate = false;
        
        // 1. Mettre à jour canal = "Constat Interne"
        if (ticket.canal !== 'Constat Interne') {
          updates.canal = 'Constat Interne';
          needsUpdate = true;
        }
        
        // 2. Mettre à jour affects_all_companies = true
        if (ticket.affects_all_companies !== true) {
          updates.affects_all_companies = true;
          needsUpdate = true;
        }
        
        // 3. Mettre company_id = NULL si affects_all_companies = true
        if (ticket.company_id !== null && updates.affects_all_companies === true) {
          updates.company_id = null;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('tickets')
            .update(updates)
            .eq('id', ticket.id);
          
          if (updateError) {
            errors.push({ ticket: ticketData.odKey, error: updateError.message });
          } else {
            if (updates.canal) totalCanalUpdated++;
            if (updates.affects_all_companies) totalAffectsAllUpdated++;
          }
        }
        
        // Petite pause pour éviter de surcharger la DB
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        errors.push({ ticket: ticketData.odKey, error: error.message });
      }
    }
  }
  
  console.log(`\n📊 Résultat global:`);
  console.log(`   - Canal mis à jour: ${totalCanalUpdated}`);
  console.log(`   - affects_all_companies mis à jour: ${totalAffectsAllUpdated}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length}`);
  }
  
  return {
    canalUpdated: totalCanalUpdated,
    affectsAllUpdated: totalAffectsAllUpdated,
    errors
  };
}

async function main() {
  try {
    // 1. Charger le fichier de correspondance OBCS → OD
    const correspondenceMap = loadCorrespondenceMap();
    
    // 2. Télécharger le Google Sheet
    const csvContent = await downloadSheet();
    
    // 3. Extraire les tickets avec "Entreprises" = "ALL"
    const tickets = extractTicketsAll(csvContent, correspondenceMap);
    
    if (tickets.length === 0) {
      console.log('❌ Aucun ticket trouvé. Arrêt.');
      process.exit(0);
    }
    
    // 4. Trouver les tickets dans Supabase
    const odKeys = tickets.map(t => t.odKey);
    const { tickets: foundTickets, notFound } = await findTicketsByJiraKeys(odKeys);
    
    if (foundTickets.length === 0) {
      console.log('❌ Aucun ticket trouvé dans Supabase. Arrêt.');
      process.exit(0);
    }
    
    // Créer un Map pour accès rapide
    const ticketMap = new Map(foundTickets.map(t => [t.jira_issue_key, t]));
    
    // Filtrer les tickets valides pour ne garder que ceux trouvés dans Supabase
    const ticketsToUpdate = tickets.filter(t => ticketMap.has(t.odKey));
    const ticketsNotFoundInSupabase = tickets.filter(t => !ticketMap.has(t.odKey));
    
    console.log(`\n📋 Tickets à mettre à jour: ${ticketsToUpdate.length}/${tickets.length}`);
    if (ticketsNotFoundInSupabase.length > 0) {
      console.log(`   ⚠️  Tickets valides non trouvés dans Supabase: ${ticketsNotFoundInSupabase.length}`);
      if (ticketsNotFoundInSupabase.length <= 5) {
        ticketsNotFoundInSupabase.forEach(t => console.log(`      - ${t.odKey} (OBCS: ${t.obcsKey})`));
      }
    }
    console.log('');
    
    // 5. Mettre à jour les tickets
    const result = await updateTickets(ticketsToUpdate, ticketMap);
    
    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log('✅ OPÉRATION TERMINÉE');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    console.log(`📊 Résumé:`);
    console.log(`   - Tickets traités: ${ticketsToUpdate.length}`);
    console.log(`   - Canal mis à jour: ${result.canalUpdated}`);
    console.log(`   - affects_all_companies mis à jour: ${result.affectsAllUpdated}`);
    if (result.errors.length > 0) {
      console.log(`   - Erreurs: ${result.errors.length}`);
    }
    
    if (notFound.length > 0) {
      console.log(`\n⚠️  Tickets non trouvés dans Supabase (${notFound.length}):`);
      notFound.slice(0, 10).forEach(key => console.log(`   - ${key}`));
      if (notFound.length > 10) {
        console.log(`   ... et ${notFound.length - 10} autre(s)`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

