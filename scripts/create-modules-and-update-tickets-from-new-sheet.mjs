#!/usr/bin/env node

/**
 * Script pour créer les nouveaux modules et mettre à jour les tickets
 * à partir du nouveau Google Sheet fourni
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

const GOOGLE_SHEET_ID = '1cwjY3Chw5Y2ce_zzBBHOg3R3n1NntmHpLbuxNU8_WOQ';
const GID = '0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

/**
 * Nettoie une chaîne de caractères des caractères corrompus et BOM
 */
function cleanString(str) {
  if (!str) return '';
  
  return str
    .replace(/^\uFEFF/, '') // Supprimer BOM
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Supprimer caractères de contrôle
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Garder uniquement caractères imprimables et Unicode valides
    .trim();
}

/**
 * Normalise une chaîne en supprimant les accents pour la comparaison
 */
function normalizeForComparison(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .toLowerCase()
    .trim();
}

/**
 * Normalise le nom d'un module pour l'affichage et le stockage
 * Gère aussi les corrections de noms connus
 */
function normalizeModuleName(moduleNameRaw) {
  if (!moduleNameRaw) return '';
  
  // Nettoyer d'abord
  let cleaned = cleanString(moduleNameRaw);
  
  // Nettoyer plus agressivement les caractères corrompus courants
  cleaned = cleaned
    .replace(/[|®]/g, 'é') // Remplacer |® par é
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Supprimer autres caractères invalides
    .trim();
  
  // Mapping de corrections pour les noms corrompus ou variations
  const corrections = {
    'param|®trage admin': 'Paramétrage',
    'paramétrage admin': 'Paramétrage',
    'parametrage admin': 'Paramétrage',
    'paramétrage': 'Paramétrage',
    'parametrage': 'Paramétrage',
    'parametrageadmin': 'Paramétrage',
    'paramétrageadmin': 'Paramétrage',
  };
  
  const normalizedLower = cleaned.toLowerCase().trim();
  
  // Vérifier si on a une correction exacte
  if (corrections[normalizedLower]) {
    return corrections[normalizedLower];
  }
  
  // Vérifier par pattern (contient "param" et "admin" mais avec caractères corrompus)
  if (/param.*admin/i.test(cleaned)) {
    // Essayer de reconstruire "Paramétrage" (avec accent)
    if (/param.*trage/i.test(cleaned) || /param.*tr/i.test(cleaned)) {
      return 'Paramétrage';
    }
  }
  
  // Normalisation standard
  let normalized = cleaned
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      // Capitaliser la première lettre, garder le reste en minuscule
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter(word => word.length > 0) // Supprimer les mots vides
    .join(' ')
    .replace(/\s+/g, ' '); // Supprimer les espaces multiples
  
  // Dernière vérification : si ça ressemble à "Paramétrage admin" ou "Parametrage Admin", corriger vers "Paramétrage"
  if (/^Param.*[Tt]rag?e?\s*(Admin?)?$/i.test(normalized)) {
    return 'Paramétrage';
  }
  
  return normalized;
}

