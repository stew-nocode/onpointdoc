/* eslint-disable no-console */
/**
 * Script pour lister les projets Jira disponibles
 * Utilise l'API REST de Jira avec authentification Basic Auth
 * 
 * Prérequis:
 * - Variables d'environnement dans .env.local:
 *   - JIRA_URL ou JIRA_BASE_URL: URL de votre instance Jira (ex: https://your-company.atlassian.net)
 *   - JIRA_USERNAME, JIRA_EMAIL ou JIRA_API_EMAIL: Email ou nom d'utilisateur Jira
 *   - JIRA_TOKEN ou JIRA_API_TOKEN: Token API Jira (créé sur https://id.atlassian.com/manage-profile/security/api-tokens)
 */

import dotenv from 'dotenv';
import path from 'node:path';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const JIRA_URL = process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '';
const JIRA_USERNAME = process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '';
const JIRA_TOKEN = process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '';

if (!JIRA_URL || !JIRA_USERNAME || !JIRA_TOKEN) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - JIRA_URL ou JIRA_BASE_URL (ou définir dans .env.local)');
  console.error('   - JIRA_USERNAME, JIRA_EMAIL ou JIRA_API_EMAIL (ou définir dans .env.local)');
  console.error('   - JIRA_TOKEN ou JIRA_API_TOKEN (ou définir dans .env.local)');
  console.error('\n💡 Créez un fichier .env.local à la racine du projet avec ces variables.');
  console.error('\n🔍 Variables détectées dans l\'environnement:');
  console.error(`   - JIRA_URL / JIRA_BASE_URL: ${JIRA_URL ? '✅ défini' : '❌ manquant'}`);
  console.error(`   - JIRA_USERNAME: ${process.env.JIRA_USERNAME ? '✅ défini' : '❌ manquant'}`);
  console.error(`   - JIRA_EMAIL: ${process.env.JIRA_EMAIL ? '✅ défini' : '❌ manquant'}`);
  console.error(`   - JIRA_API_EMAIL: ${process.env.JIRA_API_EMAIL ? '✅ défini' : '❌ manquant'}`);
  console.error(`   - JIRA_TOKEN: ${process.env.JIRA_TOKEN ? '✅ défini' : '❌ manquant'}`);
  console.error(`   - JIRA_API_TOKEN: ${process.env.JIRA_API_TOKEN ? '✅ défini' : '❌ manquant'}`);
  process.exit(1);
}

async function listJiraProjects() {
  try {
    // Nettoyer les valeurs (enlever les guillemets et retours à la ligne si présents)
    const cleanUrl = JIRA_URL.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
    const cleanUsername = JIRA_USERNAME.replace(/^["']|["']$/g, '').trim();
    const cleanToken = JIRA_TOKEN.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
    
    if (!cleanUrl || !cleanUsername || !cleanToken) {
      throw new Error('Variables Jira invalides après nettoyage');
    }
    
    const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');
    
    // Test de connexion d'abord
    console.log('🔍 Test de connexion à Jira...');
    console.log(`   URL: ${cleanUrl}`);
    console.log(`   Username: ${cleanUsername}`);
    console.log(`   Token length: ${cleanToken.length} caractères\n`);
    const testResponse = await fetch(`${cleanUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      throw new Error(`Erreur d'authentification HTTP ${testResponse.status}: ${errorText}`);
    }

    const userInfo = await testResponse.json();
    console.log(`✅ Connecté en tant que: ${userInfo.displayName} (${userInfo.emailAddress})\n`);

    // Récupération des projets
    console.log('📋 Récupération des projets...\n');
    const response = await fetch(`${cleanUrl}/rest/api/3/project`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    const projects = await response.json();
    
    console.log('\n📋 Projets Jira disponibles :\n');
    console.log('─'.repeat(80));
    
    if (projects.length === 0) {
      console.log('Aucun projet trouvé.');
      return;
    }

    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.name} (${project.key})`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Type: ${project.projectTypeKey || 'N/A'}`);
      console.log(`   Style: ${project.style || 'N/A'}`);
      if (project.lead) {
        console.log(`   Lead: ${project.lead.displayName} (${project.lead.emailAddress || 'N/A'})`);
      }
      if (project.description) {
        console.log(`   Description: ${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`\nTotal: ${projects.length} projet(s)\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des projets Jira:');
    console.error(error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

listJiraProjects();

