#!/usr/bin/env node

/**
 * Script pour générer un CSV avec les tickets OD non trouvés dans Supabase
 * et leurs modules correspondants depuis le Google Sheet
 */

import fs from 'fs';
import path from 'path';

const missingTickets = [
  'OD-3026',
  'OD-3025',
  'OD-3024',
  'OD-3023',
  'OD-3022',
  'OD-3021',
  'OD-3020',
  'OD-3019',
  'OD-3010',
  'OD-3009',
  'OD-3008',
  'OD-3007',
  'OD-3006',
  'OD-3005',
  'OD-3004',
];

async function main() {
  console.log('📋 Génération du CSV avec les tickets non trouvés et leurs modules...\n');
  
  // Charger les mappings OD → Module
  const mappingsPath = path.join(process.cwd(), 'docs/ticket/od-module-mappings.json');
  
  if (!fs.existsSync(mappingsPath)) {
    console.error('❌ Fichier od-module-mappings.json introuvable');
    process.exit(1);
  }
  
  const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  const mappingMap = new Map();
  
  mappings.forEach(m => {
    mappingMap.set(m.od, m.module);
  });
  
  // Créer le CSV avec titre clair
  const csvLines = ['OD_KEY,MODULE'];
  
  missingTickets.forEach(odKey => {
    const module = mappingMap.get(odKey) || '(non trouvé)';
    csvLines.push(`${odKey},${module}`);
  });
  
  const csvContent = csvLines.join('\n');
  const outputPath = path.join(process.cwd(), 'docs/ticket/tickets-od-non-trouves-supabase.csv');
  
  fs.writeFileSync(outputPath, csvContent, 'utf8');
  
  console.log(`✅ Fichier créé: ${outputPath}`);
  console.log(`\n📊 Contenu:`);
  console.log(`   - Total de tickets: ${missingTickets.length}`);
  
  // Statistiques par module
  const moduleStats = {};
  missingTickets.forEach(od => {
    const module = mappingMap.get(od) || 'N/A';
    moduleStats[module] = (moduleStats[module] || 0) + 1;
  });
  
  console.log(`\n📦 Répartition par module:`);
  Object.entries(moduleStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([module, count]) => {
      console.log(`   - ${module}: ${count} ticket(s)`);
    });
  
  console.log(`\n💡 Note: Ces tickets seront mis à jour lors de la prochaine synchronisation depuis Jira.`);
}

main().catch(console.error);

