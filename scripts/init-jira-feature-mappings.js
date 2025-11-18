/**
 * Script d'initialisation des mappings fonctionnalités Jira → Supabase
 * 
 * Ce script :
 * 1. Analyse les tickets Jira pour extraire toutes les valeurs de customfield_10052
 * 2. Recherche les features correspondantes dans Supabase
 * 3. Propose des mappings automatiques basés sur le nom
 * 4. Crée les mappings dans jira_feature_mapping
 * 
 * Usage: node scripts/init-jira-feature-mappings.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraEmail = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!jiraUrl || !jiraEmail || !jiraToken) {
  console.error('❌ Variables d\'environnement Jira manquantes:');
  console.error('   - JIRA_URL ou JIRA_BASE_URL');
  console.error('   - JIRA_USERNAME ou JIRA_EMAIL');
  console.error('   - JIRA_TOKEN ou JIRA_API_TOKEN');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Nettoyer les variables d'environnement
const cleanEnv = (value) => {
  if (!value) return null;
  return value.toString().trim().replace(/^["']|["']$/g, '').replace(/\n/g, '');
};

const cleanJiraUrl = cleanEnv(jiraUrl);
const cleanJiraEmail = cleanEnv(jiraEmail);
const cleanJiraToken = cleanEnv(jiraToken);

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
 * Récupère toutes les valeurs uniques de customfield_10052 depuis Jira
 */