async function downloadAndParseSheet() {
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  
  // Télécharger comme buffer binaire puis décoder en UTF-8
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Détecter et supprimer le BOM UTF-8 si présent
  let startIndex = 0;
  if (uint8Array.length >= 3 && 
      uint8Array[0] === 0xEF && 
      uint8Array[1] === 0xBB && 
      uint8Array[2] === 0xBF) {
    startIndex = 3;
  }
  
  const csvContent = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true })
    .decode(uint8Array.slice(startIndex));
  
  // Parser le CSV
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
    encoding: 'utf8',
  });
  
  // Trouver les colonnes (première ligne = headers)
  const headers = rawRecords[0];
  const ticketKeyIndex = headers.findIndex(h => {
    const clean = cleanString(h || '');
    return clean && (clean.toLowerCase().includes('clé') || clean.toLowerCase().includes('ticket'));
  });
  const moduleIndex = headers.findIndex(h => {
    const clean = cleanString(h || '');
    return clean && clean.toLowerCase().includes('module');
  });
  
  if (ticketKeyIndex === -1 || moduleIndex === -1) {
    console.error('Headers trouvés:', headers.map(h => cleanString(h || '')));
    throw new Error('Colonnes "Clé de ticket" ou "module" introuvables');
  }
  
  console.log(`✅ Colonnes trouvées: ticket=${ticketKeyIndex}, module=${moduleIndex}\n`);
  
  // Extraire les tickets avec modules (ignorer les vides)
  const ticketModuleMappings = [];
  const uniqueModules = new Set();
  const moduleNameMap = new Map(); // Map pour garder le nom original normalisé
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.length <= Math.max(ticketKeyIndex, moduleIndex)) {
      continue;
    }
    
    const ticketKeyRaw = row[ticketKeyIndex];
    const moduleNameRaw = row[moduleIndex];
    
    // Nettoyer et valider
    const ticketKey = cleanString(ticketKeyRaw);
    const moduleNameCleaned = cleanString(moduleNameRaw);
    
    // Ignorer les vides
    if (!ticketKey || !moduleNameCleaned || moduleNameCleaned.length === 0) {
      continue;
    }
    
    // Normaliser la clé ticket
    const normalizedOD = ticketKey.toUpperCase().startsWith('OD-')
      ? ticketKey.toUpperCase()
      : `OD-${ticketKey.toUpperCase().replace(/^OD-?/, '')}`;
    
    // Normaliser le nom du module pour l'affichage
    const normalizedModule = normalizeModuleName(moduleNameCleaned);
    
    if (!normalizedModule || normalizedModule.length === 0) {
      console.warn(`⚠️  Module vide après normalisation pour ${normalizedOD} (original: "${moduleNameRaw}")`);
      continue;
    }
    
    // Utiliser la clé de comparaison pour éviter les doublons (sans accents)
    const comparisonKey = normalizeForComparison(normalizedModule);
    
    // Garder le meilleur nom normalisé pour chaque module (premier rencontré)
    if (!moduleNameMap.has(comparisonKey)) {
      moduleNameMap.set(comparisonKey, normalizedModule);
      uniqueModules.add(normalizedModule);
    }
    
    ticketModuleMappings.push({
      ticketKey: normalizedOD,
      moduleName: moduleNameMap.get(comparisonKey), // Utiliser le nom normalisé stocké
      moduleNameRaw: moduleNameRaw, // Garder l'original pour debug
    });
  }
  
  return {
    mappings: ticketModuleMappings,
    uniqueModules: Array.from(uniqueModules).sort(),
  };
}

async function getExistingModules() {
  console.log('📦 Récupération des modules existants dans Supabase...');
  
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, name')
    .order('name');
  
  if (error) {
    throw new Error(`Erreur lors de la récupération des modules: ${error.message}`);
  }
  
  // Créer deux maps : une pour la recherche exacte, une pour la recherche normalisée
  const moduleMap = new Map(); // key: lowercase exact
  const moduleMapNormalized = new Map(); // key: normalized (sans accents) → module object
  
  modules.forEach(m => {
    const exactKey = m.name.toLowerCase();
    const normalizedKey = normalizeForComparison(m.name);
    
    moduleMap.set(exactKey, {
      id: m.id,
      name: m.name,
    });
    
    // Pour la recherche normalisée, garder le premier (ou le plus récent)
    if (!moduleMapNormalized.has(normalizedKey)) {
      moduleMapNormalized.set(normalizedKey, {
        id: m.id,
        name: m.name,
      });
    }
  });
  
  console.log(`✅ ${modules.length} modules existants trouvés\n`);
  
  return { exact: moduleMap, normalized: moduleMapNormalized };
}

