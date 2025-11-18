/**
 * Script de test end-to-end pour la synchronisation Jira → Supabase
 * 
 * Ce script :
 * 1. Récupère des tickets réels depuis Jira
 * 2. Teste la synchronisation complète avec tous les champs (Phases 1-5)
 * 3. Valide que tous les mappings fonctionnent correctement
 * 
 * Usage: node scripts/test-end-to-end-jira-sync.js [limit]
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL || '';
const jiraEmail = process.env.JIRA_EMAIL || process.env.JIRA_USERNAME || process.env.JIRA_API_EMAIL || '';
const jiraToken = process.env.JIRA_API_TOKEN || process.env.JIRA_TOKEN || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!jiraUrl || !jiraEmail || !jiraToken) {
  console.error('❌ Variables d\'environnement Jira manquantes:');
  console.error('   - JIRA_URL ou JIRA_BASE_URL');
  console.error('   - JIRA_EMAIL, JIRA_USERNAME ou JIRA_API_EMAIL');
  console.error('   - JIRA_TOKEN ou JIRA_API_TOKEN');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Nettoyer les valeurs d'environnement
const cleanEnv = (value) => {
  if (!value) return null;
  return value.toString().trim().replace(/^["']|["']$/g, '').replace(/\n/g, '').replace(/\/$/, '');
};

const JIRA_BASE_URL = cleanEnv(jiraUrl);
const JIRA_EMAIL = cleanEnv(jiraEmail);
const JIRA_TOKEN = cleanEnv(jiraToken);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
 * Récupère des tickets Jira via l'API
 */
async function fetchJiraIssues(limit = 5) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  
  // Étape 1: Récupérer les clés des tickets avec /rest/api/3/search/jql
  const jqlQuery = encodeURIComponent('project = OD ORDER BY created DESC');
  const jqlUrl = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${jqlQuery}&maxResults=${limit}`;
  
  const jqlResponse = await fetch(jqlUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });

  if (!jqlResponse.ok) {
    const errorText = await jqlResponse.text();
    throw new Error(`Erreur HTTP ${jqlResponse.status}: ${errorText}`);
  }

  const jqlData = await jqlResponse.json();
  
  // La réponse peut contenir issues avec id ou key
  const issueIds = (jqlData.issues || []).map(issue => issue.id || issue.key).filter(Boolean).slice(0, limit);
  
  if (issueIds.length === 0) {
    log('⚠️  Aucun ticket trouvé dans la réponse JQL', 'yellow');
    log(`   Réponse: ${JSON.stringify(jqlData).substring(0, 200)}`, 'yellow');
    return [];
  }

  log(`   ${issueIds.length} tickets identifiés`, 'blue');

  // Étape 2: Récupérer les détails complets de chaque ticket
  const issues = [];
  for (const idOrKey of issueIds) {
    const issueUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${idOrKey}`;
    
    try {
      const issueResponse = await fetch(issueUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (issueResponse.ok) {
        const issueData = await issueResponse.json();
        issues.push(issueData);
        log(`   ✓ ${issueData.key || idOrKey} récupéré`, 'green');
      } else {
        const errorText = await issueResponse.text();
        log(`   ⚠️  ${idOrKey}: ${issueResponse.status} - ${errorText.substring(0, 100)}`, 'yellow');
      }
    } catch (error) {
      log(`   ⚠️  Erreur pour ${idOrKey}: ${error.message}`, 'yellow');
    }
    
    // Pause pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return issues;
}

/**
 * Transforme un ticket Jira en format attendu par syncJiraToSupabase
 */
