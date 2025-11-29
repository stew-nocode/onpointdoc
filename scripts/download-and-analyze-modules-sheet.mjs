#!/usr/bin/env node

/**
 * Script pour télécharger et analyser le Google Sheet
 * pour identifier la colonne "Champs personnalisés (Module)"
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

async function downloadAndAnalyze() {
  console.log('📥 Téléchargement du Google Sheet...');
  
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  const csvContent = await response.text();
  
  console.log('📊 Analyse des colonnes...');
  
  // Parser le CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  if (records.length === 0) {
    throw new Error('Aucune donnée trouvée dans le CSV');
  }
  
  // Afficher toutes les colonnes pour identifier celle du module
  const headers = Object.keys(records[0]);
  console.log(`\n✅ ${headers.length} colonnes trouvées\n`);
  
  // Chercher la colonne contenant "module" (insensible à la casse)
  const moduleColumns = headers.filter(h => 
    h && h.toLowerCase().includes('module') || 
    h && h.toLowerCase().includes('champ')
  );
  
  console.log('🔍 Colonnes potentiellement liées au module:');
  moduleColumns.forEach(col => {
    console.log(`   - ${col}`);
  });
  
  // Afficher quelques exemples de valeurs pour identifier la bonne colonne
  if (moduleColumns.length > 0) {
    console.log('\n📋 Exemples de valeurs pour les colonnes module:');
    for (const col of moduleColumns) {
      const samples = records
        .slice(0, 10)
        .map(r => r[col])
        .filter(v => v && v.trim())
        .slice(0, 5);
      if (samples.length > 0) {
        console.log(`\n   ${col}:`);
        samples.forEach(val => console.log(`     - ${val.substring(0, 80)}`));
      }
    }
  }
  
  // Chercher aussi la colonne OD (clé de ticket)
  const odColumns = headers.filter(h => 
    h && (h.toLowerCase().includes('od-') || 
         h.toLowerCase().includes('clé') ||
         h.toLowerCase().includes('key') ||
         h.toLowerCase().includes('ticket'))
  );
  
  console.log('\n🔍 Colonnes potentiellement liées à la clé OD:');
  odColumns.forEach(col => {
    console.log(`   - ${col}`);
  });
  
  // Sauvegarder les headers pour inspection
  const headersFile = path.join(process.cwd(), 'docs/ticket/modules-sheet-headers.json');
  fs.writeFileSync(headersFile, JSON.stringify(headers, null, 2));
  console.log(`\n💾 Headers sauvegardés dans: ${headersFile}`);
  
  console.log('\n✅ Analyse terminée');
}

downloadAndAnalyze().catch(console.error);

