/**
 * Script pour créer les mappings fonctionnalités Jira → Supabase
 * 
 * Ce script utilise le service upsertFeatureMapping pour créer automatiquement
 * les mappings des fonctionnalités identifiées par init-jira-feature-mappings.js
 * 
 * Usage: node scripts/create-jira-feature-mappings.js
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
 * Recherche les features Supabase correspondantes avec recherche flexible
 */
async function findMatchingFeatures(jiraFeatureValue) {
  // Le format Jira est généralement "Module - Feature"
  // Ex: "Finance - Comptabilité Générale"
  const parts = jiraFeatureValue.split(' - ');
  const moduleName = parts[0]?.trim();
  const featureName = parts[1]?.trim() || jiraFeatureValue;

  // Nettoyer le nom de feature pour recherche flexible
  const cleanFeatureName = featureName
    .replace(/[^\w\s]/g, ' ') // Remplacer caractères spéciaux par espaces
    .replace(/\s+/g, ' ') // Normaliser espaces
    .trim();

  // Extraire les mots-clés importants (mots de 4+ caractères)
  const keywords = cleanFeatureName
    .split(' ')
    .filter(w => w.length >= 4)
    .slice(0, 3); // Prendre les 3 premiers mots-clés

  let allFeatures = [];

  // Recherche 1: Recherche exacte par nom de feature
  const { data: exactFeatures, error: exactError } = await supabase
    .from('features')
    .select(`
      id,
      name,
      submodules!inner (
        id,
        name,
        modules!inner (
          id,
          name
        )
      )
    `)
    .ilike('name', `%${featureName}%`)
    .limit(20);

  if (!exactError && exactFeatures) {
    allFeatures.push(...exactFeatures);
  }

  // Recherche 2: Recherche par mots-clés si recherche exacte échoue
  if (allFeatures.length === 0 && keywords.length > 0) {
    for (const keyword of keywords) {
      const { data: keywordFeatures, error: keywordError } = await supabase
        .from('features')
        .select(`
          id,
          name,
          submodules!inner (
            id,
            name,
            modules!inner (
              id,
              name
            )
          )
        `)
        .ilike('name', `%${keyword}%`)
        .limit(10);

      if (!keywordError && keywordFeatures) {
        allFeatures.push(...keywordFeatures);
      }
    }
  }

  // Recherche 3: Recherche par module si disponible
  if (allFeatures.length === 0 && moduleName) {
    const { data: moduleFeatures, error: moduleError } = await supabase
      .from('features')
      .select(`
        id,
        name,
        submodules!inner (
          id,
          name,
          modules!inner (
            id,
            name
          )
        )
      `)
      .ilike('name', `%${moduleName}%`)
      .limit(10);

    if (!moduleError && moduleFeatures) {
      allFeatures.push(...moduleFeatures);
    }
  }

  // Dédupliquer par ID
  const uniqueFeatures = Array.from(
    new Map(allFeatures.map(f => [f.id, f])).values()
  );

  // Filtrer par module si disponible
  const filtered = uniqueFeatures.filter((f) => {
    if (!moduleName) return true;
    const module = f.submodules?.modules?.name;
    return module && (
      module.toLowerCase().includes(moduleName.toLowerCase()) ||
      moduleName.toLowerCase().includes(module.toLowerCase())
    );
  });

  return filtered.map((f) => ({
    id: f.id,
    name: f.name,
    submodule: f.submodules?.name || null,
    module: f.submodules?.modules?.name || null
  }));
}

/**
 * Crée un mapping dans jira_feature_mapping
 */