async function createNewModules(newModuleNames, existingModules) {
  const modulesToCreate = newModuleNames.filter(name => {
    const exactKey = name.toLowerCase();
    const normalizedKey = normalizeForComparison(name);
    
    // Vérifier si le module existe déjà (exact ou normalisé)
    return !existingModules.exact.has(exactKey) && 
           !existingModules.normalized.has(normalizedKey);
  });
  
  if (modulesToCreate.length === 0) {
    console.log('✅ Aucun nouveau module à créer\n');
    return { exact: new Map(), normalized: new Map() };
  }
  
  console.log(`📝 Création de ${modulesToCreate.length} nouveaux modules...\n`);
  
  const createdModules = new Map();
  const createdModulesNormalized = new Map();
  
  for (const moduleName of modulesToCreate) {
    console.log(`   - Création de "${moduleName}"...`);
    
    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        name: moduleName,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error(`   ❌ Erreur lors de la création de "${moduleName}": ${error.message}`);
      continue;
    }
    
    const exactKey = moduleName.toLowerCase();
    const normalizedKey = normalizeForComparison(moduleName);
    
    createdModules.set(exactKey, {
      id: module.id,
      name: module.name,
    });
    
    createdModulesNormalized.set(normalizedKey, {
      id: module.id,
      name: module.name,
    });
    
    console.log(`   ✅ "${moduleName}" créé (ID: ${module.id})`);
  }
  
  console.log('');
  
  return { exact: createdModules, normalized: createdModulesNormalized };
}

