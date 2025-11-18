/**
 * Script pour créer la feature générique "OBC" et son mapping Jira
 * 
 * Ce script crée :
 * 1. Un submodule "Général" dans un module OBC (ex: Finance)
 * 2. Une feature "OBC" dans ce submodule
 * 3. Le mapping Jira → Supabase pour "OBC"
 * 
 * Usage: node scripts/create-obc-generic-feature.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

/**
 * Trouve un module OBC approprié pour créer le submodule "Général"
 */
async function findOBCModule() {
  // Chercher d'abord un module "Finance" ou "Opérations" dans OBC
  const { data, error } = await supabase
    .from('modules')
    .select(`
      id,
      name,
      products!inner (
        id,
        name
      )
    `)
    .eq('products.name', 'OBC')
    .in('name', ['Finance', 'Opérations', 'Opérations générales'])
    .limit(1);

  if (error) {
    throw error;
  }

  if (data && data.length > 0) {
    return {
      id: data[0].id,
      name: data[0].name,
      product: data[0].products?.name || 'OBC'
    };
  }

  // Sinon, prendre le premier module OBC disponible
  const { data: anyModule, error: anyError } = await supabase
    .from('modules')
    .select(`
      id,
      name,
      products!inner (
        id,
        name
      )
    `)
    .eq('products.name', 'OBC')
    .limit(1)
    .single();

  if (anyError) {
    throw anyError;
  }

  return {
    id: anyModule.id,
    name: anyModule.name,
    product: anyModule.products?.name || 'OBC'
  };
}

/**
 * Crée ou récupère un submodule "Général"
 */
async function getOrCreateGeneralSubmodule(moduleId) {
  // Vérifier si le submodule existe déjà
  const { data: existing, error: checkError } = await supabase
    .from('submodules')
    .select('id, name')
    .eq('module_id', moduleId)
    .ilike('name', '%général%')
    .limit(1)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existing) {
    log(`   ✅ Submodule "Général" existe déjà: ${existing.name} (${existing.id})`, 'green');
    return existing;
  }

  // Créer le submodule "Général"
  const { data: created, error: createError } = await supabase
    .from('submodules')
    .insert({
      name: 'Général',
      module_id: moduleId
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  log(`   ✅ Submodule "Général" créé: ${created.id}`, 'green');
  return created;
}

/**
 * Crée ou récupère la feature "OBC"
 */
async function getOrCreateOBCFeature(submoduleId, jiraFeatureId = '10132') {
  // Vérifier si la feature existe déjà
  const { data: existing, error: checkError } = await supabase
    .from('features')
    .select('id, name, jira_feature_id')
    .eq('submodule_id', submoduleId)
    .eq('name', 'OBC')
    .limit(1)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existing) {
    log(`   ✅ Feature "OBC" existe déjà: ${existing.id}`, 'green');
    return existing;
  }

  // Créer la feature "OBC"
  const featureData = {
    name: 'OBC',
    submodule_id: submoduleId,
    jira_feature_id: parseInt(jiraFeatureId, 10)
  };

  const { data: created, error: createError } = await supabase
    .from('features')
    .insert(featureData)
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  log(`   ✅ Feature "OBC" créée: ${created.id}`, 'green');
  return created;
}

/**
 * Crée le mapping Jira → Supabase
 */
async function createJiraMapping(featureId, jiraFeatureId = '10132') {
  const mappingData = {
    jira_feature_value: 'OBC',
    feature_id: featureId,
    jira_custom_field_id: 'customfield_10052',
    jira_feature_id: jiraFeatureId
  };

  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .upsert(mappingData, {
      onConflict: 'jira_feature_value,jira_custom_field_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    // Si erreur de contrainte unique, récupérer le mapping existant
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('jira_feature_mapping')
        .select('*')
        .eq('jira_feature_value', 'OBC')
        .eq('jira_custom_field_id', 'customfield_10052')
        .single();

      if (existing) {
        log(`   ✅ Mapping existe déjà: OBC → ${existing.feature_id}`, 'green');
        return existing;
      }
    }
    throw error;
  }

  log(`   ✅ Mapping créé: OBC → ${data.feature_id}`, 'green');
  return data;
}

/**
 * Processus principal
 */
async function main() {
  log('\n🚀 CRÉATION DE LA FEATURE GÉNÉRIQUE "OBC"', 'cyan');
  log('='.repeat(60));
  log('Ce script crée une feature générique pour mapper les 124 tickets Jira', 'blue');
  log('qui ont "OBC" comme valeur dans customfield_10052', 'blue');

  try {
    // 1. Trouver un module OBC approprié
    logSection('ÉTAPE 1: Recherche d\'un module OBC');
    const module = await findOBCModule();
    log(`✅ Module sélectionné: ${module.name} (${module.id})`, 'green');

    // 2. Créer ou récupérer le submodule "Général"
    logSection('ÉTAPE 2: Création du submodule "Général"');
    const submodule = await getOrCreateGeneralSubmodule(module.id);
    log(`✅ Submodule: ${submodule.name} (${submodule.id})`, 'green');

    // 3. Créer ou récupérer la feature "OBC"
    logSection('ÉTAPE 3: Création de la feature "OBC"');
    const feature = await getOrCreateOBCFeature(submodule.id);
    log(`✅ Feature: ${feature.name} (${feature.id})`, 'green');

    // 4. Créer le mapping Jira → Supabase
    logSection('ÉTAPE 4: Création du mapping Jira → Supabase');
    const mapping = await createJiraMapping(feature.id);
    log(`✅ Mapping: "OBC" → Feature ${mapping.feature_id}`, 'green');

    // Résumé
    logSection('RÉSUMÉ');
    log('✅ Structure créée avec succès:', 'green');
    log(`   📦 Produit: OBC`, 'blue');
    log(`   📁 Module: ${module.name}`, 'blue');
    log(`   📂 Submodule: ${submodule.name}`, 'blue');
    log(`   ⚙️  Feature: ${feature.name} (ID: ${feature.id})`, 'blue');
    log(`   🔗 Mapping: "OBC" → Feature ${mapping.feature_id}`, 'blue');
    log(`\n💡 ${124} tickets Jira peuvent maintenant être mappés`, 'cyan');

  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    if (error.details) {
      log(`   Détails: ${error.details}`, 'red');
    }
    if (error.hint) {
      log(`   Indice: ${error.hint}`, 'yellow');
    }
    process.exit(1);
  }
}

// Exécuter
main().catch(console.error);