async function fetchJiraFeatureValues() {
  logSection('ÉTAPE 1: Récupération des fonctionnalités Jira');

  const projectKey = 'OD'; // Projet OD
  const jiraApiUrl = `${cleanJiraUrl}/rest/api/3/search/jql`;

  const jqlQuery = `project = ${projectKey} AND customfield_10052 IS NOT EMPTY`;
  
  const allFeatures = new Map(); // Map pour éviter les doublons

  try {
    // Première requête pour obtenir le total
    const firstResponse = await fetch(
      `${jiraApiUrl}?jql=${encodeURIComponent(jqlQuery)}&maxResults=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${cleanJiraEmail}:${cleanJiraToken}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!firstResponse.ok) {
      const errorText = await firstResponse.text();
      throw new Error(`Erreur HTTP ${firstResponse.status}: ${errorText}`);
    }

    const firstData = await firstResponse.json();
    const total = firstData.total || 0;

    log(`📊 ${total} tickets trouvés avec customfield_10052`, 'blue');

    if (total === 0) {
      log('⚠️  Aucun ticket avec fonctionnalité trouvé', 'yellow');
      return [];
    }

    // Récupérer tous les tickets par lots
    let startAt = 0;
    const maxResults = 100;
    let fetched = 0;

    while (startAt < total) {
      const response = await fetch(
        `${jiraApiUrl}?jql=${encodeURIComponent(jqlQuery)}&maxResults=${maxResults}&startAt=${startAt}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${cleanJiraEmail}:${cleanJiraToken}`).toString('base64')}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const issues = data.issues || [];

      for (const issue of issues) {
        const customField = issue.fields?.customfield_10052;
        if (customField && customField.value) {
          const featureValue = customField.value;
          const featureId = customField.id;

          if (!allFeatures.has(featureValue)) {
            allFeatures.set(featureValue, {
              value: featureValue,
              id: featureId,
              count: 0
            });
          }
          allFeatures.get(featureValue).count++;
        }
      }

      fetched += issues.length;
      log(`   Récupéré ${fetched}/${total} tickets...`, 'blue');
      startAt += maxResults;

      // Pause pour éviter rate limiting
      if (startAt < total) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const featuresArray = Array.from(allFeatures.values()).sort((a, b) => b.count - a.count);
    log(`✅ ${featuresArray.length} fonctionnalités uniques trouvées`, 'green');

    return featuresArray;
  } catch (error) {
    log(`❌ Erreur lors de la récupération des fonctionnalités Jira: ${error.message}`, 'red');
    console.error(error);
    return [];
  }
}

/**
 * Recherche les features Supabase correspondantes
 */
async function findMatchingFeatures(jiraFeatureValue) {
  // Le format Jira est généralement "Module - Feature"
  // Ex: "Finance - Comptabilité Générale"
  const parts = jiraFeatureValue.split(' - ');
  const moduleName = parts[0]?.trim();
  const featureName = parts[1]?.trim() || jiraFeatureValue;

  // Recherche par nom de feature
  const { data: features, error } = await supabase
    .from('features')
    .select(`
      id,
      name,
      sub_modules!inner (
        id,
        name,
        modules!inner (
          id,
          name
        )
      )
    `)
    .ilike('name', `%${featureName}%`)
    .limit(10);

  if (error) {
    console.error(`Erreur recherche feature "${jiraFeatureValue}":`, error);
    return [];
  }

  // Filtrer par module si disponible
  const filtered = (features || []).filter((f: any) => {
    if (!moduleName) return true;
    const module = f.sub_modules?.modules?.name;
    return module && module.toLowerCase().includes(moduleName.toLowerCase());
  });

  return filtered.map((f: any) => ({
    id: f.id,
    name: f.name,
    submodule: f.sub_modules?.name || null,
    module: f.sub_modules?.modules?.name || null
  }));
}

/**
 * Crée un mapping dans jira_feature_mapping
 */
async function createMapping(jiraFeatureValue, featureId, jiraFeatureId) {
  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .upsert({
      jira_feature_value: jiraFeatureValue,
      feature_id: featureId,
      jira_custom_field_id: 'customfield_10052',
      jira_feature_id: jiraFeatureId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'jira_feature_value,jira_custom_field_id'
    })
    .select()
    .single();

  if (error) {
    console.error(`Erreur création mapping "${jiraFeatureValue}":`, error);
    return null;
  }

  return data;
}

/**
 * Processus principal
 */
async function main() {
  log('\n🚀 INITIALISATION DES MAPPINGS FONCTIONNALITÉS JIRA → SUPABASE', 'cyan');
  log('='.repeat(60));

  // 1. Récupérer les fonctionnalités Jira
  const jiraFeatures = await fetchJiraFeatureValues();

  if (jiraFeatures.length === 0) {
    log('❌ Aucune fonctionnalité à mapper', 'red');
    process.exit(1);
  }

  logSection('ÉTAPE 2: Recherche des correspondances Supabase');

  const mappings = [];
  const unmapped = [];

  for (const jiraFeature of jiraFeatures) {
    log(`\n🔍 "${jiraFeature.value}" (${jiraFeature.count} tickets)`, 'blue');

    const matches = await findMatchingFeatures(jiraFeature.value);

    if (matches.length === 0) {
      log(`   ⚠️  Aucune correspondance trouvée`, 'yellow');
      unmapped.push(jiraFeature);
    } else if (matches.length === 1) {
      // Correspondance unique, créer le mapping automatiquement
      const match = matches[0];
      log(`   ✅ Correspondance unique: ${match.name} (${match.module} → ${match.submodule})`, 'green');
      
      const mapping = await createMapping(
        jiraFeature.value,
        match.id,
        jiraFeature.id
      );

      if (mapping) {
        mappings.push({ jira: jiraFeature.value, supabase: match.name, auto: true });
      }
    } else {
      // Plusieurs correspondances, afficher les options
      log(`   ⚠️  ${matches.length} correspondances trouvées:`, 'yellow');
      matches.forEach((match, index) => {
        log(`      ${index + 1}. ${match.name} (${match.module} → ${match.submodule})`, 'blue');
      });
      log(`   ⚠️  Mapping non créé automatiquement (nécessite validation manuelle)`, 'yellow');
      unmapped.push({ ...jiraFeature, matches });
    }

    // Pause pour éviter surcharge
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Résumé
  logSection('RÉSUMÉ');

  log(`✅ ${mappings.length} mappings créés automatiquement`, 'green');
  mappings.forEach(m => {
    log(`   ✓ ${m.jira} → ${m.supabase}`, 'green');
  });

  if (unmapped.length > 0) {
    log(`\n⚠️  ${unmapped.length} fonctionnalités nécessitent une validation manuelle:`, 'yellow');
    unmapped.forEach(u => {
      log(`   - ${u.value} (${u.count} tickets)`, 'yellow');
      if (u.matches && u.matches.length > 0) {
        u.matches.forEach((m, i) => {
          log(`     Option ${i + 1}: ${m.name} (${m.module} → ${m.submodule})`, 'blue');
        });
      }
    });
  }

  log('\n✅ Script terminé', 'green');
  log(`\n💡 Pour créer les mappings manuellement, utilisez:`);
  log(`   await upsertFeatureMapping("Jira Value", "feature-uuid", "customfield_10052", "jira-id")`, 'blue');
}

// Exécuter
main().catch(console.error);

