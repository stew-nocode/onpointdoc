/* eslint-disable no-console */
/**
 * Script pour analyser les statuts réels des tickets BUG et REQ dans JIRA
 * et voir comment les mapper avec Supabase
 * 
 * Récupère tous les tickets BUG et REQ du projet OD et analyse leurs statuts
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

const PROJECT_KEY = 'OD';

async function analyzeBugReqStatuses() {
  try {
    const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');
    
    console.log('🔍 Analyse des statuts BUG et REQ dans JIRA...');
    console.log(`   URL: ${cleanUrl}`);
    console.log(`   Projet: ${PROJECT_KEY}\n`);

    // Récupérer les types d'issues pour identifier BUG et REQ
    const projectResponse = await fetch(`${cleanUrl}/rest/api/3/project/${PROJECT_KEY}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!projectResponse.ok) {
      throw new Error(`Erreur HTTP ${projectResponse.status}`);
    }

    const project = await projectResponse.json();
    const issueTypes = project.issueTypes || [];
    
    // Trouver les IDs pour Bug et Requêtes
    const bugType = issueTypes.find(it => it.name === 'Bug' || it.name === 'bug');
    const reqType = issueTypes.find(it => it.name === 'Requêtes' || it.name === 'Requête' || it.name.toLowerCase().includes('requête'));
    
    console.log('📋 Types d\'issues trouvés:');
    issueTypes.forEach(it => {
      console.log(`   - ${it.name} (ID: ${it.id})`);
    });
    console.log('');

    if (!bugType && !reqType) {
      console.warn('⚠️  Types Bug ou Requêtes non trouvés. Utilisation des IDs par défaut.');
    }

    // Essayer de récupérer des tickets spécifiques mentionnés dans l'image
    const sampleKeys = ['OD-2987', 'OD-2986', 'OD-2985', 'OD-2984', 'OD-2983', 'OD-2982', 'OD-2981', 'OD-2980', 'OD-2979'];
    
    console.log('═'.repeat(80));
    console.log('🔍 RÉCUPÉRATION DES STATUTS DEPUIS DES TICKETS SPÉCIFIQUES\n');
    
    const statusesFound = new Set();
    const statusesByType = { BUG: new Set(), REQ: new Set() };
    
    for (const key of sampleKeys) {
      try {
        const issueResponse = await fetch(`${cleanUrl}/rest/api/3/issue/${key}?fields=status,issuetype`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        });
        
        if (issueResponse.ok) {
          const issue = await issueResponse.json();
          const statusName = issue.fields?.status?.name;
          const issueTypeName = issue.fields?.issuetype?.name;
          
          if (statusName) {
            statusesFound.add(statusName);
            if (issueTypeName === 'Bug' || issueTypeName === 'bug') {
              statusesByType.BUG.add(statusName);
            } else if (issueTypeName === 'Requêtes' || issueTypeName?.toLowerCase().includes('requête')) {
              statusesByType.REQ.add(statusName);
            }
            console.log(`   ✅ ${key}: ${statusName} (${issueTypeName})`);
          }
        }
      } catch (error) {
        // Ignorer les erreurs pour les tickets qui n'existent pas
      }
    }
    
    console.log(`\n   Total: ${statusesFound.size} statut(s) unique(s) trouvé(s)\n`);

    // Analyser les statuts pour BUG
    console.log('═'.repeat(80));
    console.log('🐛 STATUTS TROUVÉS POUR LES BUGS\n');
    
    if (statusesByType.BUG.size > 0) {
      Array.from(statusesByType.BUG).forEach(status => {
        console.log(`   - ${status}`);
      });
    } else {
      console.log('   Aucun statut trouvé dans les tickets BUG analysés');
    }
    
    // Analyser les statuts pour REQ
    console.log('\n' + '═'.repeat(80));
    console.log('📝 STATUTS TROUVÉS POUR LES REQUÊTES\n');
    
    if (statusesByType.REQ.size > 0) {
      Array.from(statusesByType.REQ).forEach(status => {
        console.log(`   - ${status}`);
      });
    } else {
      console.log('   Aucun statut trouvé dans les tickets REQ analysés');
    }
    
    // Convertir en format attendu
    const bugStatuses = Array.from(statusesByType.BUG).map(status => ({ status, count: 1 }));
    const reqStatuses = Array.from(statusesByType.REQ).map(status => ({ status, count: 1 }));
    
    // Essayer aussi une recherche générale
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 RECHERCHE GÉNÉRALE DES TICKETS\n');
    
    const allStatusesFromSearch = await analyzeStatusesForIssueType(cleanUrl, auth, `project=${PROJECT_KEY}`, 'ALL');
    
    // Combiner avec les statuts trouvés
    allStatusesFromSearch.forEach(({ status }) => statusesFound.add(status));

    // Comparaison et recommandations
    console.log('\n' + '═'.repeat(80));
    console.log('📊 COMPARAISON ET RECOMMANDATIONS\n');
    
    console.log('Statuts trouvés pour BUG:');
    bugStatuses.forEach(({ status, count }) => {
      console.log(`   - ${status}: ${count} ticket(s)`);
    });
    
    console.log('\nStatuts trouvés pour REQ:');
    reqStatuses.forEach(({ status, count }) => {
      console.log(`   - ${status}: ${count} ticket(s)`);
    });

    // Vérifier les mappings actuels
    console.log('\n' + '═'.repeat(80));
    console.log('🔗 VÉRIFICATION DES MAPPINGS SUPABASE\n');
    
    const allStatuses = new Set([...Array.from(statusesFound), ...bugStatuses.map(s => s.status), ...reqStatuses.map(s => s.status)]);
    const expectedMappings = {
      'Sprint Backlog': 'Nouveau',
      'Traitement en Cours': 'En_cours',
      'Test en Cours': 'En_cours',
      'Terminé(e)': 'Resolue',
      'Terminé': 'Resolue'
    };

    console.log('Mappings attendus:');
    Object.entries(expectedMappings).forEach(([jiraStatus, supabaseStatus]) => {
      const found = allStatuses.has(jiraStatus);
      console.log(`   ${found ? '✅' : '❌'} "${jiraStatus}" → "${supabaseStatus}" ${found ? '' : '(non trouvé dans les tickets)'}`);
    });

    // Statuts non mappés
    const unmappedStatuses = Array.from(allStatuses).filter(s => !expectedMappings[s]);
    if (unmappedStatuses.length > 0) {
      console.log('\n⚠️  Statuts trouvés mais non mappés:');
      unmappedStatuses.forEach(status => {
        console.log(`   - ${status}`);
      });
    }

    // Recommandations
    console.log('\n' + '═'.repeat(80));
    console.log('💡 RECOMMANDATIONS\n');
    
    console.log('1. Mappings à ajouter/mettre à jour dans jira_status_mapping:');
    console.log('   - "Sprint Backlog" → "Nouveau" (pour BUG et REQ)');
    console.log('   - "Traitement en Cours" → "En_cours" (pour BUG et REQ)');
    console.log('   - "Test en Cours" → "En_cours" (pour BUG et REQ)');
    console.log('   - "Terminé(e)" → "Resolue" (pour BUG et REQ)');
    console.log('   - "Terminé" → "Resolue" (pour BUG et REQ)');
    
    console.log('\n2. Synchronisation:');
    console.log('   - Les statuts JIRA doivent être synchronisés vers Supabase via webhooks');
    console.log('   - Le mapping se fait via la table jira_status_mapping');
    console.log('   - L\'affichage dans l\'UI peut montrer soit le statut JIRA, soit le statut Supabase mappé');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

async function analyzeStatusesForIssueType(url, auth, jql, type) {
  try {
    console.log(`Recherche des tickets avec JQL: ${jql}`);
    
    // Utiliser la nouvelle API /rest/api/3/search avec POST
    const response = await fetch(
      `${url}/rest/api/3/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jql: jql,
          fields: ['status', 'key'],
          maxResults: 1000
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`   ⚠️  Erreur HTTP ${response.status}: ${errorText}`);
      // Essayer avec GET si POST échoue
      if (response.status === 410 || response.status === 400) {
        console.log('   Tentative avec GET...');
        const getResponse = await fetch(
          `${url}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=status,key&maxResults=1000`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );
        if (getResponse.ok) {
          const getData = await getResponse.json();
          const issues = getData.issues || [];
          console.log(`   ✅ ${issues.length} ticket(s) trouvé(s) avec GET\n`);
          
          const statusCount = new Map();
          issues.forEach(issue => {
            const statusName = issue.fields?.status?.name;
            if (statusName) {
              statusCount.set(statusName, (statusCount.get(statusName) || 0) + 1);
            }
          });

          const statuses = Array.from(statusCount.entries())
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count);

          console.log('   Statuts utilisés:');
          statuses.forEach(({ status, count }) => {
            const percentage = ((count / issues.length) * 100).toFixed(1);
            console.log(`   - ${status}: ${count} (${percentage}%)`);
          });

          return statuses;
        }
      }
      return [];
    }

    const data = await response.json();
    const issues = data.issues || [];
    
    console.log(`   ✅ ${issues.length} ticket(s) trouvé(s)\n`);

    // Compter les statuts
    const statusCount = new Map();
    issues.forEach(issue => {
      const statusName = issue.fields?.status?.name;
      if (statusName) {
        statusCount.set(statusName, (statusCount.get(statusName) || 0) + 1);
      }
    });

    // Trier par fréquence
    const statuses = Array.from(statusCount.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    console.log('   Statuts utilisés:');
    statuses.forEach(({ status, count }) => {
      const percentage = ((count / issues.length) * 100).toFixed(1);
      console.log(`   - ${status}: ${count} (${percentage}%)`);
    });

    return statuses;

  } catch (error) {
    console.warn(`   ⚠️  Erreur: ${error.message}`);
    return [];
  }
}

analyzeBugReqStatuses();

