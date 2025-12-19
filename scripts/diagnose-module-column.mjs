#!/usr/bin/env node

/**
 * Script de diagnostic approfondi pour vérifier la colonne Module
 */

import { parse } from 'csv-parse/sync';

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

async function main() {
  console.log('📥 Téléchargement du Google Sheet...\n');
  const response = await fetch(SHEET_URL);
  const csvContent = await response.text();
  
  console.log('📊 Parsing du CSV...\n');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  console.log(`✅ ${records.length} lignes totales dans le CSV\n`);
  
  // Trouver toutes les colonnes
  const firstRecord = records[0];
  const allColumns = Object.keys(firstRecord);
  
  console.log(`📋 Total de colonnes: ${allColumns.length}\n`);
  
  // Chercher toutes les colonnes contenant "module" (insensible à la casse)
  const moduleColumns = allColumns.filter(col => 
    col && col.toLowerCase().includes('module')
  );
  
  console.log(`🔍 Colonnes contenant "module": ${moduleColumns.length}`);
  moduleColumns.forEach(col => {
    console.log(`   - "${col}"`);
  });
  console.log('');
  
  // Trouver la colonne OD
  const odColumns = allColumns.filter(col => 
    col && (col === 'OD' || col.toUpperCase() === 'OD' || 
            (col.toLowerCase().includes('od') && !col.toLowerCase().includes('obcs')))
  );
  
  console.log(`🔍 Colonnes OD: ${odColumns.length}`);
  odColumns.forEach(col => {
    console.log(`   - "${col}"`);
  });
  console.log('');
  
  // Analyser la colonne "Champs personnalisés (Module)" spécifiquement
  const targetModuleColumn = 'Champs personnalisés (Module)';
  const odColumn = 'OD';
  
  if (!allColumns.includes(targetModuleColumn)) {
    console.log(`❌ Colonne "${targetModuleColumn}" non trouvée!\n`);
    console.log('🔍 Recherche de colonnes similaires...\n');
    allColumns.forEach((col, idx) => {
      if (col && (col.toLowerCase().includes('module') || col.toLowerCase().includes('personnalis'))) {
        console.log(`   Colonne ${idx}: "${col}"`);
      }
    });
    return;
  }
  
  console.log(`✅ Colonnes trouvées:`);
  console.log(`   - OD: "${odColumn}"`);
  console.log(`   - Module: "${targetModuleColumn}"\n`);
  
  // Analyser chaque ligne avec détails
  console.log('📊 Analyse détaillée des 50 premières lignes:\n');
  
  let stats = {
    total: 0,
    withOD: 0,
    withModule: 0,
    withBoth: 0,
    moduleValues: new Set(),
    sampleODWithModule: [],
  };
  
  for (let i = 0; i < Math.min(50, records.length); i++) {
    const record = records[i];
    const odKey = record[odColumn]?.trim();
    const moduleValue = record[targetModuleColumn];
    
    stats.total++;
    
    if (odKey) {
      stats.withOD++;
      
      // Vérifier différentes façons dont le module peut être stocké
      let moduleStr = null;
      
      if (moduleValue) {
        if (typeof moduleValue === 'string') {
          moduleStr = moduleValue.trim();
        } else if (Array.isArray(moduleValue)) {
          moduleStr = moduleValue.join(', ').trim();
        } else {
          moduleStr = String(moduleValue).trim();
        }
      }
      
      if (moduleStr && moduleStr.length > 0 && moduleStr !== 'null' && moduleStr !== 'undefined') {
        stats.withModule++;
        stats.withBoth++;
        stats.moduleValues.add(moduleStr);
        
        if (stats.sampleODWithModule.length < 10) {
          stats.sampleODWithModule.push({
            od: odKey,
            module: moduleStr,
          });
        }
      }
      
      // Afficher les 10 premières lignes avec OD
      if (i < 10) {
        console.log(`Ligne ${i + 1}:`);
        console.log(`   OD: "${odKey || '(vide)'}"`);
        console.log(`   Module (raw):`, JSON.stringify(moduleValue));
        console.log(`   Module (string): "${moduleStr || '(vide)'}"`);
        console.log('');
      }
    }
  }
  
  // Analyser TOUTES les lignes pour statistiques complètes
  console.log('📊 Analyse complète de TOUTES les lignes...\n');
  
  const allStats = {
    total: 0,
    withOD: 0,
    withModule: 0,
    withBoth: 0,
    moduleValues: new Set(),
  };
  
  for (const record of records) {
    const odKey = record[odColumn]?.trim();
    const moduleValue = record[targetModuleColumn];
    
    allStats.total++;
    
    if (odKey) {
      allStats.withOD++;
      
      let moduleStr = null;
      if (moduleValue) {
        if (typeof moduleValue === 'string') {
          moduleStr = moduleValue.trim();
        } else if (Array.isArray(moduleValue)) {
          moduleStr = moduleValue.join(', ').trim();
        } else {
          moduleStr = String(moduleValue).trim();
        }
      }
      
      if (moduleStr && moduleStr.length > 0 && moduleStr !== 'null' && moduleStr !== 'undefined') {
        allStats.withModule++;
        allStats.withBoth++;
        allStats.moduleValues.add(moduleStr);
      }
    }
  }
  
  // Résultats
  console.log('='.repeat(60));
  console.log('📊 RÉSULTATS COMPLETS');
  console.log('='.repeat(60));
  console.log(`Total de lignes: ${allStats.total}`);
  console.log(`Lignes avec OD: ${allStats.withOD}`);
  console.log(`Lignes avec Module: ${allStats.withModule}`);
  console.log(`Lignes avec OD ET Module: ${allStats.withBoth}`);
  console.log(`Valeurs de module uniques: ${allStats.moduleValues.size}`);
  
  if (allStats.moduleValues.size > 0) {
    console.log('\n📦 Toutes les valeurs de module trouvées:');
    Array.from(allStats.moduleValues).sort().forEach((val, idx) => {
      console.log(`   ${idx + 1}. "${val}"`);
    });
    
    console.log('\n📋 Exemples de tickets avec module:');
    let count = 0;
    for (const record of records) {
      if (count >= 10) break;
      const odKey = record[odColumn]?.trim();
      const moduleValue = record[targetModuleColumn];
      
      let moduleStr = null;
      if (moduleValue) {
        if (typeof moduleValue === 'string') {
          moduleStr = moduleValue.trim();
        } else if (Array.isArray(moduleValue)) {
          moduleStr = moduleValue.join(', ').trim();
        } else {
          moduleStr = String(moduleValue).trim();
        }
      }
      
      if (odKey && moduleStr && moduleStr.length > 0 && moduleStr !== 'null' && moduleStr !== 'undefined') {
        console.log(`   - ${odKey} → "${moduleStr}"`);
        count++;
      }
    }
  } else {
    console.log('\n❌ AUCUNE valeur de module trouvée dans la colonne!');
    console.log('\n🔍 Vérification des 20 premières valeurs brutes...');
    for (let i = 0; i < Math.min(20, records.length); i++) {
      const record = records[i];
      const moduleValue = record[targetModuleColumn];
      console.log(`   Ligne ${i + 1}:`, JSON.stringify(moduleValue), `(type: ${typeof moduleValue})`);
    }
  }
}

main().catch(console.error);

