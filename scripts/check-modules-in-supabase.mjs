#!/usr/bin/env node

/**
 * Script pour vérifier les modules disponibles dans Supabase
 * et préparer le mapping avec le Google Sheet
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📦 Récupération des modules depuis Supabase...\n');
  
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, name, product_id')
    .order('name');
  
  if (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
  
  console.log(`✅ ${modules.length} modules trouvés dans Supabase:\n`);
  
  modules.forEach(m => {
    console.log(`   - "${m.name}" (ID: ${m.id})`);
  });
  
  console.log('\n📋 Modules attendus depuis le Google Sheet (d\'après l\'interface):');
  console.log('   - RH');
  console.log('   - Finance');
  console.log('   - CRM');
  console.log('   - Opérations');
  
  console.log('\n🔍 Vérification du mapping:\n');
  
  const expectedModules = ['RH', 'Finance', 'CRM', 'Opérations'];
  const foundModules = modules.map(m => m.name);
  
  expectedModules.forEach(expected => {
    const found = foundModules.includes(expected);
    if (found) {
      console.log(`   ✅ "${expected}" trouvé dans Supabase`);
    } else {
      console.log(`   ❌ "${expected}" NON trouvé dans Supabase`);
    }
  });
  
  // Vérifier s'il y a des modules dans Supabase qui ne sont pas attendus
  const unexpectedModules = foundModules.filter(m => !expectedModules.includes(m));
  if (unexpectedModules.length > 0) {
    console.log('\n⚠️  Modules dans Supabase non attendus:');
    unexpectedModules.forEach(m => {
      console.log(`   - "${m}"`);
    });
  }
}

main().catch(console.error);