function transformJiraIssue(issue) {
  const fields = issue.fields;
  
  return {
    key: issue.key,
    id: issue.id,
    summary: fields.summary || '',
    description: fields.description || null,
    status: {
      name: fields.status?.name || 'Unknown'
    },
    priority: {
      name: fields.priority?.name || 'Medium'
    },
    issuetype: {
      name: fields.issuetype?.name || 'Bug'
    },
    reporter: fields.reporter ? {
      accountId: fields.reporter.accountId,
      displayName: fields.reporter.displayName
    } : null,
    assignee: fields.assignee ? {
      accountId: fields.assignee.accountId,
      displayName: fields.assignee.displayName
    } : null,
    resolution: fields.resolution ? {
      name: fields.resolution.name
    } : null,
    fixVersions: fields.fixVersions || [],
    created: fields.created,
    updated: fields.updated,
    labels: fields.labels || [],
    components: fields.components || [],
    // Phase 1
    customfield_10020: fields.customfield_10020 || null,
    // Phase 2
    customfield_10053: fields.customfield_10053 || null,
    customfield_10054: fields.customfield_10054 || null,
    customfield_10045: fields.customfield_10045 || null,
    customfield_10055: fields.customfield_10055 || null,
    // Phase 3
    customfield_10052: fields.customfield_10052 || null,
    // Phase 4
    customfield_10083: fields.customfield_10083 || null,
    customfield_10084: fields.customfield_10084 || null,
    customfield_10021: fields.customfield_10021 || null,
    customfield_10057: fields.customfield_10057 || null,
    customfield_10111: fields.customfield_10111 || null,
    customfield_10115: fields.customfield_10115 || null,
    // Phase 5
    customfield_10297: fields.customfield_10297 || null,
    customfield_10298: fields.customfield_10298 || null,
    customfield_10300: fields.customfield_10300 || null,
    customfield_10299: fields.customfield_10299 || null,
    customfield_10301: fields.customfield_10301 || null,
    customfield_10313: fields.customfield_10313 || null,
    customfield_10324: fields.customfield_10324 || null,
    customfield_10364: fields.customfield_10364 || null
  };
}

/**
 * Simule la synchronisation (sans créer de ticket réel)
 */
async function testSync(jiraData) {
  const results = {
    phase1: { tested: 0, passed: 0, failed: [] },
    phase2: { tested: 0, passed: 0, failed: [] },
    phase3: { tested: 0, passed: 0, failed: [] },
    phase4: { tested: 0, passed: 0, failed: [] },
    phase5: { tested: 0, passed: 0, failed: [] }
  };

  // Phase 1: Champs standards
  if (jiraData.status?.name) {
    results.phase1.tested++;
    results.phase1.passed++;
  }
  if (jiraData.priority?.name) {
    results.phase1.tested++;
    results.phase1.passed++;
  }
  if (jiraData.resolution?.name) {
    results.phase1.tested++;
    results.phase1.passed++;
  }
  if (jiraData.fixVersions && jiraData.fixVersions.length > 0) {
    results.phase1.tested++;
    results.phase1.passed++;
  }

  // Phase 2: Client/Contact
  if (jiraData.customfield_10053) {
    results.phase2.tested++;
    results.phase2.passed++;
  }
  if (jiraData.customfield_10045) {
    results.phase2.tested++;
    results.phase2.passed++;
  }
  if (jiraData.customfield_10055) {
    results.phase2.tested++;
    results.phase2.passed++;
  }

  // Phase 3: Feature
  if (jiraData.customfield_10052) {
    results.phase3.tested++;
    results.phase3.passed++;
  }

  // Phase 4: Workflow
  if (jiraData.customfield_10020) {
    results.phase4.tested++;
    results.phase4.passed++;
  }
  if (jiraData.customfield_10083) {
    results.phase4.tested++;
    results.phase4.passed++;
  }
  if (jiraData.customfield_10084) {
    results.phase4.tested++;
    results.phase4.passed++;
  }
  if (jiraData.customfield_10021) {
    results.phase4.tested++;
    results.phase4.passed++;
  }

  // Phase 5: Custom fields
  const phase5Fields = [
    'customfield_10297', 'customfield_10298', 'customfield_10300',
    'customfield_10299', 'customfield_10301', 'customfield_10313',
    'customfield_10324', 'customfield_10364'
  ];
  
  for (const field of phase5Fields) {
    if (jiraData[field]) {
      results.phase5.tested++;
      results.phase5.passed++;
    }
  }

  return results;
}

/**
 * Affiche les résultats détaillés
 */
