#!/usr/bin/env node

/**
 * Script de diagnostic amélioré - vérification approfondie du parsing CSV
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
  
  // Sauvegarder le CSV brut pour inspection
  fs.writeFileSync('docs/ticket/sheet-export-raw.csv', csvContent);
  console.log('💾 CSV brut sauvegardé dans docs/ticket/sheet-export-raw.csv\n');
  
  console.log('📊 Premières lignes du CSV brut:\n');
  const firstLines = csvContent.split('\n').slice(0, 5);
  firstLines.forEach((line, idx) => {
    console.log(`Ligne ${idx + 1}: ${line.substring(0, 200)}...`);
  });
  console.log('');
  
  // Parser avec différentes options
  console.log('📊 Parsing du CSV avec différentes méthodes...\n');
  
  // Méthode 1 : Avec headers
  const records1 = parse(csvContent, {
    columns: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
    bom: true, // Gérer le BOM UTF-8
  });
  
  console.log(`✅ Méthode 1 (columns: true): ${records1.length} lignes`);
  
  // Trouver les colonnes OD et Module
  const firstRecord = records1[0];
  const allColumns = Object.keys(firstRecord);
  
  console.log(`\n📋 Total de colonnes: ${allColumns.length}`);
  console.log(`📋 Premières 10 colonnes:`);
  allColumns.slice(0, 10).forEach((col, idx) => {
    console.log(`   ${idx + 1}. "${col}"`);
  });
  
  // Chercher spécifiquement les colonnes
  const odCol = allColumns.find(c => c === 'OD' || c.trim() === 'OD');
  const moduleCol = allColumns.find(c => c === 'Champs personnalisés (Module)');
  
  console.log(`\n🔍 Colonnes trouvées:`);
  console.log(`   - OD: "${odCol}" (index: ${allColumns.indexOf(odCol)})`);
  console.log(`   - Module: "${moduleCol}" (index: ${allColumns.indexOf(moduleCol)})`);
  
  if (!odCol || !moduleCol) {
    console.log('\n❌ Colonnes OD ou Module non trouvées!');
    console.log('\n🔍 Toutes les colonnes contenant "OD" ou "Module":');
    allColumns.forEach((col, idx) => {
      if (col && (col.includes('OD') || col.includes('Module'))) {
        console.log(`   [${idx}] "${col}"`);
      }
    });
    return;
  }
  
  // Analyser TOUTES les lignes
  console.log('\n📊 Analyse complète de TOUTES les lignes...\n');
  
  const results = [];
  let countWithModule = 0;
  const moduleValues = new Set();
  
  for (let i = 0; i < records1.length; i++) {
    const record = records1[i];
    const odKey = record[odCol];
    const moduleValue = record[moduleCol];
    
    if (!odKey) continue;
    
    // Nettoyer et vérifier le module
    let moduleStr = null;
    if (moduleValue !== undefined && moduleValue !== null) {
      if (typeof moduleValue === 'string') {
        moduleStr = moduleValue.trim();
      } else {
        moduleStr = String(moduleValue).trim();
      }
      
      // Ignorer les chaînes vides
      if (moduleStr.length === 0) {
        moduleStr = null;
      }
    }
    
    if (moduleStr) {
      countWithModule++;
      moduleValues.add(moduleStr);
      
      // Normaliser OD
      const normalizedOD = odKey.toString().trim().toUpperCase().startsWith('OD-')
        ? odKey.toString().trim().toUpperCase()
        : `OD-${odKey.toString().trim().toUpperCase().replace(/^OD-?/, '')}`;
      
      results.push({
        od: normalizedOD,
        module: moduleStr,
      });
    }
  }
  
  console.log('='.repeat(60));
  console.log('📊 RÉSULTATS COMPLETS');
  console.log('='.repeat(60));
  console.log(`Total de lignes: ${records1.length}`);
  console.log(`Tickets avec module: ${countWithModule}`);
  console.log(`Valeurs de module uniques: ${moduleValues.size}`);
  
  if (moduleValues.size > 0) {
    console.log('\n📦 Valeurs de module trouvées:');
    Array.from(moduleValues).sort().forEach((val, idx) => {
      console.log(`   ${idx + 1}. "${val}"`);
    });
    
    console.log(`\n📋 Premiers 20 tickets avec module:`);
    results.slice(0, 20).forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.od} → "${r.module}"`);
    });
    
    if (results.length > 20) {
      console.log(`   ... et ${results.length - 20} autres`);
    }
    
    // Sauvegarder les résultats
    fs.writeFileSync(
      'docs/ticket/od-module-mappings.json',
      JSON.stringify(results, null, 2)
    );
    console.log(`\n💾 Résultats sauvegardés dans docs/ticket/od-module-mappings.json`);
  } else {
    console.log('\n❌ AUCUNE valeur de module trouvée!');
    
    // Vérifier les 20 premières lignes avec détails
    console.log('\n🔍 Vérification détaillée des 20 premières lignes:');
    for (let i = 0; i < Math.min(20, records1.length); i++) {
      const record = records1[i];
      const odKey = record[odCol];
      const moduleValue = record[moduleCol];
      
      console.log(`\nLigne ${i + 1}:`);
      console.log(`   OD (col "${odCol}"):`, JSON.stringify(odKey));
      console.log(`   Module (col "${moduleCol}"):`, JSON.stringify(moduleValue));
      console.log(`   Type module: ${typeof moduleValue}`);
      
      if (moduleValue) {
        console.log(`   Module.length: ${String(moduleValue).length}`);
        console.log(`   Module.trim():`, JSON.stringify(String(moduleValue).trim()));
      }
    }
  }
}

main().catch(console.error);

