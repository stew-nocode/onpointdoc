#!/usr/bin/env node

/**
 * Script de diagnostic pour analyser la colonne "Champs personnalisés (Client(s))"
 * et identifier comment déterminer qu'un ticket concerne toutes les entreprises
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

const CLIENTS_COLUMN = 'Champs personnalisés (Client(s))';
const OD_COLUMN = 'OD';

async function downloadSheet() {
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  // Forcer UTF-8 pour éviter les problèmes d'encodage
  const arrayBuffer = await response.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  return textDecoder.decode(arrayBuffer);
}

async function analyzeClientsColumn(csvContent) {
  console.log('📊 Analyse du CSV...');
  
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  if (rawRecords.length === 0) {
    throw new Error('Aucune donnée dans le CSV');
  }
  
  console.log(`✅ ${rawRecords.length} lignes trouvées\n`);
  
  // Trouver les colonnes
  const headers = rawRecords[0];
  const odIndex = headers.indexOf(OD_COLUMN);
  const clientsIndex = headers.indexOf(CLIENTS_COLUMN);
  
  console.log('📋 Headers trouvés:');
  headers.forEach((h, i) => {
    if (h && (h.includes('Client') || h.includes('OD'))) {
      console.log(`   [${i}] ${h}`);
    }
  });
  
  if (odIndex === -1) {
    throw new Error('Colonne OD introuvable');
  }
  
  if (clientsIndex === -1) {
    throw new Error(`Colonne "${CLIENTS_COLUMN}" introuvable`);
  }
  
  console.log(`\n✅ Colonnes identifiées:`);
  console.log(`   - OD: index ${odIndex}`);
  console.log(`   - Clients: index ${clientsIndex}\n`);
  
  // Analyser les valeurs dans la colonne Clients
  const clientsValues = new Map();
  const ticketsWithClients = [];
  let emptyClients = 0;
  let emptyOD = 0;
  let totalProcessed = 0;
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    totalProcessed++;
    
    if (!row || row.length <= Math.max(odIndex, clientsIndex)) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    const clientsValue = row[clientsIndex]?.trim();
    
    if (!odKey) {
      emptyOD++;
      continue;
    }
    
    if (!clientsValue) {
      emptyClients++;
      continue;
    }
    
    // Compter les occurrences de chaque valeur
    const normalizedClients = clientsValue.toUpperCase();
    const count = clientsValues.get(normalizedClients) || 0;
    clientsValues.set(normalizedClients, count + 1);
    
    ticketsWithClients.push({
      od: odKey,
      clients: clientsValue,
      normalized: normalizedClients
    });
  }
  
  console.log('📊 Statistiques:');
  console.log(`   - Total de lignes traitées: ${totalProcessed}`);
  console.log(`   - Tickets avec OD vide: ${emptyOD}`);
  console.log(`   - Tickets avec Clients vide: ${emptyClients}`);
  console.log(`   - Tickets avec Clients renseigné: ${ticketsWithClients.length}\n`);
  
  // Afficher les valeurs uniques trouvées (triées par fréquence)
  console.log('🔍 Valeurs uniques dans la colonne "Clients" (par fréquence):');
  const sortedValues = Array.from(clientsValues.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // Top 20
  
  for (const [value, count] of sortedValues) {
    console.log(`   - "${value}": ${count} ticket(s)`);
  }
  
  // Chercher les valeurs qui pourraient indiquer "toutes les entreprises"
  console.log('\n🔍 Recherche de valeurs indiquant "toutes les entreprises":');
  const allCompaniesIndicators = [
    'ALL',
    'TOUTES',
    'TOTAL',
    'TOUS',
    'TOTALEMENT',
    'GLOBAL',
    'GENERAL',
    'GENERALE'
  ];
  
  const potentialAllCompanies = [];
  for (const [value, count] of clientsValues.entries()) {
    const upperValue = value.toUpperCase();
    if (allCompaniesIndicators.some(indicator => upperValue.includes(indicator))) {
      potentialAllCompanies.push({ value, count });
      console.log(`   ⚠️  Potentiel "toutes": "${value}" (${count} ticket(s))`);
    }
  }
  
  if (potentialAllCompanies.length === 0) {
    console.log('   ❌ Aucune valeur évidente trouvée. Afficher des exemples...');
    
    // Afficher quelques exemples
    console.log('\n📋 Exemples de valeurs trouvées:');
    const examples = Array.from(clientsValues.entries()).slice(0, 10);
    for (const [value, count] of examples) {
      const exampleTicket = ticketsWithClients.find(t => t.normalized === value);
      console.log(`   - "${value}" (${count} ticket(s)) - Exemple: ${exampleTicket?.od}`);
    }
  }
  
  // Générer un fichier de sortie pour analyse
  const outputPath = path.join(__dirname, '..', 'docs', 'ticket', 'analyse-clients-tickets.csv');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const csvLines = [
    'OD,Client(s),Normalized'
  ];
  
  ticketsWithClients.forEach(t => {
    csvLines.push(`"${t.od}","${t.clients.replace(/"/g, '""')}","${t.normalized}"`);
  });
  
  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n✅ Fichier de sortie créé: ${outputPath}`);
  
  return {
    clientsValues,
    ticketsWithClients,
    potentialAllCompanies
  };
}

async function main() {
  try {
    const csvContent = await downloadSheet();
    await analyzeClientsColumn(csvContent);
    console.log('\n✅ Diagnostic terminé');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

