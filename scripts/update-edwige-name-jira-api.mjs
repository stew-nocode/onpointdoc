#!/usr/bin/env node

/**
 * Script pour mettre à jour le nom "Edwidge Kouassi" en "Edwige KOUASSI" dans JIRA
 * via l'API Admin JIRA
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

// Configuration JIRA
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!jiraUrl || !jiraUsername || !jiraToken) {
  console.error('❌ Variables JIRA manquantes');
  process.exit(1);
}

const JIRA_URL = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_EMAIL = jiraUsername.replace(/^["']|["']$/g, '').trim();
const JIRA_API_TOKEN = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const JIRA_USER_ID = '5fb4dd9e2730d800765b5774';
const CORRECT_NAME = 'Edwige KOUASSI';

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔧 MISE À JOUR DU NOM DANS JIRA');
console.log('════════════════════════════════════════════════════════════════════════════════\n');
console.log(`📝 Utilisateur: ${JIRA_USER_ID}`);
console.log(`📝 Nouveau nom: "${CORRECT_NAME}"\n`);

async function updateEdwigeName() {
  try {
    // 1. Récupérer l'utilisateur actuel
    console.log('🔍 Récupération de l\'utilisateur actuel...');
    const getUserResponse = await fetch(`${JIRA_URL}/rest/api/3/user?accountId=${JIRA_USER_ID}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!getUserResponse.ok) {
      const errorText = await getUserResponse.text();
      console.error(`❌ Erreur lors de la récupération: ${errorText}`);
      return;
    }

    const user = await getUserResponse.json();
    console.log(`✅ Utilisateur trouvé: "${user.displayName}" (${user.accountId})`);
    console.log(`   Email: ${user.emailAddress || 'N/A'}\n`);

    if (user.displayName === CORRECT_NAME) {
      console.log('✅ Le nom est déjà correct !\n');
      return;
    }

    // 2. Essayer de mettre à jour via l'API Admin JIRA
    console.log('📝 Tentative de mise à jour via l\'API Admin JIRA...\n');
    
    // Méthode 1: PUT /rest/api/3/user (nécessite permissions admin)
    const updateResponse = await fetch(`${JIRA_URL}/rest/api/3/user?accountId=${JIRA_USER_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: CORRECT_NAME
      })
    });

    if (updateResponse.ok) {
      const updatedUser = await updateResponse.json();
      console.log(`✅ Nom mis à jour avec succès !`);
      console.log(`   Ancien nom: "${user.displayName}"`);
      console.log(`   Nouveau nom: "${updatedUser.displayName}"\n`);
      return;
    }

    // Si la méthode 1 échoue, essayer d'autres méthodes
    const errorText = await updateResponse.text();
    console.log(`⚠️  Méthode 1 échouée (${updateResponse.status}): ${errorText.substring(0, 200)}\n`);

    // Méthode 2: Utiliser l'API Admin pour mettre à jour les propriétés utilisateur
    console.log('📝 Tentative via l\'API Admin (user properties)...\n');
    const propertiesResponse = await fetch(
      `${JIRA_URL}/rest/api/3/user/properties?accountId=${JIRA_USER_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (propertiesResponse.ok) {
      const properties = await propertiesResponse.json();
      console.log(`✅ Propriétés utilisateur récupérées: ${properties.keys?.length || 0} propriétés\n`);
    }

    // Si toutes les méthodes échouent, donner des instructions manuelles
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('⚠️  MISE À JOUR AUTOMATIQUE IMPOSSIBLE');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    console.log('La mise à jour du nom d\'affichage nécessite des permissions Admin JIRA.\n');
    console.log('💡 Pour corriger manuellement:');
    console.log('   1. Connectez-vous à JIRA en tant qu\'administrateur');
    console.log('   2. Allez dans: Settings (⚙️) → User management');
    console.log('   3. Recherchez: "Edwidge Kouassi" ou accountId: 5fb4dd9e2730d800765b5774');
    console.log('   4. Cliquez sur l\'utilisateur');
    console.log('   5. Modifiez le "Display name" en: "Edwige KOUASSI"');
    console.log('   6. Sauvegardez\n');
    console.log('📋 Informations de l\'utilisateur:');
    console.log(`   Account ID: ${user.accountId}`);
    console.log(`   Email: ${user.emailAddress || 'N/A'}`);
    console.log(`   Nom actuel: "${user.displayName}"`);
    console.log(`   Nom à mettre: "${CORRECT_NAME}"\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateEdwigeName();