async function upsertFeatureMapping(jiraFeatureValue, featureId, jiraCustomFieldId = 'customfield_10052', jiraFeatureId = null) {
  if (!jiraFeatureValue || !featureId) {
    console.error('jiraFeatureValue et featureId sont requis');
    return null;
  }

  const mappingData = {
    jira_feature_value: jiraFeatureValue.trim(),
    feature_id: featureId,
    jira_custom_field_id: jiraCustomFieldId,
    updated_at: new Date().toISOString()
  };

  if (jiraFeatureId) {
    mappingData.jira_feature_id = jiraFeatureId;
  }

  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .upsert(mappingData, {
      onConflict: 'jira_feature_value,jira_custom_field_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error(`Erreur lors de la création/mise à jour du mapping: ${error.message}`);
    return null;
  }

  return data;
}

/**
 * Liste des fonctionnalités Jira identifiées avec leurs IDs Jira
 * (Extrait du résultat de init-jira-feature-mappings.js)
 */
const jiraFeatures = [
  { value: 'Finance - Comptabilité Générale', id: '10088', count: 186 },
  { value: 'RH - Gestion employé', id: '10128', count: 172 },
  { value: 'RH - Salaire', id: '10131', count: 159 },
  { value: 'Opérations - Achat', id: '10097', count: 149 },
  { value: 'OBC', id: '10132', count: 124 },
  { value: 'Opérations - Vente', id: '10107', count: 108 },
  { value: 'RH - Documents', id: '10126', count: 107 },
  { value: 'Opérations - Gestion de stock', id: '10100', count: 106 },
  { value: 'CRM - Activités commerciales', id: '10277', count: 101 },
  { value: 'Projets - Gérer mes projets', id: '10120', count: 61 },
  { value: 'RH - Paramétrage', id: '10130', count: 45 },
  { value: 'Finance - Caisse', id: null, count: 42 },
  { value: 'Projets - Dashboard', id: null, count: 38 },
  { value: 'CRM - Offres', id: '10192', count: 34 },
  { value: 'Paramétrage admin. système - Workflow', id: '10116', count: 34 },
  { value: 'Finance - Budget', id: null, count: 32 },
  { value: 'CRM - Analytique', id: null, count: 29 },
  { value: 'Paramétrage admin. système - Paramétrage sur fonctionnalités', id: null, count: 28 },
  { value: 'Opérations - Parc automobile', id: null, count: 26 },
  { value: 'Finance - Impôts et taxes', id: null, count: 20 },
  { value: 'CRM - Clients', id: null, count: 20 },
  { value: 'CRM - Paramétrage', id: null, count: 20 },
  { value: 'Finance - Comptabilité analytique', id: '10150', count: 18 },
  { value: 'Paramétrage admin. système - Autres admin. système', id: null, count: 17 },
  { value: 'Paiement - Centre de paiement', id: null, count: 16 },
  { value: 'Opérations - Production', id: null, count: 16 },
  { value: 'Projets - Feuille de temps', id: null, count: 15 },
  { value: 'Opérations - Immobilisations', id: '10101', count: 14 },
  { value: 'Paramétrage admin. système - Gestion des utilisateurs', id: null, count: 14 },
  { value: 'Finance - Paramétrage', id: null, count: 13 },
  { value: 'Paramétrage admin. système - Dashboard Global', id: null, count: 12 },
  { value: 'Finance - Trésorerie', id: '10095', count: 11 },
  { value: 'RH - Feuille de temps (Pointage)', id: null, count: 11 },
  { value: 'CRM - Pilotage commercial', id: null, count: 9 },
  { value: 'Projets - Note de frais', id: null, count: 8 },
  { value: 'RH - Avance sur mission', id: null, count: 8 },
  { value: 'RH - Dashboard', id: null, count: 6 },
  { value: 'Opérations - Débours', id: null, count: 6 },
  { value: 'Projets - Gérer mes tâches', id: null, count: 5 },
  { value: 'Projets - Paramétrage', id: null, count: 5 },
  { value: 'Opérations - Dashboard', id: '10098', count: 4 },
  { value: 'Finance - Paiement', id: null, count: 4 },
  { value: 'Opérations - Dashboard - Parc Auto', id: null, count: 3 },
  { value: 'Opérations - Paramétrage - Parc Auto', id: null, count: 3 },
  { value: 'Projets - Identification des projets', id: null, count: 3 },
  { value: 'RH - Evaluation', id: null, count: 3 },
  { value: 'Projets - Comptabilité analytique des projets', id: null, count: 2 },
  { value: 'Finance - Dashboard', id: null, count: 2 },
  { value: 'Opérations - Processus métier', id: null, count: 2 },
  { value: 'GED', id: null, count: 2 },
  { value: 'Paramétrage admin. système - Gestion des administrateurs', id: null, count: 1 },
  { value: 'Paiement - Dashboard', id: null, count: 1 },
  { value: 'Paiement - Point de paiement', id: null, count: 1 },
  { value: 'Opérations - Paramétrage', id: null, count: 1 },
  { value: 'RH - Recrutement', id: null, count: 1 },
  { value: 'RH - Gestion de carrière', id: null, count: 1 },
  { value: 'RH - Formation', id: null, count: 1 }
];

/**
 * Règles de mapping intelligentes basées sur les patterns
 */
function getSmartMapping(jiraValue, matches) {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Règles de priorité pour les cas ambigus
  const parts = jiraValue.split(' - ');
  const moduleName = parts[0]?.trim().toLowerCase();
  const featureName = parts[1]?.trim().toLowerCase() || jiraValue.toLowerCase();

  // Prioriser les correspondances exactes de nom
  const exactMatch = matches.find(m => 
    m.name.toLowerCase() === featureName || 
    m.name.toLowerCase().includes(featureName) ||
    featureName.includes(m.name.toLowerCase())
  );
  if (exactMatch) return exactMatch;

  // Prioriser les correspondances de module
  const moduleMatch = matches.find(m => 
    m.module?.toLowerCase().includes(moduleName) ||
    moduleName.includes(m.module?.toLowerCase())
  );
  if (moduleMatch) return moduleMatch;

  // Sinon, prendre la première
  return matches[0];
}

/**
 * Processus principal
 */
async function main() {
  log('\n🚀 CRÉATION DES MAPPINGS FONCTIONNALITÉS JIRA → SUPABASE', 'cyan');
  log('='.repeat(60));

  const results = {
    created: [],
    skipped: [],
    failed: []
  };

  logSection('ÉTAPE 1: Recherche et création des mappings');

  for (const jiraFeature of jiraFeatures) {
    log(`\n🔍 "${jiraFeature.value}" (${jiraFeature.count} tickets)`, 'blue');

    // Vérifier si le mapping existe déjà
    const { data: existing } = await supabase
      .from('jira_feature_mapping')
      .select('id, feature_id')
      .eq('jira_feature_value', jiraFeature.value)
      .eq('jira_custom_field_id', 'customfield_10052')
      .single();

    if (existing && existing.feature_id) {
      log(`   ⏭️  Mapping déjà existant, ignoré`, 'yellow');
      results.skipped.push({ jira: jiraFeature.value, reason: 'Déjà existant' });
      continue;
    }

    // Rechercher les correspondances
    const matches = await findMatchingFeatures(jiraFeature.value);

    if (matches.length === 0) {
      log(`   ⚠️  Aucune correspondance trouvée`, 'yellow');
      results.failed.push({ jira: jiraFeature.value, reason: 'Aucune correspondance' });
    } else {
      // Utiliser le mapping intelligent
      const selectedMatch = getSmartMapping(jiraFeature.value, matches);

      if (selectedMatch) {
        log(`   ✅ Correspondance sélectionnée: ${selectedMatch.name} (${selectedMatch.module} → ${selectedMatch.submodule})`, 'green');
        
        const mapping = await upsertFeatureMapping(
          jiraFeature.value,
          selectedMatch.id,
          'customfield_10052',
          jiraFeature.id
        );

        if (mapping) {
          results.created.push({
            jira: jiraFeature.value,
            supabase: selectedMatch.name,
            feature_id: selectedMatch.id
          });
          log(`   ✅ Mapping créé avec succès`, 'green');
        } else {
          results.failed.push({ jira: jiraFeature.value, reason: 'Erreur création' });
          log(`   ❌ Erreur lors de la création du mapping`, 'red');
        }
      } else {
        results.failed.push({ jira: jiraFeature.value, reason: 'Aucune correspondance valide' });
      }

      // Afficher les autres options si plusieurs correspondances
      if (matches.length > 1) {
        log(`   ℹ️  ${matches.length - 1} autre(s) option(s) disponible(s):`, 'blue');
        matches.slice(1, 4).forEach((m, i) => {
          log(`      ${i + 2}. ${m.name} (${m.module} → ${m.submodule})`, 'blue');
        });
      }
    }

    // Pause pour éviter surcharge
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Résumé
  logSection('RÉSUMÉ');

  log(`✅ ${results.created.length} mappings créés`, 'green');
  results.created.forEach(m => {
    log(`   ✓ ${m.jira} → ${m.supabase}`, 'green');
  });

  if (results.skipped.length > 0) {
    log(`\n⏭️  ${results.skipped.length} mappings ignorés (déjà existants)`, 'yellow');
  }

  if (results.failed.length > 0) {
    log(`\n⚠️  ${results.failed.length} fonctionnalités sans mapping:`, 'yellow');
    results.failed.forEach(f => {
      log(`   - ${f.jira} (${f.reason})`, 'yellow');
    });
  }

  log('\n✅ Script terminé', 'green');
}

// Exécuter
main().catch(console.error);

