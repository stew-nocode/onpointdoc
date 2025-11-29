#!/usr/bin/env node

/**
 * Script pour créer le module "Parametrage Admin" (sans accent)
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
  console.log('🔍 Vérification des modules existants pour trouver product_id...\n');
  
  // Récupérer un module existant pour voir sa structure
  const { data: existingModules, error: fetchError } = await supabase
    .from('modules')
    .select('id, name, product_id')
    .limit(1)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('❌ Erreur:', fetchError.message);
    process.exit(1);
  }
  
  // Si on a trouvé un module, utiliser son product_id
  let productId = null;
  
  if (existingModules && existingModules.product_id) {
    productId = existingModules.product_id;
    console.log(`✅ Product ID trouvé depuis module existant: ${productId}\n`);
  } else {
    // Essayer de trouver un product_id depuis la table products
    console.log('📦 Recherche d\'un product_id depuis la table products...\n');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
      .single();
    
    if (productsError) {
      console.error('❌ Erreur lors de la récupération des products:', productsError.message);
      console.log('\n💡 Tentative de création sans product_id...\n');
    } else if (products) {
      productId = products.id;
      console.log(`✅ Product ID trouvé: ${productId}\n`);
    }
  }
  
  // Vérifier si le module existe déjà
  console.log('🔍 Vérification si le module existe déjà...\n');
  
  const { data: existingModule, error: checkError } = await supabase
    .from('modules')
    .select('id, name, product_id')
    .ilike('name', 'Parametrage Admin')
    .maybeSingle();
  
  if (checkError) {
    console.error('❌ Erreur lors de la vérification:', checkError.message);
    process.exit(1);
  }
  
  if (existingModule) {
    console.log(`✅ Le module existe déjà: "${existingModule.name}" (ID: ${existingModule.id})`);
    console.log(`   Product ID: ${existingModule.product_id || 'NULL'}\n`);
    return;
  }
  
  // Créer le module
  console.log(`📝 Création du module "Parametrage Admin"...\n`);
  
  const moduleData = {
    name: 'Parametrage Admin',
    created_at: new Date().toISOString(),
  };
  
  // Ajouter product_id seulement s'il existe
  if (productId) {
    moduleData.product_id = productId;
  }
  
  const { data: newModule, error: createError } = await supabase
    .from('modules')
    .insert(moduleData)
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Erreur lors de la création:', createError.message);
    console.error('   Détails:', createError);
    
    // Si l'erreur est due à product_id manquant, essayer sans
    if (createError.code === '23502' && createError.column === 'product_id') {
      console.log('\n⚠️  product_id est requis. Tentative avec product_id NULL...\n');
      console.log('💡 Vous devrez peut-être définir product_id manuellement dans Supabase.\n');
    }
    
    process.exit(1);
  }
  
  console.log(`✅ Module créé avec succès !`);
  console.log(`   ID: ${newModule.id}`);
  console.log(`   Nom: "${newModule.name}"`);
  console.log(`   Product ID: ${newModule.product_id || 'NULL'}\n`);
}

main();

