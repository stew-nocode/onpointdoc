#!/usr/bin/env node

/**
 * Script pour vérifier les produits et mettre à jour le module "Parametrage Admin"
 * avec le bon product_id (OBC)
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
  console.log('🔍 Recherche du produit "OBC"...\n');
  
  // Rechercher le produit OBC
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', '%OBC%');
  
  if (productsError) {
    console.error('❌ Erreur lors de la recherche des produits:', productsError.message);
    process.exit(1);
  }
  
  if (!products || products.length === 0) {
    console.log('⚠️  Aucun produit "OBC" trouvé. Liste de tous les produits:\n');
    
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name')
      .order('name');
    
    if (allError) {
      console.error('❌ Erreur:', allError.message);
      process.exit(1);
    }
    
    allProducts.forEach((p, idx) => {
      console.log(`   ${idx + 1}. "${p.name}" - ID: ${p.id}`);
    });
    
    process.exit(1);
  }
  
  // Prendre le premier produit OBC trouvé
  const obcProduct = products[0];
  console.log(`✅ Produit OBC trouvé: "${obcProduct.name}" (ID: ${obcProduct.id})\n`);
  
  // Vérifier le module "Parametrage Admin"
  console.log('🔍 Vérification du module "Parametrage Admin"...\n');
  
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id, name, product_id')
    .eq('name', 'Parametrage Admin')
    .maybeSingle();
  
  if (moduleError) {
    console.error('❌ Erreur lors de la recherche du module:', moduleError.message);
    process.exit(1);
  }
  
  if (!module) {
    console.error('❌ Module "Parametrage Admin" introuvable !');
    console.log('   Créez-le d\'abord avec le script create-parametrage-admin-module.mjs\n');
    process.exit(1);
  }
  
  console.log(`Module actuel: "${module.name}" (ID: ${module.id})`);
  console.log(`Product ID actuel: ${module.product_id || 'NULL'}\n`);
  
  // Vérifier si le product_id est déjà correct
  if (module.product_id === obcProduct.id) {
    console.log('✅ Le module a déjà le bon product_id (OBC) !\n');
    return;
  }
  
  // Mettre à jour le module
  console.log(`📝 Mise à jour du module avec le product_id OBC...\n`);
  
  const { data: updatedModule, error: updateError } = await supabase
    .from('modules')
    .update({ product_id: obcProduct.id })
    .eq('id', module.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour:', updateError.message);
    process.exit(1);
  }
  
  console.log('✅ Module mis à jour avec succès !');
  console.log(`   Nom: "${updatedModule.name}"`);
  console.log(`   Product ID: ${updatedModule.product_id} (OBC)\n`);
}

main();

