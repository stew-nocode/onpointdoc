/* eslint-disable no-console */
/**
 * Script de vérification des variables d'environnement JIRA
 * 
 * Vérifie que toutes les variables nécessaires sont configurées
 * et teste la connexion à JIRA si possible
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

console.log('🔍 Vérification des variables d\'environnement JIRA\n');
console.log('═'.repeat(60));

// Vérifier chaque variable
const checks = [
  {
    name: 'JIRA_URL',
    value: JIRA_URL,
    alternatives: ['JIRA_BASE_URL'],
    required: true
  },
  {
    name: 'JIRA_USERNAME',
    value: JIRA_USERNAME,
    alternatives: ['JIRA_EMAIL', 'JIRA_API_EMAIL'],
    required: true
  },
  {
    name: 'JIRA_TOKEN',
    value: JIRA_TOKEN,
    alternatives: ['JIRA_API_TOKEN'],
    required: true
  }
];

let allValid = true;

checks.forEach(({ name, value, alternatives, required }) => {
  const isValid = !!value && value.trim().length > 0;
  const status = isValid ? '✅' : (required ? '❌' : '⚠️');
  const statusText = isValid ? 'défini' : (required ? 'MANQUANT (requis)' : 'non défini (optionnel)');
  
  console.log(`${status} ${name}: ${statusText}`);
  
  if (!isValid && alternatives.length > 0) {
    console.log(`   Alternatives: ${alternatives.join(', ')}`);
  }
  
  if (isValid && name === 'JIRA_TOKEN') {
    // Masquer le token pour la sécurité
    const masked = value.length > 10 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`   Valeur: ${masked} (${value.length} caractères)`);
  } else if (isValid) {
    console.log(`   Valeur: ${value}`);
  }
  
  if (!isValid && required) {
    allValid = false;
  }
  
  console.log('');
});

console.log('═'.repeat(60));

if (!allValid) {
  console.error('\n❌ Configuration incomplète !');
  console.error('\n📝 Pour configurer les variables :');
  console.error('   1. Créer un fichier .env.local à la racine du projet');
  console.error('   2. Ajouter les variables suivantes :');
  console.error('      JIRA_URL=https://onpointdigital.atlassian.net');
  console.error('      JIRA_USERNAME=votre-email@example.com');
  console.error('      JIRA_TOKEN=votre-token-api');
  console.error('\n📚 Voir docs/configuration-jira-env.md pour plus de détails\n');
  process.exit(1);
}

console.log('✅ Toutes les variables requises sont définies\n');

// Tester la connexion JIRA
console.log('🔗 Test de connexion à JIRA...\n');

try {
  const cleanUrl = JIRA_URL.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
  const cleanUsername = JIRA_USERNAME.replace(/^["']|["']$/g, '').trim();
  const cleanToken = JIRA_TOKEN.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
  
  const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');
  
  const response = await fetch(`${cleanUrl}/rest/api/3/myself`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Erreur de connexion HTTP ${response.status}`);
    console.error(`   ${errorText}\n`);
    console.error('💡 Vérifiez :');
    console.error('   - Que l\'URL JIRA est correcte');
    console.error('   - Que le token API est valide');
    console.error('   - Que l\'utilisateur a les permissions nécessaires\n');
    process.exit(1);
  }

  const userInfo = await response.json();
  console.log('✅ Connexion réussie !');
  console.log(`   Connecté en tant que: ${userInfo.displayName} (${userInfo.emailAddress})\n`);
  
  // Tester l'accès au projet OD
  console.log('🔍 Vérification de l\'accès au projet OD...\n');
  
  const projectResponse = await fetch(`${cleanUrl}/rest/api/3/project/OD`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });

  if (!projectResponse.ok) {
    console.warn(`⚠️  Impossible d'accéder au projet OD (HTTP ${projectResponse.status})`);
    console.warn('   Vérifiez que l\'utilisateur a les permissions sur le projet OD\n');
  } else {
    const project = await projectResponse.json();
    console.log('✅ Accès au projet OD confirmé');
    console.log(`   Projet: ${project.name} (${project.key})\n`);
  }

  console.log('═'.repeat(60));
  console.log('✅ Configuration JIRA validée avec succès !\n');
  console.log('🚀 Vous pouvez maintenant :');
  console.log('   - Créer des tickets BUG/REQ (création JIRA automatique)');
  console.log('   - Transférer des ASSISTANCE vers JIRA');
  console.log('   - Synchroniser les statuts depuis JIRA\n');

} catch (error) {
  console.error('❌ Erreur lors du test de connexion :');
  console.error(`   ${error.message}\n`);
  console.error('💡 Vérifiez :');
  console.error('   - Que l\'URL JIRA est accessible');
  console.error('   - Que les variables sont correctement formatées');
  console.error('   - Que vous avez une connexion Internet\n');
  process.exit(1);
}

