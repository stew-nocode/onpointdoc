#!/usr/bin/env node

/**
 * Script pour vérifier dans Supabase si les tickets sans module dans le Google Sheet
 * ont un module renseigné ou vide dans Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (error) {
  console.error('⚠️  Impossible de charger .env.local:', error.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

async function getTicketsWithoutModuleFromSheet() {
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  const csvContent = await response.text();
  
  // Parser en mode brut
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  // Trouver les indices des colonnes
  const headers = rawRecords[0];
  const odIndex = headers.indexOf('OD');
  const moduleIndex = headers.indexOf('Champs personnalisés (Module)');
  
  if (odIndex === -1 || moduleIndex === -1) {
    throw new Error('Colonnes OD ou Module introuvables');
  }
  
  // Extraire les tickets sans module
  const ticketsWithoutModule = [];
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.length <= Math.max(odIndex, moduleIndex)) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    const moduleName = row[moduleIndex]?.trim();
    
    if (odKey && (!moduleName || moduleName.length === 0)) {
      const normalizedOD = odKey.toUpperCase().startsWith('OD-')
        ? odKey.toUpperCase()
        : `OD-${odKey.toUpperCase().replace(/^OD-?/, '')}`;
      ticketsWithoutModule.push(normalizedOD);
    }
  }
  
  return ticketsWithoutModule;
}

async function checkModulesInSupabase(odKeys) {
  console.log(`\n📦 Vérification de ${odKeys.length} tickets dans Supabase...\n`);
  
  const stats = {
    total: odKeys.length,
    found: 0,
    notFound: 0,
    withModule: 0,
    withoutModule: 0,
  };
  
  const results = {
    withModule: [],
    withoutModule: [],
    notFound: [],
  };
  
  // Traiter par lots de 50 pour éviter la surcharge
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(odKeys.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, odKeys.length);
    const batch = odKeys.slice(batchStart, batchEnd);
    
    // Récupérer tous les tickets du lot en une seule requête
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        jira_issue_key,
        module_id,
        modules (
          id,
          name
        )
      `)
      .in('jira_issue_key', batch);
    
    if (error) {
      console.error(`❌ Erreur lors de la récupération du lot ${batchIndex + 1}:`, error.message);
      continue;
    }
    
    // Créer un map pour lookup rapide
    const ticketMap = new Map();
    tickets.forEach(t => {
      ticketMap.set(t.jira_issue_key, {
        id: t.id,
        moduleId: t.module_id,
        moduleName: t.modules?.name || null,
      });
    });
    
    // Comparer avec le lot
    for (const odKey of batch) {
      const ticket = ticketMap.get(odKey);
      
      if (!ticket) {
        results.notFound.push(odKey);
        stats.notFound++;
      } else {
        stats.found++;
        if (ticket.moduleName) {
          results.withModule.push({
            od: odKey,
            module: ticket.moduleName,
          });
          stats.withModule++;
        } else {
          results.withoutModule.push(odKey);
          stats.withoutModule++;
        }
      }
    }
    
    // Afficher la progression
    const processed = batchEnd;
    const percentage = ((processed / odKeys.length) * 100).toFixed(1);
    if (batchIndex % 5 === 0 || batchIndex === totalBatches - 1) {
      console.log(`   ✓ Progression: ${processed}/${odKeys.length} (${percentage}%)`);
    }
  }
  
  return { stats, results };
}

async function main() {
  console.log('🔍 VÉRIFICATION DES MODULES DANS SUPABASE');
  console.log('   pour les tickets sans module dans le Google Sheet\n');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 1. Récupérer les tickets sans module depuis le Google Sheet
    console.log('📋 Extraction des tickets sans module depuis le Google Sheet...');
    const ticketsWithoutModuleInSheet = await getTicketsWithoutModuleFromSheet();
    console.log(`✅ ${ticketsWithoutModuleInSheet.length} tickets sans module trouvés dans le Google Sheet\n`);
    
    // 2. Vérifier dans Supabase
    const { stats, results } = await checkModulesInSupabase(ticketsWithoutModuleInSheet);
    
    // 3. Afficher les résultats
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS');
    console.log('='.repeat(60));
    console.log(`Total de tickets analysés: ${stats.total}`);
    console.log(`✅ Tickets trouvés dans Supabase: ${stats.found}`);
    console.log(`❌ Tickets non trouvés dans Supabase: ${stats.notFound}`);
    console.log(`\n📦 Dans Supabase:`);
    console.log(`   - Avec module renseigné: ${stats.withModule} (${((stats.withModule / stats.found) * 100).toFixed(1)}%)`);
    console.log(`   - Sans module: ${stats.withoutModule} (${((stats.withoutModule / stats.found) * 100).toFixed(1)}%)`);
    
    // Afficher les tickets avec module dans Supabase
    if (results.withModule.length > 0) {
      console.log(`\n✅ TICKETS AVEC MODULE DANS SUPABASE (${results.withModule.length}):\n`);
      console.log('   Ces tickets ont un module dans Supabase mais pas dans le Google Sheet.\n');
      results.withModule.slice(0, 20).forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.od} → "${item.module}"`);
      });
      if (results.withModule.length > 20) {
        console.log(`   ... et ${results.withModule.length - 20} autres`);
      }
      
      // Sauvegarder dans un CSV
      const csvLines = ['OD_KEY,MODULE_SUPABASE'];
      results.withModule.forEach(item => {
        csvLines.push(`${item.od},${item.module}`);
      });
      
      fs.writeFileSync(
        'docs/ticket/tickets-sans-module-sheet-mais-avec-module-supabase.csv',
        csvLines.join('\n'),
        'utf8'
      );
      console.log(`\n💾 Liste sauvegardée dans: docs/ticket/tickets-sans-module-sheet-mais-avec-module-supabase.csv`);
    }
    
    // Afficher les tickets sans module dans Supabase
    if (results.withoutModule.length > 0) {
      console.log(`\n❌ TICKETS SANS MODULE (${results.withoutModule.length}):\n`);
      console.log('   Ces tickets n\'ont pas de module ni dans le Google Sheet ni dans Supabase.\n');
      results.withoutModule.slice(0, 20).forEach((od, idx) => {
        console.log(`   ${idx + 1}. ${od}`);
      });
      if (results.withoutModule.length > 20) {
        console.log(`   ... et ${results.withoutModule.length - 20} autres`);
      }
      
      // Sauvegarder dans un CSV
      const csvLines = ['OD_KEY'];
      results.withoutModule.forEach(od => {
        csvLines.push(od);
      });
      
      fs.writeFileSync(
        'docs/ticket/tickets-sans-module-sheet-et-supabase.csv',
        csvLines.join('\n'),
        'utf8'
      );
      console.log(`\n💾 Liste sauvegardée dans: docs/ticket/tickets-sans-module-sheet-et-supabase.csv`);
    }
    
    // Afficher les tickets non trouvés
    if (results.notFound.length > 0) {
      console.log(`\n⚠️  TICKETS NON TROUVÉS DANS SUPABASE (${results.notFound.length}):\n`);
      results.notFound.slice(0, 20).forEach((od, idx) => {
        console.log(`   ${idx + 1}. ${od}`);
      });
      if (results.notFound.length > 20) {
        console.log(`   ... et ${results.notFound.length - 20} autres`);
      }
    }
    
    console.log('\n✅ Analyse terminée');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

