/**
 * Script pour créer les 26 features restantes et leurs mappings Jira → Supabase
 * 
 * Stratégie :
 * - Format "Module - Feature" : Trouver module, créer submodule si nécessaire, créer feature
 * - Format "Module - SubModule - Feature" : Trouver module et submodule, créer feature
 * - Format simple (GED) : Créer dans Opérations → Général
 * 
 * Usage: node scripts/create-remaining-26-features.js
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
 * Liste des 26 features à créer
 * Format: { jiraValue, moduleName, submoduleName, featureName, ticketCount, priority }
 */
const featuresToCreate = [
  // PRIORITÉ HAUTE (30+ tickets)
  { jiraValue: 'Paramétrage admin. système - Workflow', moduleName: 'Global', submoduleName: 'Workflow', featureName: 'Workflow', ticketCount: 34, priority: 'HAUTE' },
  { jiraValue: 'CRM - Analytique', moduleName: 'CRM', submoduleName: 'Analytique', featureName: 'Analytique', ticketCount: 29, priority: 'HAUTE' },
  { jiraValue: 'Paramétrage admin. système - Paramétrage sur fonctionnalités', moduleName: 'Global', submoduleName: 'Paramétrage sur fonctionnalités', featureName: 'Paramétrage sur fonctionnalités', ticketCount: 28, priority: 'HAUTE' },
  
  // PRIORITÉ MOYENNE (10-29 tickets)
  { jiraValue: 'Opérations - Parc automobile', moduleName: 'Opérations', submoduleName: 'Parc automobile', featureName: 'Parc automobile', ticketCount: 26, priority: 'MOYENNE' },
  { jiraValue: 'CRM - Paramétrage', moduleName: 'CRM', submoduleName: 'Paramétrage', featureName: 'Paramétrage', ticketCount: 20, priority: 'MOYENNE' },
  { jiraValue: 'Paramétrage admin. système - Autres admin. système', moduleName: 'Global', submoduleName: 'Autres admin. système', featureName: 'Autres admin. système', ticketCount: 17, priority: 'MOYENNE' },
  { jiraValue: 'Paiement - Centre de paiement', moduleName: 'Paiement', submoduleName: 'Centre de paiement', featureName: 'Centre de paiement', ticketCount: 16, priority: 'MOYENNE' },
  { jiraValue: 'Opérations - Production', moduleName: 'Opérations', submoduleName: 'Production', featureName: 'Production', ticketCount: 16, priority: 'MOYENNE' },
  { jiraValue: 'Paramétrage admin. système - Gestion des utilisateurs', moduleName: 'Global', submoduleName: 'Gestion des utilisateurs', featureName: 'Gestion des utilisateurs', ticketCount: 14, priority: 'MOYENNE' },
  { jiraValue: 'Paramétrage admin. système - Dashboard Global', moduleName: 'Global', submoduleName: 'Dashboard Global', featureName: 'Dashboard Global', ticketCount: 12, priority: 'MOYENNE' },
  { jiraValue: 'Projets - Paramétrage', moduleName: 'Projets', submoduleName: 'Paramétrage', featureName: 'Paramétrage', ticketCount: 5, priority: 'MOYENNE' },
  
  // PRIORITÉ BASSE (1-9 tickets)
  { jiraValue: 'RH - Dashboard', moduleName: 'RH', submoduleName: 'Dashboard', featureName: 'Dashboard', ticketCount: 6, priority: 'BASSE' },
  { jiraValue: 'Opérations - Dashboard', moduleName: 'Opérations', submoduleName: 'Dashboard', featureName: 'Dashboard', ticketCount: 4, priority: 'BASSE' },
  { jiraValue: 'Finance - Paiement', moduleName: 'Finance', submoduleName: 'Paiement', featureName: 'Paiement', ticketCount: 4, priority: 'BASSE' },
  { jiraValue: 'Opérations - Dashboard - Parc Auto', moduleName: 'Opérations', submoduleName: 'Dashboard', featureName: 'Parc Auto', ticketCount: 3, priority: 'BASSE' },
  { jiraValue: 'Opérations - Paramétrage - Parc Auto', moduleName: 'Opérations', submoduleName: 'Paramétrage', featureName: 'Parc Auto', ticketCount: 3, priority: 'BASSE' },
  { jiraValue: 'RH - Evaluation', moduleName: 'RH', submoduleName: 'Evaluation', featureName: 'Evaluation', ticketCount: 3, priority: 'BASSE' },
  { jiraValue: 'Finance - Dashboard', moduleName: 'Finance', submoduleName: 'Dashboard', featureName: 'Dashboard', ticketCount: 2, priority: 'BASSE' },
  { jiraValue: 'Opérations - Processus métier', moduleName: 'Opérations', submoduleName: 'Processus métier', featureName: 'Processus métier', ticketCount: 2, priority: 'BASSE' },
  { jiraValue: 'GED', moduleName: 'Opérations', submoduleName: 'Général', featureName: 'GED', ticketCount: 2, priority: 'BASSE' },
  { jiraValue: 'Paramétrage admin. système - Gestion des administrateurs', moduleName: 'Global', submoduleName: 'Gestion des administrateurs', featureName: 'Gestion des administrateurs', ticketCount: 1, priority: 'BASSE' },
  { jiraValue: 'Paiement - Dashboard', moduleName: 'Paiement', submoduleName: 'Dashboard', featureName: 'Dashboard', ticketCount: 1, priority: 'BASSE' },
  { jiraValue: 'Paiement - Point de paiement', moduleName: 'Paiement', submoduleName: 'Point de paiement', featureName: 'Point de paiement', ticketCount: 1, priority: 'BASSE' },
  { jiraValue: 'Opérations - Paramétrage', moduleName: 'Opérations', submoduleName: 'Paramétrage', featureName: 'Paramétrage', ticketCount: 1, priority: 'BASSE' },
  { jiraValue: 'RH - Recrutement', moduleName: 'RH', submoduleName: 'Recrutement', featureName: 'Recrutement', ticketCount: 1, priority: 'BASSE' },
  { jiraValue: 'RH - Formation', moduleName: 'RH', submoduleName: 'Formation', featureName: 'Formation', ticketCount: 1, priority: 'BASSE' }
];

