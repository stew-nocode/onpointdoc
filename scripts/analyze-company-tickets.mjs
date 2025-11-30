#!/usr/bin/env node

/**
 * Script de diagnostic pour analyser les tickets filtrés sur une entreprise spécifique
 */

import { parse } from 'csv-parse/sync';

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

const OD_COLUMN = 'OD';
const CLIENTS_COLUMN = 'Champs personnalisés (Client(s))';

async function downloadSheet() {
  console.log('📥 Téléchargement du Google Sheet filtré...');
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  return textDecoder.decode(arrayBuffer);
}

async function analyzeFilteredTickets(csvContent) {
  console.log('📊 Analyse du CSV filtré...\n');
  
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
  const odIndex = headers.indexOf(OD_COLUMN);
  const clientsIndex = headers.indexOf(CLIENTS_COLUMN);
  
  if (odIndex === -1) {
    throw new Error('Colonne OD introuvable');
  }
  
  console.log(`✅ Colonne OD: index ${odIndex}`);
  if (clientsIndex !== -1) {
    console.log(`✅ Colonne Clients: index ${clientsIndex}\n`);
  } else {
    console.log(`⚠️  Colonne Clients introuvable\n`);
  }
  
  // Extraire les clés OD et la valeur de l'entreprise
  const odKeys = [];
  let emptyOD = 0;
  let invalidOD = 0;
  const companiesFound = new Set();
  
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
    
    // Normaliser la clé OD
    const normalizedOD = odKey.toUpperCase().startsWith('OD-') 
      ? odKey.toUpperCase() 
      : `OD-${odKey.toUpperCase()}`;
    
    if (!/^OD-\d+$/.test(normalizedOD)) {
      invalidOD++;
      continue;
    }
    
    // Récupérer l'entreprise si disponible
    let companyName = null;
    if (clientsIndex !== -1 && row.length > clientsIndex) {
      companyName = row[clientsIndex]?.trim();
      if (companyName) {
        companiesFound.add(companyName);
      }
    }
    
    odKeys.push({
      od: normalizedOD,
      company: companyName
    });
  }
  
  console.log('📋 Statistiques:');
  console.log(`   - Clés OD valides: ${odKeys.length}`);
  console.log(`   - Clés OD vides: ${emptyOD}`);
  console.log(`   - Clés OD invalides: ${invalidOD}`);
  
  if (companiesFound.size > 0) {
    console.log(`\n🏢 Entreprises trouvées dans le filtre:`);
    Array.from(companiesFound).forEach(company => {
      const count = odKeys.filter(t => t.company === company).length;
      console.log(`   - "${company}": ${count} ticket(s)`);
    });
  }
  
  return odKeys;
}

async function main() {
  try {
    const csvContent = await downloadSheet();
    const tickets = await analyzeFilteredTickets(csvContent);
    
    console.log(`\n✅ Analyse terminée`);
    console.log(`\n📊 Résumé:`);
    console.log(`   - Total de tickets à traiter: ${tickets.length}`);
    
    if (tickets.length > 0 && tickets[0].company) {
      console.log(`   - Entreprise principale: "${tickets[0].company}"`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

