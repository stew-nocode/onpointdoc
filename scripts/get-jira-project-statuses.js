/* eslint-disable no-console */
/**
 * Script pour récupérer tous les statuts disponibles dans le projet JIRA "OD"
 * 
 * Récupère :
 * - Tous les statuts du projet
 * - Les statuts par type d'issue (Bug, Task, Story, etc.)
 * - Les workflows et transitions possibles
 * 
 * Prérequis:
 * - Variables d'environnement dans .env.local:
 *   - JIRA_URL ou JIRA_BASE_URL
 *   - JIRA_USERNAME, JIRA_EMAIL ou JIRA_API_EMAIL
 *   - JIRA_TOKEN ou JIRA_API_TOKEN
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

async function getProjectStatuses() {
  try {
    const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');
    
    console.log('🔍 Connexion à JIRA...');
    console.log(`   URL: ${cleanUrl}`);
    console.log(`   Projet: ${PROJECT_KEY}\n`);

    // 1. Récupérer les informations du projet
    console.log('📋 Récupération des informations du projet...');
    const projectResponse = await fetch(`${cleanUrl}/rest/api/3/project/${PROJECT_KEY}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!projectResponse.ok) {
      const errorText = await projectResponse.text();
      throw new Error(`Erreur HTTP ${projectResponse.status}: ${errorText}`);
    }

    const project = await projectResponse.json();
    console.log(`✅ Projet trouvé: ${project.name} (${project.key})\n`);

    // 2. Récupérer tous les statuts disponibles dans JIRA
    console.log('📊 Récupération de tous les statuts JIRA...');
    const statusesResponse = await fetch(`${cleanUrl}/rest/api/3/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!statusesResponse.ok) {
      const errorText = await statusesResponse.text();
      throw new Error(`Erreur HTTP ${statusesResponse.status}: ${errorText}`);
    }

    const allStatuses = await statusesResponse.json();
    console.log(`✅ ${allStatuses.length} statuts trouvés dans JIRA\n`);

    // 3. Récupérer les types d'issues du projet
    console.log('🔍 Récupération des types d\'issues du projet...');
    const issueTypesResponse = await fetch(`${cleanUrl}/rest/api/3/project/${PROJECT_KEY}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!issueTypesResponse.ok) {
      const errorText = await issueTypesResponse.text();
      throw new Error(`Erreur HTTP ${issueTypesResponse.status}: ${errorText}`);
    }

    const projectData = await issueTypesResponse.json();
    const issueTypes = projectData.issueTypes || [];
    console.log(`✅ ${issueTypes.length} types d'issues trouvés\n`);

    // 4. Récupérer les workflows du projet pour voir les statuts disponibles
    console.log('📊 Récupération des workflows du projet...\n');
    
    // Récupérer les workflows actifs du projet
    const workflowsResponse = await fetch(
      `${cleanUrl}/rest/api/3/workflow/search?projectKey=${PROJECT_KEY}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    const workflows = workflowsResponse.ok ? await workflowsResponse.json() : [];
    console.log(`✅ ${workflows.length} workflow(s) trouvé(s)\n`);

    // 5. Pour chaque type d'issue, récupérer les statuts possibles
    console.log('📊 Analyse des statuts par type d\'issue...\n');
    console.log('═'.repeat(80));

    const statusesByIssueType = {};
    const allStatusesFound = new Set();

    for (const issueType of issueTypes) {
      const issueTypeName = issueType.name;
      const issueTypeId = issueType.id;
      
      console.log(`\n📌 Type: ${issueTypeName} (ID: ${issueTypeId})`);
      
      try {
        // Méthode 1: Chercher des tickets de ce type pour voir les statuts utilisés
        const searchResponse = await fetch(
          `${cleanUrl}/rest/api/3/search?jql=project=${PROJECT_KEY} AND issuetype=${issueTypeId}&fields=status&maxResults=100`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );

        const statuses = new Set();
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          searchData.issues?.forEach(issue => {
            if (issue.fields?.status) {
              const statusName = issue.fields.status.name;
              statuses.add(statusName);
              allStatusesFound.add(statusName);
            }
          });
        }

        // Méthode 2: Si pas de tickets, essayer de récupérer les statuts depuis les workflows
        if (statuses.size === 0 && workflows.length > 0) {
          // Chercher le workflow associé à ce type d'issue
          for (const workflow of workflows) {
            if (workflow.issueTypes?.some(it => it.id === issueTypeId)) {
              // Récupérer les détails du workflow
              try {
                const workflowDetailsResponse = await fetch(
                  `${cleanUrl}/rest/api/3/workflow/${workflow.id}`,
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `Basic ${auth}`,
                      'Accept': 'application/json'
                    }
                  }
                );
                
                if (workflowDetailsResponse.ok) {
                  const workflowDetails = await workflowDetailsResponse.json();
                  // Extraire les statuts du workflow
                  if (workflowDetails.statuses) {
                    workflowDetails.statuses.forEach(status => {
                      statuses.add(status.name);
                      allStatusesFound.add(status.name);
                    });
                  }
                }
              } catch (err) {
                // Ignorer les erreurs de workflow individuel
              }
            }
          }
        }

        statusesByIssueType[issueTypeName] = Array.from(statuses).sort();
        
        if (statuses.size > 0) {
          console.log(`   Statuts trouvés (${statuses.size}):`);
          statusesByIssueType[issueTypeName].forEach(status => {
            console.log(`   - ${status}`);
          });
        } else {
          console.log(`   ⚠️  Aucun statut trouvé (pas de tickets ou workflow non accessible)`);
        }
      } catch (error) {
        console.log(`   ⚠️  Erreur: ${error.message}`);
      }
    }

    // 5. Afficher un résumé global
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 RÉSUMÉ DES STATUTS PAR TYPE D\'ISSUE\n');
    
    Object.entries(statusesByIssueType).forEach(([issueType, statuses]) => {
      console.log(`${issueType}:`);
      console.log(`  ${statuses.length} statut(s) unique(s)`);
      console.log(`  ${statuses.join(', ')}\n`);
    });

    // 6. Lister tous les statuts uniques trouvés
    const sortedStatuses = Array.from(allStatusesFound).sort();

    console.log('═'.repeat(80));
    console.log('\n📋 TOUS LES STATUTS UNIQUES TROUVÉS DANS LE PROJET\n');
    if (sortedStatuses.length > 0) {
      sortedStatuses.forEach((status, index) => {
        console.log(`${index + 1}. ${status}`);
      });
    } else {
      console.log('⚠️  Aucun statut trouvé dans les tickets du projet.');
      console.log('   Cela peut signifier qu\'il n\'y a pas encore de tickets créés.');
    }

    console.log(`\nTotal: ${sortedStatuses.length} statut(s) unique(s)\n`);

    // 6b. Afficher aussi tous les statuts disponibles dans JIRA (tous projets confondus)
    console.log('═'.repeat(80));
    console.log('\n📋 TOUS LES STATUTS DISPONIBLES DANS JIRA (tous projets)\n');
    const allJiraStatuses = allStatuses.map(s => s.name).sort();
    allJiraStatuses.forEach((status, index) => {
      const isUsed = sortedStatuses.includes(status);
      console.log(`${index + 1}. ${status} ${isUsed ? '✅ (utilisé dans OD)' : ''}`);
    });
    console.log(`\nTotal: ${allJiraStatuses.length} statut(s) disponible(s) dans JIRA\n`);

    // 7. Générer un mapping suggéré vers Supabase
    console.log('═'.repeat(80));
    console.log('\n💡 MAPPING SUGGÉRÉ VERS SUPABASE\n');
    console.log('Statuts JIRA → Statuts Supabase:\n');
    
    const mapping = {
      'Nouveau': [
        'Backlog', 'À faire', 'A faire', 'A FAIRE', 'To Do', 'Sprint Backlog',
        'Ouvert', 'Pending', 'Priorisé'
      ],
      'En_cours': [
        'En cours', 'In Progress', 'Traitement en Cours', 'Work in progress',
        'In Development', 'Test en Cours', 'Revue en cours', 'Dev Done'
      ],
      'Transfere': [
        'À valider', 'Transféré', 'En attente du client', 'En attente du support',
        'Waiting for approval', 'Prêt à être revu', 'Ready for delivery'
      ],
      'Resolue': [
        'Terminé', 'Terminé(e)', 'Résolu', 'Résolue', 'Done', 'Closed',
        'Fermée', 'Testing Done', 'Livraison'
      ]
    };

    // Fonction pour trouver les correspondances
    const findMatches = (jiraStatuses, targetStatuses) => {
      const matches = [];
      jiraStatuses.forEach(jiraStatus => {
        const jiraLower = jiraStatus.toLowerCase().trim();
        targetStatuses.forEach(target => {
          const targetLower = target.toLowerCase().trim();
          if (jiraLower === targetLower || 
              jiraLower.includes(targetLower) || 
              targetLower.includes(jiraLower)) {
            matches.push({ jira: jiraStatus, target });
          }
        });
      });
      return matches;
    };

    Object.entries(mapping).forEach(([supabaseStatus, targetStatuses]) => {
      console.log(`\n${supabaseStatus}:`);
      const matches = findMatches(allJiraStatuses, targetStatuses);
      if (matches.length > 0) {
        matches.forEach(({ jira, target }) => {
          console.log(`  ✅ "${jira}" → correspond à "${target}"`);
        });
      } else {
        console.log(`  ⚠️  Aucune correspondance exacte trouvée`);
        // Chercher des correspondances partielles
        targetStatuses.forEach(target => {
          const partialMatches = allJiraStatuses.filter(s => 
            s.toLowerCase().includes(target.toLowerCase()) || 
            target.toLowerCase().includes(s.toLowerCase())
          );
          if (partialMatches.length > 0) {
            partialMatches.forEach(match => {
              console.log(`  🔍 "${match}" (correspondance partielle avec "${target}")`);
            });
          }
        });
      }
    });

    // 8. Afficher les statuts non mappés
    console.log('\n' + '═'.repeat(80));
    console.log('\n⚠️  STATUTS JIRA NON MAPPÉS (à examiner manuellement)\n');
    
    const mappedStatuses = new Set();
    Object.values(mapping).forEach(targetStatuses => {
      targetStatuses.forEach(target => {
        allJiraStatuses.forEach(jira => {
          const jiraLower = jira.toLowerCase().trim();
          const targetLower = target.toLowerCase().trim();
          if (jiraLower === targetLower || 
              jiraLower.includes(targetLower) || 
              targetLower.includes(jiraLower)) {
            mappedStatuses.add(jira);
          }
        });
      });
    });

    const unmappedStatuses = allJiraStatuses.filter(s => !mappedStatuses.has(s));
    if (unmappedStatuses.length > 0) {
      unmappedStatuses.forEach((status, index) => {
        console.log(`${index + 1}. ${status}`);
      });
      console.log(`\nTotal: ${unmappedStatuses.length} statut(s) non mappé(s)`);
    } else {
      console.log('✅ Tous les statuts sont mappés !');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statuts JIRA:');
    console.error(error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

getProjectStatuses();

