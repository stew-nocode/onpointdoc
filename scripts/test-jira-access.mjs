#!/usr/bin/env node

/**
 * Script de test pour vérifier l'accès au projet OD dans JIRA
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
console.log('🔍 TEST D\'ACCÈS AU PROJET OD DANS JIRA');
console.log('════════════════════════════════════════════════════════════════════════════════\n');
console.log(`📍 URL JIRA: ${JIRA_URL}\n`);

async function testJiraAccess() {
  try {
    // Test 1: Récupérer un ticket OD spécifique
    console.log('📋 Test 1: Récupération d\'un ticket OD spécifique (OD-2373)...');
    try {
      const response = await fetch(`${JIRA_URL}/rest/api/3/issue/OD-2373`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const ticket = await response.json();
        console.log(`✅ Ticket OD-2373 trouvé:`);
        console.log(`   - Clé: ${ticket.key}`);
        console.log(`   - Titre: ${ticket.fields?.summary || 'N/A'}`);
        console.log(`   - Statut: ${ticket.fields?.status?.name || 'N/A'}\n`);
        
        // Vérifier les issue links
        const issueLinks = ticket.fields?.issuelinks || [];
        if (issueLinks.length > 0) {
          console.log(`   - Issue Links trouvés: ${issueLinks.length}`);
          issueLinks.slice(0, 3).forEach(link => {
            if (link.outwardIssue) {
              console.log(`     → ${link.outwardIssue.key} (${link.type?.name || 'N/A'})`);
            }
          });
        }
        console.log('');
      } else {
        const errorText = await response.text();
        console.log(`❌ Erreur ${response.status}: ${errorText.substring(0, 200)}\n`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}\n`);
    }

    // Test 2: Rechercher des tickets OD (POST avec JQL)
    console.log('📋 Test 2: Recherche de tickets OD (JQL: project = OD)...');
    try {
      const response = await fetch(`${JIRA_URL}/rest/api/3/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jql: 'project = OD',
          maxResults: 5,
          fields: ['key', 'summary', 'status']
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${data.total} tickets OD trouvés (affichage de ${data.issues?.length || 0} premiers):\n`);
        data.issues?.forEach(issue => {
          console.log(`   - ${issue.key}: ${issue.fields?.summary || 'N/A'}`);
        });
        console.log('');
      } else {
        const errorText = await response.text();
        console.log(`❌ Erreur ${response.status}: ${errorText.substring(0, 300)}\n`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}\n`);
    }

    // Test 3: Vérifier les champs personnalisés d'un ticket OD
    console.log('📋 Test 3: Récupération d\'un ticket OD avec tous les champs personnalisés...');
    try {
      const response = await fetch(`${JIRA_URL}/rest/api/3/issue/OD-2373?fields=*all&expand=names`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const ticket = await response.json();
        const fields = ticket.fields || {};
        
        // Lister tous les champs personnalisés
        const customFields = Object.keys(fields).filter(k => k.startsWith('customfield_'));
        console.log(`✅ ${customFields.length} champs personnalisés trouvés:\n`);
        
        customFields.slice(0, 10).forEach(fieldKey => {
          const value = fields[fieldKey];
          const valueStr = typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : String(value);
          console.log(`   - ${fieldKey}: ${valueStr}`);
        });
        
        // Chercher des champs contenant "OBCS-" ou "duplicate"
        console.log('\n🔍 Recherche de champs contenant "OBCS-" ou "Duplicate"...');
        for (const [key, value] of Object.entries(fields)) {
          const valueStr = String(value || '').toLowerCase();
          if (valueStr.includes('obcs-') || valueStr.includes('duplicate')) {
            console.log(`   ✅ Trouvé dans ${key}: ${String(value).substring(0, 150)}`);
          }
        }
        console.log('');
      } else {
        const errorText = await response.text();
        console.log(`❌ Erreur ${response.status}: ${errorText.substring(0, 200)}\n`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}\n`);
    }

    console.log('✅ Tests terminés');
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

testJiraAccess();