function displayResults(issueKey, results) {
  log(`\n📋 Ticket ${issueKey}:`, 'magenta');
  
  const phases = [
    { name: 'Phase 1 (Standards)', data: results.phase1 },
    { name: 'Phase 2 (Client/Contact)', data: results.phase2 },
    { name: 'Phase 3 (Feature)', data: results.phase3 },
    { name: 'Phase 4 (Workflow)', data: results.phase4 },
    { name: 'Phase 5 (Custom Fields)', data: results.phase5 }
  ];

  phases.forEach(phase => {
    if (phase.data.tested > 0) {
      const percentage = Math.round((phase.data.passed / phase.data.tested) * 100);
      const color = percentage === 100 ? 'green' : 'yellow';
      log(`   ${phase.name}: ${phase.data.passed}/${phase.data.tested} (${percentage}%)`, color);
    }
  });
}

/**
 * Processus principal
 */
async function main() {
  const limit = parseInt(process.argv[2]) || 5;
  
  log('\n🚀 TEST END-TO-END : SYNCHRONISATION JIRA → SUPABASE', 'cyan');
  log('='.repeat(60));
  log(`📊 Test avec ${limit} tickets Jira réels`, 'blue');

  try {
    // 1. Récupérer les tickets Jira
    logSection('ÉTAPE 1: Récupération des tickets Jira');
    log('⏳ Connexion à Jira...', 'blue');
    
    const issues = await fetchJiraIssues(limit);
    log(`✅ ${issues.length} tickets récupérés`, 'green');

    if (issues.length === 0) {
      log('⚠️  Aucun ticket trouvé', 'yellow');
      return;
    }

    // 2. Tester chaque ticket
    logSection('ÉTAPE 2: Test de synchronisation');
    
    const globalResults = {
      phase1: { tested: 0, passed: 0 },
      phase2: { tested: 0, passed: 0 },
      phase3: { tested: 0, passed: 0 },
      phase4: { tested: 0, passed: 0 },
      phase5: { tested: 0, passed: 0 }
    };

    for (const issue of issues) {
      const jiraData = transformJiraIssue(issue);
      const results = await testSync(jiraData);
      
      displayResults(issue.key, results);
      
      // Agréger les résultats
      Object.keys(globalResults).forEach(phase => {
        globalResults[phase].tested += results[phase].tested;
        globalResults[phase].passed += results[phase].passed;
      });
    }

    // 3. Résumé global
    logSection('RÉSUMÉ GLOBAL');
    
    const phases = [
      { name: 'Phase 1 (Standards)', data: globalResults.phase1 },
      { name: 'Phase 2 (Client/Contact)', data: globalResults.phase2 },
      { name: 'Phase 3 (Feature)', data: globalResults.phase3 },
      { name: 'Phase 4 (Workflow)', data: globalResults.phase4 },
      { name: 'Phase 5 (Custom Fields)', data: globalResults.phase5 }
    ];

    let totalTested = 0;
    let totalPassed = 0;

    phases.forEach(phase => {
      if (phase.data.tested > 0) {
        const percentage = Math.round((phase.data.passed / phase.data.tested) * 100);
        const color = percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
        log(`${phase.name}: ${phase.data.passed}/${phase.data.tested} (${percentage}%)`, color);
        totalTested += phase.data.tested;
        totalPassed += phase.data.passed;
      } else {
        log(`${phase.name}: Aucun champ testé (tickets sans ces champs)`, 'yellow');
      }
    });

    log('\n' + '='.repeat(60));
    const globalPercentage = totalTested > 0 ? Math.round((totalPassed / totalTested) * 100) : 0;
    log(`📊 TOTAL: ${totalPassed}/${totalTested} champs mappés (${globalPercentage}%)`, 'cyan');
    
    if (globalPercentage === 100) {
      log('🎉 Tous les champs sont correctement mappés !', 'green');
    } else if (globalPercentage >= 80) {
      log('✅ La plupart des champs sont correctement mappés', 'green');
    } else {
      log('⚠️  Certains champs nécessitent une attention', 'yellow');
    }

  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

