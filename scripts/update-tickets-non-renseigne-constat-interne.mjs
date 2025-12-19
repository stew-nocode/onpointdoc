#!/usr/bin/env node

/**
 * Script pour traiter les tickets avec "Utilisateurs" = "Non renseigné"
 * 
 * Actions:
 * 1. Trouve la correspondance OBCS → OD via le CSV de correspondance
 * 2. Associe les tickets aux entreprises (colonne "Entreprises")
 * 3. Met le canal = "Constat Interne"
 * 
 * Usage:
 *   node scripts/update-tickets-non-renseigne-constat-interne.mjs [--dry-run]
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
console.log('🎯 TRAITEMENT DES TICKETS "NON RENSEIGNÉ" → CONSTAT INTERNE');
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
 * Extrait les tickets avec "Utilisateurs" = "Non renseigné"
 */
function extractTicketsNonRenseigne(csvContent, correspondenceMap) {
  console.log('📊 Extraction des tickets avec "Utilisateurs" = "Non renseigné"...\n');
  
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
  const userIndex = headers.findIndex(h => 
    h && (h.includes('Utilisateur') || h.includes('User') || h.includes('Contact'))
  );
  
  if (ticketKeyIndex === -1) {
    throw new Error('Colonne "Clé de ticket" introuvable');
  }
  if (companyIndex === -1) {
    throw new Error('Colonne "Entreprises" introuvable');
  }
  if (userIndex === -1) {
    throw new Error('Colonne "Utilisateurs" introuvable');
  }
  
  console.log(`✅ Colonne Clé de ticket: index ${ticketKeyIndex}`);
  console.log(`✅ Colonne Entreprises: index ${companyIndex}`);
  console.log(`✅ Colonne Utilisateurs: index ${userIndex}\n`);
  
  // Extraire les tickets avec "Utilisateurs" = "Non renseigné"
  const tickets = [];
  let filteredOut = 0;
  let noCorrespondence = 0;
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.length <= Math.max(ticketKeyIndex, companyIndex, userIndex)) {
      continue;
    }
    
    const ticketKey = row[ticketKeyIndex]?.trim();
    const company = row[companyIndex]?.trim();
    const user = row[userIndex]?.trim();
    
    // Filtrer uniquement les tickets avec "Utilisateurs" = "Non renseigné"
    if (!user || user.toLowerCase() !== 'non renseigné') {
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
    
    // Ignorer "Non renseigné", "ALL", et valeurs vides pour l'entreprise
    if (!company || company.toLowerCase() === 'non renseigné' || company.toUpperCase() === 'ALL') {
      continue;
    }
    
    tickets.push({
      obcsKey: normalizedOBCS,
      odKey,
      companyName: company.trim()
    });
  }
  
  // Compter aussi ceux avec entreprise invalide
  let validCompanyCount = tickets.length;
  
  console.log('📋 Statistiques:');
  console.log(`   - Tickets avec "Utilisateurs" = "Non renseigné" et correspondance OD: ${validCompanyCount}`);
  console.log(`   - Tickets exclus (utilisateur renseigné): ${filteredOut}`);
  console.log(`   - Tickets sans correspondance OD: ${noCorrespondence}\n`);
  
  return tickets;
}

/**
 * Trouve une entreprise dans Supabase par son nom
 */
