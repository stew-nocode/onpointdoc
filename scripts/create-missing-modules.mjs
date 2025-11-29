#!/usr/bin/env node

/**
 * Script pour identifier et créer les modules manquants dans Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

// Parse arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function main() {
  console.log('🔍 IDENTIFICATION DES MODULES MANQUANTS\n');
  
  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN : Aucune création ne sera effectuée\n');
  }
  
  try {
    // 1. Charger les modules du Google Sheet
    console.log('📥 Chargement des modules depuis od-module-mappings.json...');
    const mappingsPath = path.join(process.cwd(), 'docs/ticket/od-module-mappings.json');
    
    if (!fs.existsSync(mappingsPath)) {
      console.error('❌ Fichier od-module-mappings.json introuvable');
      console.error('   Exécutez d\'abord: node scripts/extract-od-modules-direct.mjs');
      process.exit(1);
    }
    
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    const modulesFromSheet = new Set();
    
    mappings.forEach(m => {
      if (m.module && m.module.trim()) {
        modulesFromSheet.add(m.module.trim());
      }
    });
    
    console.log(`✅ ${modulesFromSheet.size} modules trouvés dans le Google Sheet:`);
    Array.from(modulesFromSheet).sort().forEach(m => {
      console.log(`   - "${m}"`);
    });
    
    // 2. Récupérer les modules existants dans Supabase
    console.log('\n📦 Récupération des modules depuis Supabase...');
    const { data: existingModules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name');
    
    if (modulesError) {
      throw modulesError;
    }
    
    const existingModuleNames = new Set(existingModules.map(m => m.name));
    
    console.log(`✅ ${existingModules.length} modules existants dans Supabase:`);
    existingModules.forEach(m => {
      console.log(`   - "${m.name}" (ID: ${m.id})`);
    });
    
    // 3. Identifier les modules manquants
    const missingModules = Array.from(modulesFromSheet).filter(
      name => !existingModuleNames.has(name)
    );
    
    console.log('\n📊 ANALYSE:');
    console.log(`   - Modules dans Google Sheet: ${modulesFromSheet.size}`);
    console.log(`   - Modules existants dans Supabase: ${existingModuleNames.size}`);
    console.log(`   - Modules manquants: ${missingModules.length}`);
    
    if (missingModules.length === 0) {
      console.log('\n✅ Tous les modules existent déjà dans Supabase !');
      return;
    }
    
    console.log('\n⚠️  MODULES MANQUANTS:');
    missingModules.forEach((name, idx) => {
      console.log(`   ${idx + 1}. "${name}"`);
    });
    
    // 4. Créer les modules manquants
    if (isDryRun) {
      console.log('\n⚠️  Mode DRY-RUN - Les modules suivants seraient créés:');
      missingModules.forEach(name => {
        console.log(`   - "${name}"`);
      });
      return;
    }
    
    console.log('\n🔄 Création des modules manquants...\n');
    
    const createdModules = [];
    const errors = [];
    
    for (const moduleName of missingModules) {
      try {
        // Vérifier d'abord si le module n'existe pas déjà (race condition)
        const { data: existing } = await supabase
          .from('modules')
          .select('id, name')
          .eq('name', moduleName)
          .single();
        
        if (existing) {
          console.log(`✅ "${moduleName}" existe déjà (ID: ${existing.id})`);
          createdModules.push({ name: moduleName, id: existing.id, status: 'existed' });
          continue;
        }
        
        // Créer le module
        // Note: Il faut peut-être spécifier d'autres champs selon le schéma
        const { data: newModule, error: createError } = await supabase
          .from('modules')
          .insert({ name: moduleName })
          .select('id, name')
          .single();
        
        if (createError) {
          console.error(`❌ Erreur lors de la création de "${moduleName}":`, createError.message);
          errors.push({ name: moduleName, error: createError.message });
        } else {
          console.log(`✅ "${moduleName}" créé (ID: ${newModule.id})`);
          createdModules.push({ name: moduleName, id: newModule.id, status: 'created' });
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la création de "${moduleName}":`, error.message);
        errors.push({ name: moduleName, error: error.message });
      }
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ Modules créés: ${createdModules.filter(m => m.status === 'created').length}`);
    console.log(`✅ Modules existants: ${createdModules.filter(m => m.status === 'existed').length}`);
    console.log(`❌ Erreurs: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Erreurs:');
      errors.forEach(e => {
        console.log(`   - "${e.name}": ${e.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

