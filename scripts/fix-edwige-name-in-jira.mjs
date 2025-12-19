#!/usr/bin/env node

/**
 * Script pour corriger le nom "Edwidge Kouassi" en "Edwige Kouassi" dans JIRA
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

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔧 CORRECTION DU NOM "EDWIDGE KOUASSI" → "EDWIGE KOUASSI" DANS JIRA');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

async function fixEdwigeName() {
  try {
    // 1. Chercher l'utilisateur par son jira_user_id depuis Supabase
    const jiraUserId = '5fb4dd9e2730d800765b5774'; // jira_user_id de "Edwige KOUASSI"
    
    console.log(`🔍 Recherche de l'utilisateur JIRA avec ID: ${jiraUserId}...\n`);

    // 2. Récupérer l'utilisateur depuis JIRA via l'API
    const response = await fetch(`${JIRA_URL}/rest/api/3/user?accountId=${jiraUserId}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur lors de la récupération de l'utilisateur: ${errorText}`);
      
      // Essayer avec le format accountId complet
      console.log('\n🔍 Tentative avec le format accountId complet...');
      const accountIdResponse = await fetch(`${JIRA_URL}/rest/api/3/user?accountId=5fb4dd9e2730d800765b5774`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });
      
      if (!accountIdResponse.ok) {
        const errorText2 = await accountIdResponse.text();
        console.error(`❌ Erreur: ${errorText2}`);
        return;
      }
      
      const user = await accountIdResponse.json();
      console.log(`✅ Utilisateur trouvé: ${user.displayName} (${user.accountId})\n`);
      
      // Vérifier si le nom doit être corrigé
      if (user.displayName === 'Edwidge Kouassi' || user.displayName.includes('Edwidge')) {
        console.log(`📝 Nom actuel: "${user.displayName}"`);
        console.log(`📝 Nom à corriger: "Edwige KOUASSI"\n`);
        
        // Note: La mise à jour du displayName nécessite généralement l'API Admin JIRA
        // ou doit être faite manuellement dans JIRA Admin
        console.log('⚠️  La mise à jour du nom d\'affichage dans JIRA nécessite généralement:');
        console.log('   1. Accès Admin JIRA');
        console.log('   2. Utilisation de l\'API Admin JIRA (/rest/api/3/user/properties)');
        console.log('   3. Ou modification manuelle dans JIRA Admin → User Management\n');
        
        console.log('💡 Solutions possibles:');
        console.log('   A. Modifier manuellement dans JIRA:');
        console.log('      - Aller dans JIRA Admin → User Management');
        console.log('      - Chercher "Edwidge Kouassi"');
        console.log('      - Modifier le Display Name en "Edwige KOUASSI"\n');
        
        console.log('   B. Utiliser l\'API Admin JIRA (si vous avez les permissions):');
        console.log('      PUT /rest/api/3/user/properties');
        console.log('      (Nécessite des permissions admin)\n');
      } else {
        console.log(`✅ Le nom est déjà correct: "${user.displayName}"\n`);
      }
      
      return;
    }

    const user = await response.json();
    console.log(`✅ Utilisateur trouvé: ${user.displayName} (${user.accountId})\n`);
    
    // Vérifier si le nom doit être corrigé
    if (user.displayName === 'Edwidge Kouassi' || user.displayName.includes('Edwidge')) {
      console.log(`📝 Nom actuel: "${user.displayName}"`);
      console.log(`📝 Nom à corriger: "Edwige KOUASSI"\n`);
      
      console.log('⚠️  La mise à jour du displayName nécessite généralement l\'API Admin JIRA');
      console.log('   ou doit être faite manuellement dans JIRA Admin.\n');
      
      console.log('💡 Pour corriger manuellement:');
      console.log('   1. Aller dans JIRA Admin → User Management');
      console.log('   2. Chercher "Edwidge Kouassi"');
      console.log('   3. Modifier le Display Name en "Edwige KOUASSI"\n');
    } else {
      console.log(`✅ Le nom est déjà correct: "${user.displayName}"\n`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixEdwigeName();





