#!/usr/bin/env node

/**
 * Script pour renommer le module "Parametrage Admin" en "Paramétrage"
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
  console.log('🔍 Recherche du module "Parametrage Admin"...\n');
  
  // Vérifier si le module existe
  const { data: existingModule, error: checkError } = await supabase
    .from('modules')
    .select('id, name, product_id')
    .eq('name', 'Parametrage Admin')
    .maybeSingle();
  
  if (checkError) {
    console.error('❌ Erreur lors de la vérification:', checkError.message);
    process.exit(1);
  }
  
  if (!existingModule) {
    console.error('❌ Module "Parametrage Admin" introuvable !');
    process.exit(1);
  }
  
  console.log(`Module actuel trouvé:`);
  console.log(`   ID: ${existingModule.id}`);
  console.log(`   Nom: "${existingModule.name}"`);
  console.log(`   Product ID: ${existingModule.product_id}\n`);
  
  // Vérifier si un module "Paramétrage" existe déjà
  const { data: duplicateModule, error: dupError } = await supabase
    .from('modules')
    .select('id, name')
    .eq('name', 'Paramétrage')
    .maybeSingle();
  
  if (dupError) {
    console.error('❌ Erreur lors de la vérification des doublons:', dupError.message);
    process.exit(1);
  }
  
  if (duplicateModule) {
    console.error('⚠️  Un module "Paramétrage" existe déjà !');
    console.error(`   ID: ${duplicateModule.id}`);
    console.error(`   Nom: "${duplicateModule.name}"\n`);
    console.error('   Action requise: Supprimez ou renommez le module existant avant de continuer.\n');
    process.exit(1);
  }
  
  // Renommer le module
  console.log('📝 Renommage du module en "Paramétrage"...\n');
  
  const { data: updatedModule, error: updateError } = await supabase
    .from('modules')
    .update({ name: 'Paramétrage' })
    .eq('id', existingModule.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Erreur lors du renommage:', updateError.message);
    process.exit(1);
  }
  
  console.log('✅ Module renommé avec succès !');
  console.log(`   ID: ${updatedModule.id}`);
  console.log(`   Ancien nom: "Parametrage Admin"`);
  console.log(`   Nouveau nom: "${updatedModule.name}"`);
  console.log(`   Product ID: ${updatedModule.product_id}\n`);
  
  console.log('✅ Opération terminée avec succès !\n');
}

main();

