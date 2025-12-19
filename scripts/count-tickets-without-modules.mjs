#!/usr/bin/env node

/**
 * Script pour compter les tickets sans module renseigné dans le Google Sheet
 */

import { parse } from 'csv-parse/sync';

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

async function main() {
  console.log('📥 Téléchargement du Google Sheet...\n');
  const response = await fetch(SHEET_URL);
  const csvContent = await response.text();
  
  console.log('📊 Analyse du CSV...\n');
  
  // Parser en mode brut
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  console.log(`✅ ${rawRecords.length} lignes totales dans le CSV\n`);
  
  // Trouver les indices des colonnes
  const headers = rawRecords[0];
  const odIndex = headers.indexOf('OD');
  const moduleIndex = headers.indexOf('Champs personnalisés (Module)');
  
  if (odIndex === -1 || moduleIndex === -1) {
    throw new Error('Colonnes OD ou Module introuvables');
  }
  
  console.log(`📋 Colonnes identifiées:`);
  console.log(`   - OD: index ${odIndex}`);
  console.log(`   - Module: index ${moduleIndex}\n`);
  
  // Analyser toutes les lignes
  let stats = {
    total: 0,
    withOD: 0,
    withModule: 0,
    withODAndModule: 0,
    withODButNoModule: 0,
    ticketsWithoutModule: [],
  };
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    stats.total++;
    
    if (!row || row.length <= Math.max(odIndex, moduleIndex)) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    const moduleName = row[moduleIndex]?.trim();
    
    if (odKey) {
      stats.withOD++;
      
      if (moduleName && moduleName.length > 0) {
        stats.withModule++;
        stats.withODAndModule++;
      } else {
        // Ticket avec OD mais sans module
        stats.withODButNoModule++;
        const normalizedOD = odKey.toUpperCase().startsWith('OD-')
          ? odKey.toUpperCase()
          : `OD-${odKey.toUpperCase().replace(/^OD-?/, '')}`;
        stats.ticketsWithoutModule.push(normalizedOD);
      }
    }
  }
  
  // Afficher les résultats
  console.log('='.repeat(60));
  console.log('📊 STATISTIQUES DU GOOGLE SHEET');
  console.log('='.repeat(60));
  console.log(`Total de lignes: ${stats.total}`);
  console.log(`Tickets avec OD: ${stats.withOD}`);
  console.log(`Tickets avec Module: ${stats.withModule}`);
  console.log(`Tickets avec OD ET Module: ${stats.withODAndModule}`);
  console.log(`\n❌ Tickets avec OD mais SANS Module: ${stats.withODButNoModule}`);
  
  const percentageWithModule = stats.withOD > 0 
    ? ((stats.withODAndModule / stats.withOD) * 100).toFixed(1)
    : 0;
  const percentageWithoutModule = stats.withOD > 0
    ? ((stats.withODButNoModule / stats.withOD) * 100).toFixed(1)
    : 0;
  
  console.log(`\n📈 Pourcentages:`);
  console.log(`   - Tickets avec module: ${percentageWithModule}%`);
  console.log(`   - Tickets sans module: ${percentageWithoutModule}%`);
  
  // Afficher les premiers tickets sans module
  if (stats.ticketsWithoutModule.length > 0) {
    console.log(`\n📋 Premiers 20 tickets sans module:`);
    stats.ticketsWithoutModule.slice(0, 20).forEach((od, idx) => {
      console.log(`   ${idx + 1}. ${od}`);
    });
    
    if (stats.ticketsWithoutModule.length > 20) {
      console.log(`   ... et ${stats.ticketsWithoutModule.length - 20} autres`);
    }
    
    // Sauvegarder dans un fichier CSV
    const fs = await import('fs');
    const csvLines = ['OD_KEY'];
    stats.ticketsWithoutModule.forEach(od => {
      csvLines.push(od);
    });
    
    fs.writeFileSync(
      'docs/ticket/tickets-od-sans-module-dans-sheet.csv',
      csvLines.join('\n'),
      'utf8'
    );
    
    console.log(`\n💾 Liste sauvegardée dans: docs/ticket/tickets-od-sans-module-dans-sheet.csv`);
  }
  
  console.log('\n✅ Analyse terminée');
}

main().catch(console.error);

