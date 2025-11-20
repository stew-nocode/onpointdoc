/* eslint-disable no-console */
/**
 * Script de test pour créer un ticket JIRA et identifier les erreurs
 */

import dotenv from 'dotenv';
import path from 'node:path';

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
  console.log('✅ Fichier .env.local chargé\n');
} catch (error) {
  console.warn('⚠️  Fichier .env.local non trouvé\n');
}

const JIRA_URL = process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '';
const JIRA_USERNAME = process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '';
const JIRA_TOKEN = process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '';

console.log('🔍 Variables détectées :');
console.log(`   JIRA_URL: ${JIRA_URL ? '✅' : '❌'}`);
console.log(`   JIRA_USERNAME: ${JIRA_USERNAME ? '✅' : '❌'}`);
console.log(`   JIRA_TOKEN: ${JIRA_TOKEN ? '✅ (' + JIRA_TOKEN.length + ' caractères)' : '❌'}\n`);

if (!JIRA_URL || !JIRA_USERNAME || !JIRA_TOKEN) {
  console.error('❌ Variables JIRA manquantes');
  console.error('   Vérifiez que .env.local contient JIRA_URL, JIRA_USERNAME et JIRA_TOKEN');
  process.exit(1);
}

const cleanUrl = JIRA_URL.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const cleanUsername = JIRA_USERNAME.replace(/^["']|["']$/g, '').trim();
const cleanToken = JIRA_TOKEN.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();

const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');

// Simuler la création d'un ticket BUG comme dans le code
async function testJiraCreation() {
  console.log('🧪 Test de création d\'un ticket JIRA (BUG)\n');
  console.log('═'.repeat(60));

  // Données de test basées sur le ticket qui a échoué
  const testPayload = {
    fields: {
      project: {
        key: 'OD'
      },
      summary: 'Test - Création ticket BUG depuis OnpointDoc',
      description: 'Description de test pour vérifier la création JIRA',
      issuetype: {
        name: 'Bug' // Vérifier si c'est bien "Bug" ou "Bug" en français
      },
      priority: {
        name: 'Medium'
      }
    }
  };

  console.log('📤 Payload JIRA :');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n');

  try {
    console.log('🔗 Appel à l\'API JIRA...\n');
    
    const response = await fetch(`${cleanUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Statut HTTP: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur lors de la création du ticket JIRA');
      console.error(`   Statut: ${response.status}`);
      console.error(`   Réponse: ${errorText}\n`);
      
      // Essayer de parser l'erreur JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.error('📋 Détails de l\'erreur :');
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        // Pas de JSON, afficher le texte brut
      }
      
      return;
    }

    const jiraData = await response.json();
    console.log('✅ Ticket JIRA créé avec succès !');
    console.log(`   Clé: ${jiraData.key}`);
    console.log(`   ID: ${jiraData.id}\n`);
    
    console.log('📋 Réponse complète :');
    console.log(JSON.stringify(jiraData, null, 2));

  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API :');
    console.error(`   ${error.message}\n`);
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

// Tester d'abord les types d'issues disponibles dans le projet OD
async function testIssueTypes() {
  console.log('🔍 Vérification des types d\'issues disponibles dans le projet OD...\n');
  
  try {
    const response = await fetch(`${cleanUrl}/rest/api/3/project/OD`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur HTTP ${response.status}: ${errorText}\n`);
      return;
    }

    const project = await response.json();
    console.log(`✅ Projet: ${project.name} (${project.key})\n`);
    
    // Récupérer les types d'issues disponibles
    const issueTypesResponse = await fetch(`${cleanUrl}/rest/api/3/project/OD/statuses`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (issueTypesResponse.ok) {
      const statuses = await issueTypesResponse.json();
      console.log('📋 Statuts disponibles :');
      statuses.forEach((status) => {
        console.log(`   - ${status.name}`);
      });
      console.log('\n');
    }

    // Récupérer les métadonnées du projet pour les types d'issues
    const metadataResponse = await fetch(`${cleanUrl}/rest/api/3/project/OD`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (metadataResponse.ok) {
      const metadata = await metadataResponse.json();
      console.log('📋 Types d\'issues disponibles :');
      if (metadata.issueTypes) {
        metadata.issueTypes.forEach((type) => {
          console.log(`   - ${type.name} (${type.id})`);
        });
      }
      console.log('\n');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification :');
    console.error(`   ${error.message}\n`);
  }
}

// Exécuter les tests
(async () => {
  await testIssueTypes();
  console.log('═'.repeat(60));
  await testJiraCreation();
})();