async function findCompanyInSupabase(companyName) {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', companyName)
    .limit(5);
  
  if (error) {
    throw new Error(`Erreur lors de la recherche de l'entreprise: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    return null;
  }
  
  // Chercher une correspondance exacte (insensible à la casse)
  const exactMatch = data.find(c => c.name.toUpperCase() === companyName.toUpperCase());
  return exactMatch || data[0];
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
      .select('id, jira_issue_key, company_id, canal')
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
 * Met à jour les tickets : associe à l'entreprise et met canal = "Constat Interne"
 */
async function updateTickets(tickets, companyMap, ticketMap) {
  console.log(`🔗 Mise à jour de ${tickets.length} ticket(s)...\n`);
  
  if (isDryRun) {
    console.log('🧪 Mode DRY-RUN : aucune modification ne sera effectuée\n');
    
    let constatInterneCount = 0;
    let alreadyAssociated = 0;
    
    for (const ticketData of tickets) {
      const ticket = ticketMap.get(ticketData.odKey);
      const company = companyMap.get(ticketData.companyName);
      
      if (!ticket || !company) {
        continue;
      }
      
      if (ticket.canal === 'Constat Interne') {
        constatInterneCount++;
      }
      
      if (ticket.company_id === company.id) {
        alreadyAssociated++;
      }
    }
    
    console.log(`   📊 Statistiques prévisionnelles:`);
    console.log(`      - Tickets déjà avec canal "Constat Interne": ${constatInterneCount}`);
    console.log(`      - Tickets déjà associés à l'entreprise: ${alreadyAssociated}\n`);
    
    return {
      updated: tickets.length,
      linked: tickets.length,
      canalUpdated: tickets.length - constatInterneCount,
      errors: []
    };
  }
  
  let totalLinked = 0;
  let totalCanalUpdated = 0;
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
      const company = companyMap.get(ticketData.companyName);
      
      if (!ticket) {
        errors.push({ ticket: ticketData.odKey, error: 'Ticket introuvable' });
        continue;
      }
      
      if (!company) {
        errors.push({ ticket: ticketData.odKey, error: `Entreprise "${ticketData.companyName}" introuvable` });
        continue;
      }
      
      try {
        // 1. Créer le lien dans ticket_company_link
        const { error: linkError } = await supabase
          .from('ticket_company_link')
          .upsert({
            ticket_id: ticket.id,
            company_id: company.id,
            is_primary: true,
            role: 'affected'
          }, {
            onConflict: 'ticket_id,company_id',
            ignoreDuplicates: false
          });
        
        if (linkError) {
          errors.push({ ticket: ticketData.odKey, error: `Lien: ${linkError.message}` });
        } else {
          totalLinked++;
        }
        
        // 2. Mettre à jour company_id (pour compatibilité)
        const { error: companyError } = await supabase
          .from('tickets')
          .update({ company_id: company.id })
          .eq('id', ticket.id);
        
        if (companyError) {
          errors.push({ ticket: ticketData.odKey, error: `Company: ${companyError.message}` });
        }
        
        // 3. Mettre à jour canal = "Constat Interne"
        if (ticket.canal !== 'Constat Interne') {
          const { error: canalError } = await supabase
            .from('tickets')
            .update({ canal: 'Constat Interne' })
            .eq('id', ticket.id);
          
          if (canalError) {
            errors.push({ ticket: ticketData.odKey, error: `Canal: ${canalError.message}` });
          } else {
            totalCanalUpdated++;
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
  console.log(`   - Liens créés: ${totalLinked}/${tickets.length}`);
  console.log(`   - Canal mis à jour: ${totalCanalUpdated}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length}`);
  }
  
  return {
    linked: totalLinked,
    canalUpdated: totalCanalUpdated,
    errors
  };
}

async function main() {
  try {
    // 1. Charger le fichier de correspondance OBCS → OD
    const correspondenceMap = loadCorrespondenceMap();
    
    // 2. Télécharger le Google Sheet
    const csvContent = await downloadSheet();
    
    // 3. Extraire les tickets avec "Utilisateurs" = "Non renseigné"
    const tickets = extractTicketsNonRenseigne(csvContent, correspondenceMap);
    
    if (tickets.length === 0) {
      console.log('❌ Aucun ticket trouvé. Arrêt.');
      process.exit(0);
    }
    
    // 4. Grouper par entreprise et trouver les entreprises dans Supabase
    console.log('🔍 Recherche des entreprises dans Supabase...');
    const uniqueCompanies = [...new Set(tickets.map(t => t.companyName))];
    const companyMap = new Map();
    const companiesNotFound = [];
    
    for (const companyName of uniqueCompanies) {
      const company = await findCompanyInSupabase(companyName);
      if (company) {
        companyMap.set(companyName, company);
      } else {
        companiesNotFound.push(companyName);
      }
    }
    
    console.log(`   ✅ Entreprises trouvées: ${companyMap.size}/${uniqueCompanies.length}`);
    if (companiesNotFound.length > 0) {
      console.log(`   ❌ Entreprises non trouvées: ${companiesNotFound.length}`);
      if (companiesNotFound.length <= 10) {
        companiesNotFound.forEach(name => console.log(`      - ${name}`));
      }
      console.log('');
    }
    
    // Filtrer les tickets pour ne garder que ceux avec une entreprise trouvée
    const validTickets = tickets.filter(t => companyMap.has(t.companyName));
    console.log(`\n📋 Tickets valides (avec entreprise trouvée): ${validTickets.length}/${tickets.length}\n`);
    
    if (validTickets.length === 0) {
      console.log('❌ Aucun ticket valide. Arrêt.');
      process.exit(0);
    }
    
    // 5. Trouver les tickets dans Supabase
    const odKeys = validTickets.map(t => t.odKey);
    const { tickets: foundTickets, notFound } = await findTicketsByJiraKeys(odKeys);
    
    if (foundTickets.length === 0) {
      console.log('❌ Aucun ticket trouvé dans Supabase. Arrêt.');
      process.exit(0);
    }
    
    // Créer un Map pour accès rapide
    const ticketMap = new Map(foundTickets.map(t => [t.jira_issue_key, t]));
    
    // Filtrer les tickets valides pour ne garder que ceux trouvés dans Supabase
    const ticketsToUpdate = validTickets.filter(t => ticketMap.has(t.odKey));
    const ticketsNotFoundInSupabase = validTickets.filter(t => !ticketMap.has(t.odKey));
    
    console.log(`\n📋 Tickets à mettre à jour: ${ticketsToUpdate.length}/${validTickets.length}`);
    if (ticketsNotFoundInSupabase.length > 0) {
      console.log(`   ⚠️  Tickets valides non trouvés dans Supabase: ${ticketsNotFoundInSupabase.length}`);
      if (ticketsNotFoundInSupabase.length <= 5) {
        ticketsNotFoundInSupabase.forEach(t => console.log(`      - ${t.odKey} (OBCS: ${t.obcsKey})`));
      }
    }
    console.log('');
    
    // 6. Mettre à jour les tickets
    const result = await updateTickets(ticketsToUpdate, companyMap, ticketMap);
    
    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log('✅ OPÉRATION TERMINÉE');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    console.log(`📊 Résumé:`);
    console.log(`   - Tickets traités: ${ticketsToUpdate.length}`);
    console.log(`   - Liens créés: ${result.linked}`);
    console.log(`   - Canal mis à jour: ${result.canalUpdated}`);
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
    
    if (companiesNotFound.length > 0) {
      console.log(`\n⚠️  Entreprises non trouvées dans Supabase (${companiesNotFound.length}):`);
      companiesNotFound.slice(0, 10).forEach(name => console.log(`   - ${name}`));
      if (companiesNotFound.length > 10) {
        console.log(`   ... et ${companiesNotFound.length - 10} autre(s)`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

