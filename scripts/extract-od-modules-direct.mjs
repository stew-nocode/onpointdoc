#!/usr/bin/env node

/**
 * Script pour extraire directement OD → Module depuis le CSV
 * en utilisant les indices de colonnes pour éviter les problèmes de parsing
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

async function main() {
  console.log('📥 Téléchargement du Google Sheet...\n');
  const response = await fetch(SHEET_URL);
  const csvContent = await response.text();
  
  console.log('📊 Parsing du CSV...\n');
  
  // Parser avec toutes les options nécessaires pour gérer les retours à la ligne
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  });
  
  console.log(`✅ ${records.length} lignes parsées\n`);
  
  // Trouver les indices des colonnes
  const firstRecord = records[0];
  const allColumns = Object.keys(firstRecord);
  
  const odIndex = allColumns.indexOf('OD');
  const moduleIndex = allColumns.indexOf('Champs personnalisés (Module)');
  
  console.log(`📋 Indices des colonnes:`);
  console.log(`   - OD: index ${odIndex}`);
  console.log(`   - Module: index ${moduleIndex}\n`);
  
  if (odIndex === -1 || moduleIndex === -1) {
    console.error('❌ Colonnes non trouvées!');
    return;
  }
  
  // Parser à nouveau en mode brut pour avoir accès aux valeurs brutes
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  console.log(`📊 Extraction des correspondances OD → Module...\n`);
  
  const mappings = [];
  const seen = new Set();
  
  // Commencer à la ligne 1 (ligne 0 = headers)
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.length <= Math.max(odIndex, moduleIndex)) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    const moduleName = row[moduleIndex]?.trim();
    
    if (!odKey) continue;
    
    // Normaliser OD
    const normalizedOD = odKey.toUpperCase().startsWith('OD-')
      ? odKey.toUpperCase()
      : `OD-${odKey.toUpperCase().replace(/^OD-?/, '')}`;
    
    // Ignorer si module vide
    if (!moduleName || moduleName.length === 0) {
      continue;
    }
    
    // Éviter les doublons
    if (seen.has(normalizedOD)) {
      continue;
    }
    
    seen.add(normalizedOD);
    mappings.push({
      od: normalizedOD,
      module: moduleName,
    });
  }
  
  console.log(`✅ ${mappings.length} correspondances trouvées\n`);
  
  console.log('📋 Premiers 20 tickets avec module:');
  mappings.slice(0, 20).forEach((m, idx) => {
    console.log(`   ${idx + 1}. ${m.od} → "${m.module}"`);
  });
  
  if (mappings.length > 20) {
    console.log(`   ... et ${mappings.length - 20} autres`);
  }
  
  // Statistiques par module
  const moduleStats = {};
  mappings.forEach(m => {
    moduleStats[m.module] = (moduleStats[m.module] || 0) + 1;
  });
  
  console.log('\n📊 Statistiques par module:');
  Object.entries(moduleStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([module, count]) => {
      console.log(`   - ${module}: ${count} ticket(s)`);
    });
  
  // Sauvegarder
  fs.writeFileSync(
    'docs/ticket/od-module-mappings.json',
    JSON.stringify(mappings, null, 2)
  );
  
  console.log(`\n💾 Résultats sauvegardés dans docs/ticket/od-module-mappings.json`);
}

main().catch(console.error);

