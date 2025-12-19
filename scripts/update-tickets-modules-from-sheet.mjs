#!/usr/bin/env node

/**
 * Script pour mettre à jour le champ module des tickets OD depuis le Google Sheet
 * Utilise la colonne "Champs personnalisés (Module)" du Google Sheet
 * Ignore les champs vides
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
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

const MODULE_COLUMN = 'Champs personnalisés (Module)';
const OD_COLUMN = 'OD';

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
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  return await response.text();
}

async function extractModuleMappings(csvContent) {
  console.log('📊 Analyse du CSV...');
  
  // Parser en mode brut pour avoir accès aux valeurs brutes par index
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
  
  // La première ligne contient les headers
  const headers = rawRecords[0];
  const odIndex = headers.indexOf('OD');
  const moduleIndex = headers.indexOf('Champs personnalisés (Module)');
  
  if (odIndex === -1) {
    throw new Error('Colonne OD introuvable dans les headers');
  }
  
  if (moduleIndex === -1) {
    throw new Error('Colonne "Champs personnalisés (Module)" introuvable dans les headers');
  }
  
  console.log(`\n📋 Colonnes identifiées:`);
  console.log(`   - OD: index ${odIndex}`);
  console.log(`   - Module: index ${moduleIndex}`);
  
  // Extraire les mappings OD → Module (ignorer les vides)
  const mappings = [];
  const seen = new Set();
  let emptyOD = 0;
  let emptyModule = 0;
  let totalProcessed = 0;
  
  // Commencer à la ligne 1 (ligne 0 = headers)
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    totalProcessed++;
    
    if (!row || row.length <= Math.max(odIndex, moduleIndex)) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    const moduleName = row[moduleIndex]?.trim();
    
    // Compter les vides pour statistiques
    if (!odKey) {
      emptyOD++;
      continue;
    }
    
    if (!moduleName || moduleName.length === 0) {
      emptyModule++;
      continue;
    }
    
    // Normaliser la clé OD (OD-XXXX)
    const normalizedOD = odKey.toUpperCase().startsWith('OD-') 
      ? odKey.toUpperCase() 
      : `OD-${odKey.toUpperCase().replace(/^OD-?/, '')}`;
    
    // Éviter les doublons
    if (seen.has(normalizedOD)) {
      continue;
    }
    
    seen.add(normalizedOD);
    mappings.push({
      odKey: normalizedOD,
      moduleName: moduleName,
    });
  }
  
  console.log(`\n📊 Statistiques d'extraction:`);
  console.log(`   - Lignes totales traitées: ${totalProcessed}`);
  console.log(`   - Lignes sans OD: ${emptyOD}`);
  console.log(`   - Lignes avec OD mais sans Module: ${emptyModule}`);
  console.log(`   - Correspondances valides extraites: ${mappings.length}`);
  
  // Afficher quelques exemples
  if (mappings.length > 0) {
    console.log(`\n📝 Premiers exemples:`);
    mappings.slice(0, 5).forEach(m => {
      console.log(`   - ${m.odKey} → "${m.moduleName}"`);
    });
  }
  
  return mappings;
}

async function getModuleIdFromName(moduleName) {
  // Chercher le module par nom dans Supabase
  const { data, error } = await supabase
    .from('modules')
    .select('id, name')
    .eq('name', moduleName)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Module non trouvé
      return null;
    }
    throw error;
  }
  
  return data;
}

async function updateTicketModule(odKey, moduleId) {
  const { data, error } = await supabase
    .from('tickets')
    .update({ module_id: moduleId })
    .eq('jira_issue_key', odKey)
    .select('id, jira_issue_key, module_id')
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

async function main() {
  console.log('🚀 MISE À JOUR DES MODULES DES TICKETS OD\n');
  
  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN : Aucune modification ne sera effectuée\n');
  }
  
  try {
    // 1. Télécharger le Google Sheet
    const csvContent = await downloadSheet();
    
    // 2. Extraire les mappings OD → Module
    const mappings = await extractModuleMappings(csvContent);
    
    if (mappings.length === 0) {
      console.log('❌ Aucune correspondance trouvée');
      return;
    }
    
    // 3. Récupérer tous les modules disponibles dans Supabase
    console.log('\n📦 Récupération des modules depuis Supabase...');
    const { data: allModules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name');
    
    if (modulesError) {
      throw modulesError;
    }
    
    const moduleMap = new Map();
    allModules.forEach(m => {
      moduleMap.set(m.name, m.id);
    });
    
    console.log(`✅ ${allModules.length} modules trouvés dans Supabase`);
    
    // 4. Traiter chaque mapping
    console.log('\n🔄 Traitement des correspondances...\n');
    
    const stats = {
      total: mappings.length,
      modulesFound: 0,
      modulesNotFound: 0,
      ticketsUpdated: 0,
      ticketsNotFound: 0,
      ticketsAlreadyUpdated: 0,
      errors: 0,
    };
    
    const notFoundModules = new Set();
    const notFoundTickets = [];
    
    // Traiter par lots de 50 pour meilleure performance
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(mappings.length / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, mappings.length);
      const batch = mappings.slice(batchStart, batchEnd);
      
      console.log(`\n📦 Traitement du lot ${batchIndex + 1}/${totalBatches} (${batch.length} tickets)...`);
      
      for (const mapping of batch) {
        const { odKey, moduleName } = mapping;
        
        // Chercher le module_id
        const moduleId = moduleMap.get(moduleName);
        
        if (!moduleId) {
          console.log(`⚠️  ${odKey} - Module non trouvé: "${moduleName}"`);
          notFoundModules.add(moduleName);
          stats.modulesNotFound++;
          continue;
        }
        
        stats.modulesFound++;
        
        if (isDryRun) {
          if (batchIndex === 0) {
            // Afficher seulement les 5 premiers en dry-run
            if (stats.ticketsUpdated < 5) {
              console.log(`🔍 [DRY-RUN] ${odKey} → Module: "${moduleName}" (${moduleId})`);
            }
          }
          stats.ticketsUpdated++;
        } else {
          try {
            // Vérifier si le ticket existe et récupérer son module_id actuel
            const { data: ticket, error: fetchError } = await supabase
              .from('tickets')
              .select('id, jira_issue_key, module_id')
              .eq('jira_issue_key', odKey)
              .single();
            
            if (fetchError) {
              if (fetchError.code === 'PGRST116') {
                if (stats.ticketsNotFound < 10) {
                  console.log(`⚠️  ${odKey} - Ticket non trouvé dans Supabase`);
                }
                notFoundTickets.push(odKey);
                stats.ticketsNotFound++;
                continue;
              }
              throw fetchError;
            }
            
            // Vérifier si le module est déjà à jour
            if (ticket.module_id === moduleId) {
              stats.ticketsAlreadyUpdated++;
              continue;
            }
            
            // Mettre à jour le ticket
            const updated = await updateTicketModule(odKey, moduleId);
            
            // Afficher seulement les 10 premières mises à jour pour ne pas surcharger
            if (stats.ticketsUpdated < 10) {
              console.log(`✅ ${odKey} - Mis à jour: ${ticket.module_id || 'NULL'} → ${moduleId}`);
            }
            stats.ticketsUpdated++;
            
          } catch (error) {
            console.error(`❌ ${odKey} - Erreur:`, error.message);
            stats.errors++;
          }
        }
      }
      
      // Afficher la progression
      if (!isDryRun) {
        const processed = batchEnd;
        const percentage = ((processed / mappings.length) * 100).toFixed(1);
        console.log(`   ✓ Progression: ${processed}/${mappings.length} (${percentage}%)`);
      }
      
      // Petite pause entre les lots pour éviter la surcharge
      if (batchIndex < totalBatches - 1 && !isDryRun) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 5. Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(60));
    console.log(`📦 Total de correspondances: ${stats.total}`);
    console.log(`✅ Modules trouvés: ${stats.modulesFound}`);
    console.log(`⚠️  Modules non trouvés: ${stats.modulesNotFound}`);
    console.log(`🔄 Tickets mis à jour: ${stats.ticketsUpdated}`);
    console.log(`✅ Tickets déjà à jour: ${stats.ticketsAlreadyUpdated}`);
    console.log(`⚠️  Tickets non trouvés: ${stats.ticketsNotFound}`);
    console.log(`❌ Erreurs: ${stats.errors}`);
    
    if (notFoundModules.size > 0) {
      console.log(`\n⚠️  Modules non trouvés dans Supabase (${notFoundModules.size}):`);
      Array.from(notFoundModules).sort().forEach(m => {
        console.log(`   - "${m}"`);
      });
    }
    
    if (notFoundTickets.length > 0) {
      console.log(`\n⚠️  Tickets OD non trouvés dans Supabase (${notFoundTickets.length}):`);
      notFoundTickets.slice(0, 20).forEach(od => {
        console.log(`   - ${od}`);
      });
      if (notFoundTickets.length > 20) {
        console.log(`   ... et ${notFoundTickets.length - 20} autres`);
      }
    }
    
    if (isDryRun) {
      console.log('\n⚠️  Mode DRY-RUN - Aucune modification effectuée');
      console.log('   Relancez sans --dry-run pour appliquer les modifications');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

