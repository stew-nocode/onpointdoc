/* eslint-disable no-console */
/**
 * Script pour analyser tous les bugs du projet OBC (OD - ID: 10006) dans Jira
 * 
 * Analyse complète :
 * - Tous les bugs (issuetype = Bug)
 * - Structure des champs (standard + customfields)
 * - Statuts uniques
 * - Priorités uniques
 * - Labels utilisés
 * - Patterns de données
 * 
 * Génère un rapport d'analyse pour optimiser Supabase
 */

import dotenv from 'dotenv';
import path from 'node:path';

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const JIRA_URL = process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '';
const JIRA_USERNAME = process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '';
const JIRA_TOKEN = process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '';

if (!JIRA_URL || !JIRA_USERNAME || !JIRA_TOKEN) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - JIRA_URL ou JIRA_BASE_URL');
  console.error('   - JIRA_USERNAME, JIRA_EMAIL ou JIRA_API_EMAIL');
  console.error('   - JIRA_TOKEN ou JIRA_API_TOKEN');
  process.exit(1);
}

// Nettoyer les valeurs
const cleanUrl = JIRA_URL.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const cleanUsername = JIRA_USERNAME.replace(/^["']|["']$/g, '').trim();
const cleanToken = JIRA_TOKEN.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();

const PROJECT_KEY = 'OD'; // OBC

// Structure pour l'analyse
const analysis = {
  totalBugs: 0,
  statuses: new Set(),
  priorities: new Set(),
  labels: new Set(),
  customFields: new Map(), // customfield_id -> { name, type, values }
  assignees: new Set(),
  reporters: new Set(),
  createdDates: [],
  updatedDates: [],
  resolutions: new Set(),
  components: new Set(),
  fixVersions: new Set(),
  allIssues: []
};

async function fetchAllBugs() {
  try {
    const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');
    const maxResults = 100;
    let allIssueKeys = [];

    console.log('🔍 Récupération de tous les bugs du projet OD...\n');

    // Étape 1: Récupérer tous les IDs/clés des bugs avec /rest/api/3/search/jql
    // Cette API utilise nextPageToken pour la pagination
    const jqlQuery = encodeURIComponent(`project = ${PROJECT_KEY} AND issuetype = Bug`);
    let nextPageToken = null;
    let isLast = false;
    let pageCount = 0;

    // Récupérer tous les IDs/clés par lots avec pagination par token
    while (!isLast) {
      let url = `${cleanUrl}/rest/api/3/search/jql?jql=${jqlQuery}&maxResults=${maxResults}`;
      if (nextPageToken) {
        url += `&nextPageToken=${encodeURIComponent(nextPageToken)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
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
        // Extraire les IDs
        data.issues.forEach(issue => {
          if (issue.id) allIssueKeys.push(issue.id);
        });
        console.log(`   ✓ Page ${pageCount}: ${data.issues.length} bugs (Total: ${allIssueKeys.length})...`);
      }
      
      // Pagination
      nextPageToken = data.nextPageToken || null;
      isLast = data.isLast === true;
    }
    
    console.log(`\n📊 Total de bugs trouvés: ${allIssueKeys.length}\n`);

    console.log(`\n📥 Récupération des détails complets pour ${allIssueKeys.length} bugs...\n`);

    // Étape 2: Récupérer les détails complets de chaque bug
    const allIssues = [];
    const batchSize = 50; // Récupérer par lots de 50 pour éviter les timeouts
    
    for (let i = 0; i < allIssueKeys.length; i += batchSize) {
      const batch = allIssueKeys.slice(i, i + batchSize);
      
      // Récupérer les détails en parallèle
      const promises = batch.map(async (issueKey) => {
        try {
          const issueResponse = await fetch(
            `${cleanUrl}/rest/api/3/issue/${issueKey}?expand=names,schema`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
              }
            }
          );
          
          if (issueResponse.ok) {
            return await issueResponse.json();
          } else {
            console.warn(`   ⚠ Erreur pour ${issueKey}: ${issueResponse.status}`);
            return null;
          }
        } catch (error) {
          console.warn(`   ⚠ Erreur pour ${issueKey}:`, error.message);
          return null;
        }
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(issue => {
        if (issue) allIssues.push(issue);
      });
      
      console.log(`   ✓ Détails récupérés: ${allIssues.length}/${allIssueKeys.length} bugs...`);
    }

    console.log(`\n✅ Tous les bugs récupérés avec détails complets (${allIssues.length})\n`);
    return allIssues;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des bugs:');
    console.error(error.message);
    throw error;
  }
}

function analyzeIssue(issue) {
  analysis.totalBugs++;

  // Vérifier que l'issue a la structure attendue
  if (!issue || !issue.fields) {
    console.warn(`⚠ Issue sans structure fields:`, JSON.stringify(issue, null, 2).substring(0, 200));
    return;
  }

  // Statut
  if (issue.fields.status) {
    analysis.statuses.add(issue.fields.status.name);
  }

  // Priorité
  if (issue.fields.priority) {
    analysis.priorities.add(issue.fields.priority.name);
  }

  // Labels
  if (issue.fields.labels && Array.isArray(issue.fields.labels)) {
    issue.fields.labels.forEach(label => analysis.labels.add(label));
  }

  // Assigné
  if (issue.fields.assignee) {
    analysis.assignees.add(issue.fields.assignee.emailAddress || issue.fields.assignee.displayName);
  }

  // Reporter
  if (issue.fields.reporter) {
    analysis.reporters.add(issue.fields.reporter.emailAddress || issue.fields.reporter.displayName);
  }

  // Résolution
  if (issue.fields.resolution) {
    analysis.resolutions.add(issue.fields.resolution.name);
  }

  // Components
  if (issue.fields.components && Array.isArray(issue.fields.components)) {
    issue.fields.components.forEach(comp => analysis.components.add(comp.name));
  }

  // Fix Versions
  if (issue.fields.fixVersions && Array.isArray(issue.fields.fixVersions)) {
    issue.fields.fixVersions.forEach(version => analysis.fixVersions.add(version.name));
  }

  // Dates
  if (issue.fields.created) {
    analysis.createdDates.push(new Date(issue.fields.created));
  }
  if (issue.fields.updated) {
    analysis.updatedDates.push(new Date(issue.fields.updated));
  }

  // Custom Fields - analyser tous les champs qui commencent par "customfield_"
  Object.keys(issue.fields).forEach(fieldKey => {
    if (fieldKey.startsWith('customfield_')) {
      const fieldValue = issue.fields[fieldKey];
      
      if (!analysis.customFields.has(fieldKey)) {
        analysis.customFields.set(fieldKey, {
          name: fieldKey,
          type: typeof fieldValue,
          values: new Set(),
          isArray: Array.isArray(fieldValue),
          isObject: typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue)
        });
      }

      const fieldInfo = analysis.customFields.get(fieldKey);
      
      if (fieldValue !== null && fieldValue !== undefined) {
        if (Array.isArray(fieldValue)) {
          fieldValue.forEach(v => {
            if (typeof v === 'object' && v !== null) {
              fieldInfo.values.add(JSON.stringify(v));
            } else {
              fieldInfo.values.add(String(v));
            }
          });
        } else if (typeof fieldValue === 'object' && fieldValue !== null) {
          fieldInfo.values.add(JSON.stringify(fieldValue));
        } else {
          fieldInfo.values.add(String(fieldValue));
        }
      }
    }
  });

  // Stocker l'issue complète pour analyse approfondie
  analysis.allIssues.push({
    key: issue.key,
    id: issue.id,
    summary: issue.fields.summary,
    status: issue.fields.status?.name,
    priority: issue.fields.priority?.name,
    labels: issue.fields.labels || [],
    created: issue.fields.created,
    updated: issue.fields.updated
  });
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RAPPORT D\'ANALYSE - BUGS PROJET OBC (OD)');
  console.log('='.repeat(80) + '\n');

  // Statistiques générales
  console.log('📈 STATISTIQUES GÉNÉRALES');
  console.log('-'.repeat(80));
  console.log(`Total de bugs analysés: ${analysis.totalBugs}`);
  
  if (analysis.createdDates.length > 0) {
    const oldest = new Date(Math.min(...analysis.createdDates));
    const newest = new Date(Math.max(...analysis.createdDates));
    console.log(`Période: ${oldest.toLocaleDateString('fr-FR')} → ${newest.toLocaleDateString('fr-FR')}`);
  }
  console.log('');

  // Statuts
  console.log('📋 STATUTS UNIQUES');
  console.log('-'.repeat(80));
  const statusesArray = Array.from(analysis.statuses).sort();
  statusesArray.forEach(status => console.log(`  - ${status}`));
  console.log(`Total: ${statusesArray.length} statuts différents\n`);

  // Priorités
  console.log('⚡ PRIORITÉS UNIQUES');
  console.log('-'.repeat(80));
  const prioritiesArray = Array.from(analysis.priorities).sort();
  prioritiesArray.forEach(priority => console.log(`  - ${priority}`));
  console.log(`Total: ${prioritiesArray.length} priorités différentes\n`);

  // Labels
  console.log('🏷️  LABELS UNIQUES');
  console.log('-'.repeat(80));
  const labelsArray = Array.from(analysis.labels).sort();
  labelsArray.forEach(label => console.log(`  - ${label}`));
  console.log(`Total: ${labelsArray.length} labels différents\n`);

  // Résolutions
  if (analysis.resolutions.size > 0) {
    console.log('✅ RÉSOLUTIONS UNIQUES');
    console.log('-'.repeat(80));
    const resolutionsArray = Array.from(analysis.resolutions).sort();
    resolutionsArray.forEach(resolution => console.log(`  - ${resolution}`));
    console.log(`Total: ${resolutionsArray.length} résolutions différentes\n`);
  }

  // Components
  if (analysis.components.size > 0) {
    console.log('🧩 COMPOSANTS');
    console.log('-'.repeat(80));
    const componentsArray = Array.from(analysis.components).sort();
    componentsArray.forEach(component => console.log(`  - ${component}`));
    console.log(`Total: ${componentsArray.length} composants différents\n`);
  }

  // Fix Versions
  if (analysis.fixVersions.size > 0) {
    console.log('🔖 VERSIONS DE CORRECTION');
    console.log('-'.repeat(80));
    const versionsArray = Array.from(analysis.fixVersions).sort();
    versionsArray.forEach(version => console.log(`  - ${version}`));
    console.log(`Total: ${versionsArray.length} versions différentes\n`);
  }

  // Custom Fields
  if (analysis.customFields.size > 0) {
    console.log('🔧 CHAMPS PERSONNALISÉS (CUSTOMFIELDS)');
    console.log('-'.repeat(80));
    analysis.customFields.forEach((fieldInfo, fieldKey) => {
      console.log(`\n  ${fieldKey}:`);
      console.log(`    Type: ${fieldInfo.type}${fieldInfo.isArray ? ' (Array)' : ''}${fieldInfo.isObject ? ' (Object)' : ''}`);
      console.log(`    Valeurs uniques: ${fieldInfo.values.size}`);
      if (fieldInfo.values.size <= 10) {
        Array.from(fieldInfo.values).slice(0, 10).forEach(val => {
          const displayVal = val.length > 50 ? val.substring(0, 50) + '...' : val;
          console.log(`      - ${displayVal}`);
        });
      } else {
        console.log(`      (Afficher les 10 premières sur ${fieldInfo.values.size})`);
        Array.from(fieldInfo.values).slice(0, 10).forEach(val => {
          const displayVal = val.length > 50 ? val.substring(0, 50) + '...' : val;
          console.log(`      - ${displayVal}`);
        });
      }
    });
    console.log(`\nTotal: ${analysis.customFields.size} champs personnalisés différents\n`);
  } else {
    console.log('🔧 CHAMPS PERSONNALISÉS');
    console.log('-'.repeat(80));
    console.log('Aucun champ personnalisé trouvé.\n');
  }

  // Utilisateurs
  console.log('👥 UTILISATEURS');
  console.log('-'.repeat(80));
  console.log(`Assignés uniques: ${analysis.assignees.size}`);
  console.log(`Reporters uniques: ${analysis.reporters.size}\n`);

  // Patterns de labels (product, module, canal)
  console.log('🎯 PATTERNS DE LABELS (Product/Module/Canal)');
  console.log('-'.repeat(80));
  const productLabels = labelsArray.filter(l => l.startsWith('product:'));
  const moduleLabels = labelsArray.filter(l => l.startsWith('module:'));
  const canalLabels = labelsArray.filter(l => l.startsWith('canal:'));
  
  if (productLabels.length > 0) {
    console.log('\n  Products:');
    productLabels.forEach(l => console.log(`    - ${l.replace('product:', '')}`));
  }
  if (moduleLabels.length > 0) {
    console.log('\n  Modules:');
    moduleLabels.forEach(l => console.log(`    - ${l.replace('module:', '')}`));
  }
  if (canalLabels.length > 0) {
    console.log('\n  Canaux:');
    canalLabels.forEach(l => console.log(`    - ${l.replace('canal:', '')}`));
  }
  console.log('');

  // Recommandations
  console.log('💡 RECOMMANDATIONS POUR SUPABASE');
  console.log('-'.repeat(80));
  console.log('\n1. STATUTS:');
  console.log(`   Créer une table de mapping pour ${statusesArray.length} statuts Jira → Supabase`);
  
  console.log('\n2. PRIORITÉS:');
  console.log(`   Créer une table de mapping pour ${prioritiesArray.length} priorités Jira → Supabase`);
  
  if (analysis.customFields.size > 0) {
    console.log('\n3. CHAMPS PERSONNALISÉS:');
    console.log(`   ${analysis.customFields.size} champs personnalisés détectés - évaluer leur utilité pour Supabase`);
    analysis.customFields.forEach((fieldInfo, fieldKey) => {
      console.log(`   - ${fieldKey}: ${fieldInfo.type} (${fieldInfo.values.size} valeurs uniques)`);
    });
  }
  
  console.log('\n4. INDEX RECOMMANDÉS:');
  console.log('   - tickets.jira_issue_key (déjà existant)');
  console.log('   - tickets.status');
  console.log('   - tickets.priority');
  console.log('   - tickets.created_at');
  console.log('   - tickets.updated_at');
  
  console.log('\n5. COLONNES POTENTIELLES À AJOUTER:');
  if (analysis.resolutions.size > 0) {
    console.log('   - tickets.resolution (TEXT) - pour stocker la résolution Jira');
  }
  if (analysis.components.size > 0) {
    console.log('   - tickets.components (TEXT[] ou JSONB) - pour stocker les composants');
  }
  if (analysis.fixVersions.size > 0) {
    console.log('   - tickets.fix_version (TEXT) - pour stocker la version de correction');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Analyse terminée');
  console.log('='.repeat(80) + '\n');
}

async function main() {
  try {
    console.log('🚀 Démarrage de l\'analyse des bugs Jira - Projet OBC (OD)\n');
    console.log(`   URL: ${cleanUrl}`);
    console.log(`   Projet: ${PROJECT_KEY}\n`);

    // Récupérer tous les bugs
    const issues = await fetchAllBugs();

    // Analyser chaque bug
    console.log('📊 Analyse des bugs...\n');
    issues.forEach(issue => analyzeIssue(issue));

    // Générer le rapport
    generateReport();

    // Sauvegarder un résumé JSON
    const summary = {
      project: { key: PROJECT_KEY },
      totalBugs: analysis.totalBugs,
      statuses: Array.from(analysis.statuses).sort(),
      priorities: Array.from(analysis.priorities).sort(),
      labels: Array.from(analysis.labels).sort(),
      resolutions: Array.from(analysis.resolutions).sort(),
      components: Array.from(analysis.components).sort(),
      fixVersions: Array.from(analysis.fixVersions).sort(),
      customFields: Array.from(analysis.customFields.entries()).map(([key, info]) => ({
        fieldKey: key,
        type: info.type,
        isArray: info.isArray,
        isObject: info.isObject,
        uniqueValuesCount: info.values.size,
        sampleValues: Array.from(info.values).slice(0, 5)
      })),
      stats: {
        uniqueAssignees: analysis.assignees.size,
        uniqueReporters: analysis.reporters.size,
        dateRange: {
          oldest: analysis.createdDates.length > 0 ? new Date(Math.min(...analysis.createdDates)).toISOString() : null,
          newest: analysis.createdDates.length > 0 ? new Date(Math.max(...analysis.createdDates)).toISOString() : null
        }
      }
    };

    const fs = await import('fs');
    const summaryPath = path.resolve(process.cwd(), 'docs/analysis/jira-bugs-od-analysis.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`💾 Résumé sauvegardé dans: ${summaryPath}\n`);

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'analyse:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

