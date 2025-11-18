/* eslint-disable no-console */
/**
 * Script d'initialisation des affectations Produits ↔ Départements
 * 
 * Crée les liaisons entre produits et départements selon la configuration.
 * 
 * Exemple :
 * - OBC → IT, Support, Marketing
 * - SNI → IT, Support, Marketing
 * - Credit Factory → IT, Support (ou autres selon besoin)
 * 
 * Usage: node scripts/init-product-department-links.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// ============================================
// CONFIGURATION : Produits ↔ Départements
// ============================================
const productDepartmentMapping = {
  'OBC': ['IT', 'Support', 'Marketing'],
  'SNI': ['IT', 'Support', 'Marketing'],
  'Credit Factory': ['IT', 'Support'] // Ajuster selon besoin
};

async function initProductDepartmentLinks() {
  console.log(`\n🔍 Récupération des produits et départements...\n`);

  // Récupérer tous les produits
  const { data: products, error: productsErr } = await supabase
    .from('products')
    .select('id, name')
    .order('name', { ascending: true });

  if (productsErr) {
    console.error(`❌ Erreur lors de la récupération des produits:`, productsErr.message);
    process.exit(1);
  }

  // Récupérer tous les départements
  const { data: departments, error: deptsErr } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (deptsErr) {
    console.error(`❌ Erreur lors de la récupération des départements:`, deptsErr.message);
    console.error(`   Assurez-vous que la migration "transform-departments-to-table" a été appliquée.`);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.error(`❌ Aucun produit trouvé dans la base de données.`);
    process.exit(1);
  }

  if (!departments || departments.length === 0) {
    console.error(`❌ Aucun département trouvé dans la base de données.`);
    console.error(`   Assurez-vous que la migration "transform-departments-to-table" a été appliquée.`);
    process.exit(1);
  }

  console.log(`✅ ${products.length} produit(s) trouvé(s)`);
  console.log(`✅ ${departments.length} département(s) trouvé(s)\n`);

  // Créer un mapping nom → id
  const productsMap = new Map(products.map((p) => [p.name, p.id]));
  const departmentsMap = new Map(departments.map((d) => [d.name, d.id]));

  console.log(`🚀 Création des affectations Produits ↔ Départements...\n`);

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [productName, departmentNames] of Object.entries(productDepartmentMapping)) {
    const productId = productsMap.get(productName);

    if (!productId) {
      console.warn(`⚠️  Produit "${productName}" non trouvé, ignoré`);
      totalSkipped++;
      continue;
    }

    console.log(`📦 ${productName}:`);

    for (const deptName of departmentNames) {
      const departmentId = departmentsMap.get(deptName);

      if (!departmentId) {
        console.warn(`   ⚠️  Département "${deptName}" non trouvé, ignoré`);
        totalSkipped++;
        continue;
      }

      // Vérifier si la liaison existe déjà
      const { data: existing } = await supabase
        .from('product_department_link')
        .select('id')
        .eq('product_id', productId)
        .eq('department_id', departmentId)
        .maybeSingle();

      if (existing) {
        console.log(`   ⏭️  "${deptName}" déjà affecté`);
        totalSkipped++;
        continue;
      }

      // Créer la liaison
      const { error: insertErr } = await supabase
        .from('product_department_link')
        .insert({
          product_id: productId,
          department_id: departmentId
        });

      if (insertErr) {
        console.error(`   ❌ Erreur pour "${deptName}":`, insertErr.message);
        totalErrors++;
      } else {
        console.log(`   ✅ "${deptName}" affecté`);
        totalCreated++;
      }
    }
    console.log('');
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Créées: ${totalCreated}`);
  console.log(`   ⏭️  Déjà existantes/Ignorées: ${totalSkipped}`);
  console.log(`   ❌ Erreurs: ${totalErrors}`);

  // Afficher un récapitulatif
  console.log(`\n📋 Récapitulatif des affectations:`);
  const { data: links } = await supabase
    .from('product_department_link')
    .select(`
      product_id,
      department_id,
      products:product_id (name),
      departments:department_id (name, code)
    `)
    .order('products.name', { ascending: true });

  if (links && links.length > 0) {
    const groupedByProduct = new Map();
    links.forEach((link) => {
      const productName = link.products?.name || 'Inconnu';
      const deptName = link.departments?.name || 'Inconnu';
      if (!groupedByProduct.has(productName)) {
        groupedByProduct.set(productName, []);
      }
      groupedByProduct.get(productName).push(deptName);
    });

    groupedByProduct.forEach((depts, productName) => {
      console.log(`   ${productName}: ${depts.join(', ')}`);
    });
  }

  console.log(`\n✨ Initialisation terminée!\n`);
}

initProductDepartmentLinks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

