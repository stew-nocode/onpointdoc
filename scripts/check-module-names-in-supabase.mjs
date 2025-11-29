#!/usr/bin/env node

/**
 * Script pour vérifier les noms de modules existants dans Supabase
 * et voir comment ils sont stockés
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log('🔍 Vérification des noms de modules dans Supabase...\n');
  
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, name')
    .order('name');
  
  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ ${modules.length} modules trouvés:\n`);
  
  // Rechercher les modules contenant "param" (insensible à la casse)
  const paramModules = modules.filter(m => 
    m.name.toLowerCase().includes('param')
  );
  
  if (paramModules.length > 0) {
    console.log('📋 Modules contenant "param":');
    paramModules.forEach(m => {
      console.log(`   - ID: ${m.id} | Nom: "${m.name}"`);
      // Afficher les codes hexadécimaux pour voir les caractères
      const hex = Array.from(m.name).map(c => 
        c.charCodeAt(0).toString(16).padStart(4, '0')
      ).join(' ');
      console.log(`     Codes hex: ${hex}`);
    });
    console.log('');
  }
  
  console.log('📋 Tous les modules:');
  modules.forEach((m, idx) => {
    console.log(`   ${idx + 1}. "${m.name}" (ID: ${m.id})`);
  });
}

main();

