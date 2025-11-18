/**
 * Script pour créer les features manquantes prioritaires dans Supabase
 * 
 * Ce script crée les features nécessaires pour les mappings Jira → Supabase
 * en les associant aux submodules existants.
 * 
 * Usage: node scripts/create-missing-features.js
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
 * Récupère la structure complète des submodules
 */
async function getSubmodulesStructure() {
  const { data, error } = await supabase
    .from('submodules')
    .select(`
      id,
      name,
      modules!inner (
        id,
        name,
        products!inner (
          id,
          name
        )
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des submodules:', error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    module: s.modules?.name || null,
    product: s.modules?.products?.name || null
  }));
}

/**
 * Recherche un submodule par nom (flexible)
 */
function findSubmodule(submodules, searchName) {
  const searchLower = searchName.toLowerCase().trim();
  
  // Recherche exacte
  let match = submodules.find(s => 
    s.name.toLowerCase() === searchLower
  );
  
  if (match) return match;
  
  // Recherche partielle
  match = submodules.find(s => 
    s.name.toLowerCase().includes(searchLower) ||
    searchLower.includes(s.name.toLowerCase())
  );
  
  if (match) return match;
  
  // Recherche par mots-clés
  const keywords = searchLower.split(' ').filter(w => w.length >= 4);
  for (const keyword of keywords) {
    match = submodules.find(s => 
      s.name.toLowerCase().includes(keyword)
    );
    if (match) return match;
  }
  
  return null;
}

/**
 * Crée une feature dans Supabase
 */
async function createFeature(name, submoduleId, jiraFeatureId = null) {
  const featureData = {
    name: name.trim(),
    submodule_id: submoduleId
  };

  if (jiraFeatureId) {
    featureData.jira_feature_id = parseInt(jiraFeatureId, 10);
  }

  const { data, error } = await supabase
    .from('features')
    .insert(featureData)
    .select()
    .single();

  if (error) {
    // Si erreur de doublon, récupérer la feature existante
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('features')
        .select('id, name')
        .eq('name', name.trim())
        .eq('submodule_id', submoduleId)
        .single();
      
      if (existing) {
        return { ...existing, alreadyExists: true };
      }
    }
    throw error;
  }

  return { ...data, alreadyExists: false };
}

/**
 * Liste des features prioritaires à créer
 * Format: { jiraName, featureName, submoduleSearch, jiraId, priority }
 */
const featuresToCreate = [
  // PRIORITÉ HAUTE (100+ tickets)
  { 
    jiraName: 'OBC', 
    featureName: 'OBC', 
    submoduleSearch: 'OBC', 
    jiraId: '10132', 
    priority: 'HAUTE',
    count: 124,
    note: 'Peut nécessiter un submodule dédié ou être une feature générique'
  },
  { 
    jiraName: 'RH - Documents', 
    featureName: 'Documents', 
    submoduleSearch: 'Documents', 
    jiraId: null, 
    priority: 'HAUTE',
    count: 107,
    moduleHint: 'RH'
  },
  { 
    jiraName: 'CRM - Activités commerciales', 
    featureName: 'Activités commerciales', 
    submoduleSearch: 'Activités commerciales', 
    jiraId: '10277', 
    priority: 'HAUTE',
    count: 101,
    moduleHint: 'CRM'
  },
  { 
    jiraName: 'Projets - Gérer mes projets', 
    featureName: 'Gérer mes projets', 
    submoduleSearch: 'Gérer mes projets', 
    jiraId: '10120', 
    priority: 'MOYENNE',
    count: 61,
    moduleHint: 'Projets'
  },
  { 
    jiraName: 'Projets - Dashboard', 
    featureName: 'Dashboard', 
    submoduleSearch: 'Projets', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 38,
    moduleHint: 'Projets',
    note: 'Créer dans un submodule Projets existant'
  },
  { 
    jiraName: 'CRM - Offres', 
    featureName: 'Offres', 
    submoduleSearch: 'Offres', 
    jiraId: '10192', 
    priority: 'MOYENNE',
    count: 34,
    moduleHint: 'CRM'
  },
  { 
    jiraName: 'Finance - Budget', 
    featureName: 'Budget', 
    submoduleSearch: 'Budget', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 32,
    moduleHint: 'Finance'
  },
  { 
    jiraName: 'CRM - Analytique', 
    featureName: 'Analytique', 
    submoduleSearch: 'Analytique', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 29,
    moduleHint: 'CRM'
  },
  { 
    jiraName: 'Finance - Impôts et taxes', 
    featureName: 'Impôts et taxes', 
    submoduleSearch: 'Impôts et taxes', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 20,
    moduleHint: 'Finance'
  },
  { 
    jiraName: 'CRM - Clients', 
    featureName: 'Clients', 
    submoduleSearch: 'Clients', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 20,
    moduleHint: 'CRM'
  },
  { 
    jiraName: 'CRM - Paramétrage', 
    featureName: 'Paramétrage', 
    submoduleSearch: 'Paramétrage', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 20,
    moduleHint: 'CRM',
    note: 'Créer dans un submodule CRM existant'
  },
  { 
    jiraName: 'Finance - Trésorerie', 
    featureName: 'Trésorerie', 
    submoduleSearch: 'Trésorerie', 
    jiraId: '10095', 
    priority: 'MOYENNE',
    count: 11,
    moduleHint: 'Finance'
  },
  { 
    jiraName: 'CRM - Pilotage commercial', 
    featureName: 'Pilotage commercial', 
    submoduleSearch: 'Pilotage commercial', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 9,
    moduleHint: 'CRM'
  },
  { 
    jiraName: 'Projets - Feuille de temps', 
    featureName: 'Feuille de temps', 
    submoduleSearch: 'Feuille de temps', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 15,
    moduleHint: 'Projets'
  },
  { 
    jiraName: 'Projets - Note de frais', 
    featureName: 'Note de frais', 
    submoduleSearch: 'Note de frais', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 8,
    moduleHint: 'Projets'
  },
  { 
    jiraName: 'Projets - Gérer mes tâches', 
    featureName: 'Gérer mes tâches', 
    submoduleSearch: 'Gérer mes tâches', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 5,
    moduleHint: 'Projets'
  },
  { 
    jiraName: 'Projets - Paramétrage', 
    featureName: 'Paramétrage', 
    submoduleSearch: 'Paramétrage', 
    jiraId: null, 
    priority: 'MOYENNE',
    count: 5,
    moduleHint: 'Projets',
    note: 'Créer dans un submodule Projets existant'
  }
];

/**
 * Processus principal
 */
async function main() {
  log('\n🚀 CRÉATION DES FEATURES MANQUANTES PRIORITAIRES', 'cyan');
  log('='.repeat(60));

  // 1. Récupérer la structure des submodules
  logSection('ÉTAPE 1: Récupération de la structure des submodules');
  
  const submodules = await getSubmodulesStructure();
  log(`✅ ${submodules.length} submodules trouvés`, 'green');
  
  // Afficher quelques exemples
  log('\nExemples de submodules disponibles:', 'blue');
  submodules.slice(0, 5).forEach(s => {
    log(`   - ${s.name} (${s.module} → ${s.product})`, 'blue');
  });

  // 2. Créer les features
  logSection('ÉTAPE 2: Création des features');

  const results = {
    created: [],
    skipped: [],
    failed: []
  };

  for (const featureDef of featuresToCreate) {
    log(`\n🔍 "${featureDef.jiraName}" (${featureDef.count} tickets, ${featureDef.priority})`, 'blue');

    // Vérifier si la feature existe déjà
    const { data: existing } = await supabase
      .from('features')
      .select('id, name')
      .ilike('name', `%${featureDef.featureName}%`)
      .limit(5);

    if (existing && existing.length > 0) {
      // Filtrer par submodule si moduleHint fourni
      let matchingFeature = null;
      if (featureDef.moduleHint && existing.length > 1) {
        // Récupérer les submodules des features existantes
        const featureIds = existing.map(f => f.id);
        const { data: featuresWithSubmodules } = await supabase
          .from('features')
          .select(`
            id,
            name,
            submodules!inner (
              id,
              name,
              modules!inner (
                name
              )
            )
          `)
          .in('id', featureIds);

        matchingFeature = (featuresWithSubmodules || []).find((f) => 
          f.submodules?.modules?.name?.toLowerCase().includes(featureDef.moduleHint?.toLowerCase() || '')
        );
      }

      if (matchingFeature || (existing.length === 1 && !featureDef.moduleHint)) {
        const feature = matchingFeature || existing[0];
        log(`   ⏭️  Feature similaire déjà existante: "${feature.name}"`, 'yellow');
        results.skipped.push({ 
          jira: featureDef.jiraName, 
          reason: `Feature "${feature.name}" existe déjà`,
          existingId: feature.id
        });
        continue;
      }
    }

    // Trouver le submodule approprié
    let submodule = findSubmodule(submodules, featureDef.submoduleSearch);
    
    // Si moduleHint fourni et submodule non trouvé, chercher dans le module
    if (!submodule && featureDef.moduleHint) {
      const moduleSubmodules = submodules.filter(s => 
        s.module?.toLowerCase().includes(featureDef.moduleHint?.toLowerCase() || '')
      );
      
      if (moduleSubmodules.length > 0) {
        // Prendre le premier submodule du module
        submodule = moduleSubmodules[0];
        log(`   ℹ️  Submodule trouvé via module: ${submodule.name} (${submodule.module})`, 'blue');
      }
    }

    if (!submodule) {
      log(`   ⚠️  Submodule non trouvé pour "${featureDef.submoduleSearch}"`, 'yellow');
      if (featureDef.note) {
        log(`   💡 Note: ${featureDef.note}`, 'blue');
      }
      results.failed.push({ 
        jira: featureDef.jiraName, 
        reason: `Submodule "${featureDef.submoduleSearch}" non trouvé`
      });
      continue;
    }

    log(`   📍 Submodule sélectionné: ${submodule.name} (${submodule.module} → ${submodule.product})`, 'green');

    // Créer la feature
    try {
      const feature = await createFeature(
        featureDef.featureName,
        submodule.id,
        featureDef.jiraFeatureId
      );

      if (feature.alreadyExists) {
        log(`   ⏭️  Feature "${featureDef.featureName}" existe déjà dans ce submodule`, 'yellow');
        results.skipped.push({ 
          jira: featureDef.jiraName, 
          reason: 'Déjà existante',
          existingId: feature.id
        });
      } else {
        log(`   ✅ Feature créée: "${featureDef.featureName}" (${feature.id})`, 'green');
        results.created.push({
          jira: featureDef.jiraName,
          feature: featureDef.featureName,
          featureId: feature.id,
          submodule: submodule.name
        });
      }
    } catch (error) {
      const errorMessage = error?.message || 'Erreur inconnue';
      log(`   ❌ Erreur: ${errorMessage}`, 'red');
      results.failed.push({ 
        jira: featureDef.jiraName, 
        reason: errorMessage
      });
    }

    // Pause pour éviter surcharge
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Résumé
  logSection('RÉSUMÉ');

  log(`✅ ${results.created.length} features créées`, 'green');
  results.created.forEach(f => {
    log(`   ✓ ${f.jira} → ${f.feature} (${f.submodule})`, 'green');
  });

  if (results.skipped.length > 0) {
    log(`\n⏭️  ${results.skipped.length} features ignorées (déjà existantes)`, 'yellow');
    results.skipped.forEach(s => {
      log(`   - ${s.jira}: ${s.reason}`, 'yellow');
    });
  }

  if (results.failed.length > 0) {
    log(`\n⚠️  ${results.failed.length} features non créées:`, 'yellow');
    results.failed.forEach(f => {
      log(`   - ${f.jira}: ${f.reason}`, 'yellow');
    });
  }

  log('\n✅ Script terminé', 'green');
  log(`\n💡 Prochaine étape: Relancer create-jira-feature-mappings.js pour créer les mappings`, 'blue');
}

// Exécuter
main().catch(console.error);