async function updateTicketsWithModules(ticketModuleMappings, allModulesMap, allModulesMapNormalized) {
  console.log(`🔄 Mise à jour de ${ticketModuleMappings.length} tickets avec leurs modules...\n`);
  
  const stats = {
    total: ticketModuleMappings.length,
    updated: 0,
    notFound: 0,
    errors: 0,
    alreadyUpToDate: 0,
  };
  
  // Traiter par lots de 50
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(ticketModuleMappings.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, ticketModuleMappings.length);
    const batch = ticketModuleMappings.slice(batchStart, batchEnd);
    
    // Récupérer les tickets du lot
    const ticketKeys = batch.map(m => m.ticketKey);
    
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, module_id')
      .in('jira_issue_key', ticketKeys);
    
    if (fetchError) {
      console.error(`❌ Erreur lors de la récupération du lot ${batchIndex + 1}:`, fetchError.message);
      stats.errors += batch.length;
      continue;
    }
    
    // Créer un map pour lookup rapide
    const ticketMap = new Map();
    tickets.forEach(t => {
      ticketMap.set(t.jira_issue_key, t);
    });
    
    // Mettre à jour chaque ticket du lot
    for (const mapping of batch) {
      const ticket = ticketMap.get(mapping.ticketKey);
      
      if (!ticket) {
        stats.notFound++;
        continue;
      }
      
      // Rechercher le module (exact d'abord, puis normalisé)
      let module = allModulesMap.get(mapping.moduleName.toLowerCase());
      
      if (!module) {
        // Essayer avec la recherche normalisée (sans accents)
        const normalizedKey = normalizeForComparison(mapping.moduleName);
        module = allModulesMapNormalized.get(normalizedKey);
      }
      
      if (!module) {
        console.error(`⚠️  Module "${mapping.moduleName}" (original: "${mapping.moduleNameRaw}") introuvable pour ${mapping.ticketKey}`);
        stats.errors++;
        continue;
      }
      
      // Vérifier si déjà à jour
      if (ticket.module_id === module.id) {
        stats.alreadyUpToDate++;
        continue;
      }
      
      // Mettre à jour
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ module_id: module.id })
        .eq('id', ticket.id);
      
      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour de ${mapping.ticketKey}:`, updateError.message);
        stats.errors++;
        continue;
      }
      
      stats.updated++;
    }
    
    // Afficher la progression
    const processed = batchEnd;
    const percentage = ((processed / ticketModuleMappings.length) * 100).toFixed(1);
    if (batchIndex % 10 === 0 || batchIndex === totalBatches - 1) {
      console.log(`   ✓ Progression: ${processed}/${ticketModuleMappings.length} (${percentage}%)`);
    }
    
    // Petite pause entre les lots pour éviter la surcharge
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return stats;
}

async function main() {
  console.log('🚀 CRÉATION DE NOUVEAUX MODULES ET MISE À JOUR DES TICKETS');
  console.log('   depuis le nouveau Google Sheet\n');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 1. Télécharger et parser le Google Sheet
    const { mappings, uniqueModules } = await downloadAndParseSheet();
    console.log(`✅ ${mappings.length} tickets avec modules trouvés`);
    console.log(`✅ ${uniqueModules.length} modules uniques identifiés\n`);
    
    // Afficher les modules trouvés
    console.log('📋 Modules identifiés dans le sheet:');
    uniqueModules.forEach((module, idx) => {
      console.log(`   ${idx + 1}. ${module}`);
    });
    console.log('');
    
    // 2. Récupérer les modules existants
    const existingModules = await getExistingModules();
    
    // 3. Identifier les nouveaux modules à créer
    const newModules = uniqueModules.filter(name => {
      const exactKey = name.toLowerCase();
      const normalizedKey = normalizeForComparison(name);
      return !existingModules.exact.has(exactKey) && 
             !existingModules.normalized.has(normalizedKey);
    });
    
    if (newModules.length > 0) {
      console.log(`📝 ${newModules.length} nouveaux modules à créer:`);
      newModules.forEach((module, idx) => {
        console.log(`   ${idx + 1}. ${module}`);
      });
      console.log('');
    } else {
      console.log('✅ Tous les modules existent déjà dans Supabase\n');
    }
    
    // 4. Créer les nouveaux modules
    const createdModules = await createNewModules(uniqueModules, existingModules);
    
    // 5. Fusionner tous les modules (existants + créés)
    const allModulesMap = new Map([...existingModules.exact, ...createdModules.exact]);
    const allModulesMapNormalized = new Map([
      ...existingModules.normalized, 
      ...createdModules.normalized
    ]);
    
    // 6. Mettre à jour les tickets
    const stats = await updateTicketsWithModules(mappings, allModulesMap, allModulesMapNormalized);
    
    // 7. Afficher le résumé final
    console.log('='.repeat(60));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(60));
    console.log(`Total de tickets traités: ${stats.total}`);
    console.log(`✅ Tickets mis à jour: ${stats.updated}`);
    console.log(`⚪ Déjà à jour: ${stats.alreadyUpToDate}`);
    console.log(`❌ Tickets non trouvés: ${stats.notFound}`);
    console.log(`⚠️  Erreurs: ${stats.errors}`);
    console.log(`\n📦 Modules:`);
    console.log(`   - Modules existants: ${existingModules.exact.size}`);
    console.log(`   - Nouveaux modules créés: ${createdModules.exact.size}`);
    console.log(`   - Total modules: ${allModulesMap.size}`);
    console.log('');
    
    // Sauvegarder les tickets non trouvés
    if (stats.notFound > 0 || stats.errors > 0) {
      const csvLines = ['OD_KEY,MODULE_NORMALIZED,MODULE_RAW'];
      mappings.forEach(m => {
        csvLines.push(`${m.ticketKey},${m.moduleName},"${(m.moduleNameRaw || '').replace(/"/g, '""')}"`);
      });
      
      fs.writeFileSync(
        'docs/ticket/tickets-modules-nouveau-sheet.csv',
        csvLines.join('\n'),
        'utf8'
      );
      console.log(`💾 Liste complète sauvegardée dans: docs/ticket/tickets-modules-nouveau-sheet.csv`);
    }
    
    console.log('\n✅ Opération terminée avec succès !\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