/**
 * Trouve un module par nom (dans OBC)
 */
async function findModule(moduleName) {
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
    .ilike('name', `%${moduleName}%`)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Trouve un submodule par nom dans un module
 */
async function findSubmodule(moduleId, submoduleName) {
  const { data, error } = await supabase
    .from('submodules')
    .select('id, name')
    .eq('module_id', moduleId)
    .ilike('name', `%${submoduleName}%`)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Crée un submodule s'il n'existe pas
 */
async function getOrCreateSubmodule(moduleId, submoduleName) {
  const existing = await findSubmodule(moduleId, submoduleName);
  
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('submodules')
    .insert({
      name: submoduleName,
      module_id: moduleId
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  log(`   ✅ Submodule créé: ${submoduleName}`, 'green');
  return data;
}

/**
 * Vérifie si une feature existe déjà
 */
async function featureExists(submoduleId, featureName) {
  const { data, error } = await supabase
    .from('features')
    .select('id, name')
    .eq('submodule_id', submoduleId)
    .ilike('name', `%${featureName}%`)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Crée une feature
 */
async function createFeature(submoduleId, featureName) {
  const existing = await featureExists(submoduleId, featureName);
  
  if (existing) {
    log(`   ⏭️  Feature existe déjà: ${existing.name} (${existing.id})`, 'yellow');
    return { ...existing, alreadyExists: true };
  }

  const { data, error } = await supabase
    .from('features')
    .insert({
      name: featureName,
      submodule_id: submoduleId
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  log(`   ✅ Feature créée: ${featureName} (${data.id})`, 'green');
  return { ...data, alreadyExists: false };
}

/**
 * Crée le mapping Jira → Supabase
 */
async function createMapping(jiraValue, featureId) {
  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .upsert({
      jira_feature_value: jiraValue,
      feature_id: featureId,
      jira_custom_field_id: 'customfield_10052',
      jira_feature_id: null
    }, {
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
        .eq('jira_feature_value', jiraValue)
        .eq('jira_custom_field_id', 'customfield_10052')
        .single();

      if (existing) {
        log(`   ⏭️  Mapping existe déjà: ${jiraValue} → ${existing.feature_id}`, 'yellow');
        return existing;
      }
    }
    throw error;
  }

  log(`   ✅ Mapping créé: ${jiraValue} → ${data.feature_id}`, 'green');
  return data;
}

/**
 * Processus principal
 */
async function main() {
  log('\n🚀 CRÉATION DES 26 FEATURES RESTANTES', 'cyan');
  log('='.repeat(60));

  const results = {
    created: [],
    skipped: [],
    failed: []
  };

  // Grouper par priorité
  const byPriority = {
    HAUTE: featuresToCreate.filter(f => f.priority === 'HAUTE'),
    MOYENNE: featuresToCreate.filter(f => f.priority === 'MOYENNE'),
    BASSE: featuresToCreate.filter(f => f.priority === 'BASSE')
  };

  for (const [priority, features] of Object.entries(byPriority)) {
    if (features.length === 0) continue;

    logSection(`PRIORITÉ ${priority} (${features.length} features)`);

    for (const featureDef of features) {
      log(`\n🔍 "${featureDef.jiraValue}" (${featureDef.ticketCount} tickets)`, 'blue');

      try {
        // 1. Trouver le module
        const module = await findModule(featureDef.moduleName);
        if (!module) {
          log(`   ❌ Module "${featureDef.moduleName}" non trouvé`, 'red');
          results.failed.push({
            jira: featureDef.jiraValue,
            reason: `Module "${featureDef.moduleName}" non trouvé`
          });
          continue;
        }

        log(`   📁 Module trouvé: ${module.name} (${module.id})`, 'green');

        // 2. Créer ou récupérer le submodule
        const submodule = await getOrCreateSubmodule(module.id, featureDef.submoduleName);
        log(`   📂 Submodule: ${submodule.name} (${submodule.id})`, 'green');

        // 3. Créer la feature
        const feature = await createFeature(submodule.id, featureDef.featureName);
        
        if (feature.alreadyExists) {
          results.skipped.push({
            jira: featureDef.jiraValue,
            reason: 'Feature déjà existante',
            featureId: feature.id
          });
        } else {
          results.created.push({
            jira: featureDef.jiraValue,
            feature: featureDef.featureName,
            featureId: feature.id,
            submodule: submodule.name,
            module: module.name
          });
        }

        // 4. Créer le mapping
        await createMapping(featureDef.jiraValue, feature.id);

        // Pause pour éviter surcharge
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const errorMessage = error?.message || 'Erreur inconnue';
        log(`   ❌ Erreur: ${errorMessage}`, 'red');
        results.failed.push({
          jira: featureDef.jiraValue,
          reason: errorMessage
        });
      }
    }
  }

  // Résumé
  logSection('RÉSUMÉ');

  log(`✅ ${results.created.length} features créées`, 'green');
  results.created.forEach(f => {
    log(`   ✓ ${f.jira} → ${f.feature} (${f.module} → ${f.submodule})`, 'green');
  });

  if (results.skipped.length > 0) {
    log(`\n⏭️  ${results.skipped.length} features ignorées (déjà existantes)`, 'yellow');
    results.skipped.forEach(s => {
      log(`   - ${s.jira}: ${s.reason}`, 'yellow');
    });
  }

  if (results.failed.length > 0) {
    log(`\n⚠️  ${results.failed.length} features non créées:`, 'red');
    results.failed.forEach(f => {
      log(`   - ${f.jira}: ${f.reason}`, 'red');
    });
  }

  log('\n✅ Script terminé', 'green');
  log(`\n💡 Total: ${results.created.length} nouvelles features créées`, 'cyan');
}

// Exécuter
main().catch(console.error);

