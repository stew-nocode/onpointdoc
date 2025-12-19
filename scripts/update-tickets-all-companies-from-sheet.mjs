#!/usr/bin/env node

/**
 * Script pour mettre à jour le champ affects_all_companies des tickets
 * depuis le Google Sheet filtré sur les tickets qui affectent toutes les entreprises
 * 
 * Actions :
 * 1. Met à jour affects_all_companies = true
 * 2. Met company_id = NULL (car le ticket concerne toutes les entreprises)
 * 3. Supprime les liens existants dans ticket_company_link
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (error) {
  console.error('⚠️  Impossible de charger .env.local:', error.message);
}

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

const OD_COLUMN = 'OD';
const CLIENTS_COLUMN = 'Champs personnalisés (Client(s))';
const ALL_COMPANIES_VALUE = 'ALL'; // Valeur qui indique "toutes les entreprises"

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function downloadSheet() {
  console.log('📥 Téléchargement du Google Sheet filtré...');
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  // Forcer UTF-8 pour éviter les problèmes d'encodage
  const arrayBuffer = await response.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  return textDecoder.decode(arrayBuffer);
}

async function extractODKeys(csvContent) {
  console.log('📊 Analyse du CSV filtré...');
  
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
  
  // Trouver les colonnes OD et Clients
  const headers = rawRecords[0];
  const odIndex = headers.indexOf(OD_COLUMN);
  const clientsIndex = headers.indexOf(CLIENTS_COLUMN);
  
  if (odIndex === -1) {
    console.error('❌ Colonne OD introuvable dans les headers');
    console.log('\nHeaders disponibles:');
    headers.forEach((h, i) => {
      if (h) console.log(`   [${i}] ${h}`);
    });
    throw new Error('Colonne OD introuvable');
  }
  
  if (clientsIndex === -1) {
    console.warn('⚠️  Colonne "Champs personnalisés (Client(s))" introuvable');
    console.warn('⚠️  Le script va traiter TOUS les tickets du fichier');
    console.log('\nHeaders disponibles:');
    headers.forEach((h, i) => {
      if (h && (h.includes('Client') || h.includes('OD'))) {
        console.log(`   [${i}] ${h}`);
      }
    });
  }
  
  console.log(`✅ Colonne OD trouvée à l'index ${odIndex}`);
  if (clientsIndex !== -1) {
    console.log(`✅ Colonne Clients trouvée à l'index ${clientsIndex}`);
    console.log(`🔍 Filtrage sur les tickets avec "${ALL_COMPANIES_VALUE}" dans la colonne Clients\n`);
  } else {
    console.log(`⚠️  Traitement de TOUS les tickets (filtre non appliqué)\n`);
  }
  
  // Extraire uniquement les clés OD avec "ALL" dans la colonne Clients
  const odKeys = new Set();
  let emptyOD = 0;
  let invalidOD = 0;
  let filteredOut = 0;
  let allCompanies = 0;
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.length <= odIndex) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    
    if (!odKey) {
      emptyOD++;
      continue;
    }
    
    // Si la colonne Clients existe, filtrer uniquement sur "ALL"
    if (clientsIndex !== -1 && row.length > clientsIndex) {
      const clientsValue = row[clientsIndex]?.trim().toUpperCase();
      
      // Ne prendre que les tickets avec "ALL"
      if (clientsValue !== ALL_COMPANIES_VALUE.toUpperCase()) {
        filteredOut++;
        continue; // Ignorer les autres tickets
      }
      
      allCompanies++;
    }
    
    // Normaliser la clé OD (OD-XXXX)
    const normalizedOD = odKey.toUpperCase().startsWith('OD-') 
      ? odKey.toUpperCase() 
      : `OD-${odKey.toUpperCase()}`;
    
    if (!/^OD-\d+$/.test(normalizedOD)) {
      invalidOD++;
      console.warn(`⚠️  Clé OD invalide ignorée: ${odKey}`);
      continue;
    }
    
    odKeys.add(normalizedOD);
  }
  
  console.log('📋 Statistiques:');
  console.log(`   - Clés OD valides avec "${ALL_COMPANIES_VALUE}": ${odKeys.size}`);
  if (clientsIndex !== -1) {
    console.log(`   - Tickets filtrés (avec "ALL"): ${allCompanies}`);
    console.log(`   - Tickets exclus (autres entreprises): ${filteredOut}`);
  }
  console.log(`   - Clés OD vides: ${emptyOD}`);
  console.log(`   - Clés OD invalides: ${invalidOD}\n`);
  
  return Array.from(odKeys);
}

async function findTicketsByJiraKeys(jiraKeys) {
  console.log(`🔍 Recherche des tickets dans Supabase pour ${jiraKeys.length} clés JIRA...`);
  
  const tickets = [];
  const notFound = [];
  
  // Traiter par lots de 100 (limite Supabase in())
  const batchSize = 100;
  for (let i = 0; i < jiraKeys.length; i += batchSize) {
    const batch = jiraKeys.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, affects_all_companies, company_id')
      .in('jira_issue_key', batch);
    
    if (error) {
      console.error(`❌ Erreur lors de la recherche du lot ${Math.floor(i / batchSize) + 1}:`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      tickets.push(...data);
      console.log(`   ✅ Lot ${Math.floor(i / batchSize) + 1}: ${data.length} ticket(s) trouvé(s)`);
    }
    
    // Identifier les clés non trouvées
    const foundKeys = new Set(data?.map(t => t.jira_issue_key) || []);
    const missingInBatch = batch.filter(key => !foundKeys.has(key));
    notFound.push(...missingInBatch);
  }
  
  console.log(`\n📊 Résultat de la recherche:`);
  console.log(`   - Tickets trouvés: ${tickets.length}`);
  console.log(`   - Tickets non trouvés: ${notFound.length}`);
  
  if (notFound.length > 0 && notFound.length <= 10) {
    console.log(`\n⚠️  Tickets non trouvés (exemples):`);
    notFound.slice(0, 10).forEach(key => console.log(`   - ${key}`));
  } else if (notFound.length > 10) {
    console.log(`\n⚠️  ${notFound.length} tickets non trouvés (voir le rapport final)`);
  }
  
  return { tickets, notFound };
}

async function updateTicketsToAllCompanies(ticketIds) {
  console.log(`\n🔄 Mise à jour de ${ticketIds.length} ticket(s)...`);
  
  if (isDryRun) {
    console.log('🧪 Mode DRY-RUN : aucune modification ne sera effectuée');
    return { updated: ticketIds.length, errors: [] };
  }
  
  // Traiter par lots de 100 pour éviter les timeouts
  const batchSize = 100;
  let totalUpdated = 0;
  const allUpdatedTickets = [];
  const errors = [];
  
  for (let i = 0; i < ticketIds.length; i += batchSize) {
    const batch = ticketIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(ticketIds.length / batchSize);
    
    console.log(`   📦 Traitement du lot ${batchNumber}/${totalBatches} (${batch.length} ticket(s))...`);
    
    try {
      // 1. Mettre à jour affects_all_companies = true et company_id = NULL
      const { data: updateData, error: updateError } = await supabase
        .from('tickets')
        .update({
          affects_all_companies: true,
          company_id: null
        })
        .in('id', batch)
        .select('id, jira_issue_key');
      
      if (updateError) {
        console.error(`   ❌ Erreur lot ${batchNumber}:`, updateError);
        console.error(`   Détails:`, JSON.stringify(updateError, null, 2));
        errors.push({
          batch: batchNumber,
          error: updateError.message,
          ticketIds: batch
        });
        continue;
      }
      
      const updatedCount = updateData?.length || 0;
      totalUpdated += updatedCount;
      if (updateData) {
        allUpdatedTickets.push(...updateData);
      }
      
      console.log(`   ✅ Lot ${batchNumber}: ${updatedCount} ticket(s) mis à jour`);
      
      // 2. Supprimer les liens existants dans ticket_company_link pour ce lot
      const { error: deleteError, count: deleteCount } = await supabase
        .from('ticket_company_link')
        .delete()
        .in('ticket_id', batch);
      
      if (deleteError) {
        console.warn(`   ⚠️  Erreur lors de la suppression des liens (lot ${batchNumber}): ${deleteError.message}`);
      } else {
        console.log(`   🗑️  Liens supprimés pour le lot ${batchNumber}`);
      }
      
      // Petite pause entre les lots pour éviter la surcharge
      if (i + batchSize < ticketIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`   ❌ Erreur inattendue lot ${batchNumber}:`, error.message);
      errors.push({
        batch: batchNumber,
        error: error.message,
        ticketIds: batch
      });
    }
  }
  
  console.log(`\n📊 Résultat global:`);
  console.log(`   - Tickets mis à jour: ${totalUpdated}/${ticketIds.length}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length} lot(s) en erreur`);
  }
  
  return { 
    updated: totalUpdated, 
    errors,
    updatedTickets: allUpdatedTickets
  };
}

async function generateReport(tickets, notFound, updatedTickets, odKeys) {
  console.log('\n📄 Génération du rapport...');
  
  const reportLines = [
    '# Rapport : Mise à jour des tickets "toutes les entreprises"',
    '',
    `**Date** : ${new Date().toISOString().split('T')[0]}`,
    `**Mode** : ${isDryRun ? 'DRY-RUN (simulation)' : 'PRODUCTION'}`,
    '',
    '## Résumé',
    '',
    `- **Tickets dans le fichier** : ${odKeys.length}`,
    `- **Tickets trouvés dans Supabase** : ${tickets.length}`,
    `- **Tickets non trouvés** : ${notFound.length}`,
    `- **Tickets mis à jour** : ${updatedTickets?.length || 0}`,
    '',
    '## Tickets mis à jour',
    '',
    '| Clé JIRA | ID Ticket | affects_all_companies | company_id |',
    '|----------|-----------|----------------------|------------|',
  ];
  
  if (updatedTickets && updatedTickets.length > 0) {
    updatedTickets.forEach(t => {
      reportLines.push(`| ${t.jira_issue_key} | ${t.id} | true | NULL |`);
    });
  } else {
    reportLines.push('| (Aucun) | | | |');
  }
  
  if (notFound.length > 0) {
    reportLines.push('', '## Tickets non trouvés dans Supabase', '');
    notFound.slice(0, 50).forEach(key => {
      reportLines.push(`- ${key}`);
    });
    if (notFound.length > 50) {
      reportLines.push(`\n... et ${notFound.length - 50} autre(s) ticket(s)`);
    }
  }
  
  const reportPath = path.join(__dirname, '..', 'docs', 'ticket', `rapport-tickets-all-companies-${Date.now()}.md`);
  const reportDir = path.dirname(reportPath);
  
  // Créer le dossier si nécessaire
  try {
    await import('fs').then(fs => {
      if (!fs.default.existsSync(reportDir)) {
        fs.default.mkdirSync(reportDir, { recursive: true });
      }
      fs.default.writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
      console.log(`✅ Rapport créé: ${reportPath}`);
    });
  } catch (error) {
    console.warn('⚠️  Impossible de créer le rapport:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage de la mise à jour des tickets "toutes les entreprises"\n');
    console.log(`Mode: ${isDryRun ? '🧪 DRY-RUN (simulation)' : '⚡ PRODUCTION'}\n`);
    
    // 1. Télécharger le fichier filtré
    const csvContent = await downloadSheet();
    
    // 2. Extraire les clés OD
    const odKeys = await extractODKeys(csvContent);
    
    if (odKeys.length === 0) {
      console.log('❌ Aucune clé OD valide trouvée. Arrêt.');
      process.exit(1);
    }
    
    // 3. Trouver les tickets dans Supabase
    const { tickets, notFound } = await findTicketsByJiraKeys(odKeys);
    
    if (tickets.length === 0) {
      console.log('\n❌ Aucun ticket trouvé dans Supabase. Arrêt.');
      process.exit(1);
    }
    
    // Filtrer les tickets déjà à jour
    const ticketsToUpdate = tickets.filter(t => 
      !t.affects_all_companies || t.company_id !== null
    );
    
    const alreadyUpToDate = tickets.filter(t => 
      t.affects_all_companies && t.company_id === null
    );
    
    console.log(`\n📊 État actuel:`);
    console.log(`   - Tickets déjà à jour: ${alreadyUpToDate.length}`);
    console.log(`   - Tickets à mettre à jour: ${ticketsToUpdate.length}`);
    
    if (ticketsToUpdate.length === 0) {
      console.log('\n✅ Tous les tickets sont déjà à jour !');
    } else {
      // 4. Mettre à jour les tickets
      const ticketIds = ticketsToUpdate.map(t => t.id);
      const result = await updateTicketsToAllCompanies(ticketIds);
      
      console.log(`\n✅ Mise à jour terminée !`);
      console.log(`   - Tickets mis à jour: ${result.updated}`);
      
      // 5. Générer le rapport
      await generateReport(tickets, notFound, result.updatedTickets || ticketsToUpdate, odKeys);
    }
    
    console.log('\n✅ Opération terminée avec succès !');
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

