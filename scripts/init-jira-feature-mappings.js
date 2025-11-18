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
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraEmail = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

// Debug: Afficher les variables détectées (masquer les valeurs sensibles)
console.log('🔍 Variables d\'environnement détectées:');
console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
console.log(`   - JIRA_URL/JIRA_BASE_URL: ${jiraUrl ? '✅' : '❌'}`);
console.log(`   - JIRA_USERNAME/JIRA_EMAIL/JIRA_API_EMAIL: ${jiraEmail ? '✅' : '❌'}`);
console.log(`   - JIRA_TOKEN/JIRA_API_TOKEN: ${jiraToken ? '✅' : '❌'}`);
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!jiraUrl || !jiraEmail || !jiraToken) {
  console.error('❌ Variables d\'environnement Jira manquantes:');
  console.error('   - JIRA_URL ou JIRA_BASE_URL');
  console.error('   - JIRA_USERNAME, JIRA_EMAIL ou JIRA_API_EMAIL');
  console.error('   - JIRA_TOKEN ou JIRA_API_TOKEN');
  console.error('');
  console.error('💡 Vérifiez que ces variables sont définies dans votre fichier .env.local');
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
  const jiraSearchUrl = `${cleanJiraUrl}/rest/api/3/search/jql`;
  const jiraIssueUrl = `${cleanJiraUrl}/rest/api/3/issue`;

  // Utiliser l'API /rest/api/3/search/jql pour récupérer les IDs, puis /rest/api/3/issue pour les détails
  const jqlQuery = `project = ${projectKey} AND customfield_10052 IS NOT EMPTY`;
  
  log(`🔍 Requête JQL: ${jqlQuery}`, 'blue');
  
  const allFeatures = new Map(); // Map pour éviter les doublons

  try {
    // Étape 1: Récupérer tous les IDs/clés des tickets avec customfield_10052
    let allIssueKeys = [];
    let nextPageToken = null;
    let isLast = false;
    let pageCount = 0;
    const maxResults = 100;

    log('📥 Récupération des IDs/clés des tickets...', 'blue');

    while (!isLast) {
      let url = `${jiraSearchUrl}?jql=${encodeURIComponent(jqlQuery)}&maxResults=${maxResults}`;
      if (nextPageToken) {
        url += `&nextPageToken=${encodeURIComponent(nextPageToken)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${cleanJiraEmail}:${cleanJiraToken}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      pageCount++;

      if (data.issues && Array.isArray(data.issues)) {
        data.issues.forEach(issue => {
          if (issue.id || issue.key) {
            allIssueKeys.push(issue.id || issue.key);
          }
        });
        log(`   ✓ Page ${pageCount}: ${data.issues.length} tickets (Total: ${allIssueKeys.length})...`, 'blue');
      }

      nextPageToken = data.nextPageToken || null;
      isLast = data.isLast === true;
    }

    const total = allIssueKeys.length;
    log(`📊 ${total} tickets trouvés avec customfield_10052`, 'green');

    if (total === 0) {
      log('⚠️  Aucun ticket avec customfield_10052 trouvé', 'yellow');
      return [];
    }

    // Étape 2: Récupérer les détails complets de chaque ticket
    log(`\n📥 Récupération des détails complets pour ${total} tickets...`, 'blue');
    
    const batchSize = 50;
    let fetched = 0;

    for (let i = 0; i < allIssueKeys.length; i += batchSize) {
      const batch = allIssueKeys.slice(i, i + batchSize);

      // Récupérer les détails en parallèle avec retry pour 429
      const promises = batch.map(async (issueKey) => {
        let retries = 3;
        let delay = 1000; // 1 seconde initial
        
        while (retries > 0) {
          try {
            const issueResponse = await fetch(
              `${jiraIssueUrl}/${issueKey}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Basic ${Buffer.from(`${cleanJiraEmail}:${cleanJiraToken}`).toString('base64')}`,
                  'Accept': 'application/json'
                }
              }
            );

            if (issueResponse.ok) {
              return await issueResponse.json();
            } else if (issueResponse.status === 429) {
              // Rate limiting, attendre et réessayer
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue;
              } else {
                console.warn(`   ⚠ Erreur 429 pour ${issueKey} après 3 tentatives`);
                return null;
              }
            } else {
              console.warn(`   ⚠ Erreur pour ${issueKey}: ${issueResponse.status}`);
              return null;
            }
          } catch (error) {
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2;
            } else {
              console.warn(`   ⚠ Erreur pour ${issueKey}:`, error.message);
              return null;
            }
          }
        }
        return null;
      });

      const batchResults = await Promise.all(promises);
      
      for (const issue of batchResults) {
        if (issue && issue.fields) {
          const customField = issue.fields.customfield_10052;
          
          // Debug: Afficher la structure du premier ticket pour comprendre le format
          if (fetched === 0 && customField) {
            log(`\n🔍 Exemple de structure customfield_10052:`, 'blue');
            log(`   ${JSON.stringify(customField, null, 2)}`, 'blue');
          }
          
          if (customField) {
            // Le champ peut être :
            // 1. Un tableau : [{value: "...", id: "..."}, ...]
            // 2. Un objet simple : {value: "...", id: "..."}
            // 3. Une chaîne : "..."
            
            const processFeature = (item) => {
              let featureValue = null;
              let featureId = null;
              
              if (typeof item === 'string') {
                featureValue = item;
              } else if (item && typeof item === 'object') {
                if (item.value) {
                  featureValue = item.value;
                  featureId = item.id || null;
                } else if (item.name) {
                  featureValue = item.name;
                  featureId = item.id || null;
                }
              }
              
              if (featureValue) {
                if (!allFeatures.has(featureValue)) {
                  allFeatures.set(featureValue, {
                    value: featureValue,
                    id: featureId,
                    count: 0
                  });
                }
                allFeatures.get(featureValue).count++;
              }
            };
            
            // Gérer les tableaux
            if (Array.isArray(customField)) {
              customField.forEach(processFeature);
            } else {
              processFeature(customField);
            }
          }
        }
      }

      fetched += batchResults.filter(r => r !== null).length;
      log(`   ✓ Détails récupérés: ${fetched}/${total} tickets...`, 'blue');

      // Pause plus longue pour éviter rate limiting
      if (i + batchSize < allIssueKeys.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    .limit(10);

  if (error) {
    console.error(`Erreur recherche feature "${jiraFeatureValue}":`, error);
    return [];
  }

  // Filtrer par module si disponible
  const filtered = (features || []).filter((f) => {
    if (!moduleName) return true;
    const module = f.submodules?.modules?.name;
    return module && module.toLowerCase().includes(moduleName.toLowerCase());
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

