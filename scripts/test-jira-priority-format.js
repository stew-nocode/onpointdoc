/* eslint-disable no-console */
/**
 * Test des différents formats de priorité JIRA
 */

import dotenv from 'dotenv';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const JIRA_URL = process.env.JIRA_URL ?? process.env.JIRA_BASE_URL ?? '';
const JIRA_USERNAME = process.env.JIRA_USERNAME ?? process.env.JIRA_EMAIL ?? process.env.JIRA_API_EMAIL ?? '';
const JIRA_TOKEN = process.env.JIRA_TOKEN ?? process.env.JIRA_API_TOKEN ?? '';

const cleanUrl = JIRA_URL.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const cleanUsername = JIRA_USERNAME.replace(/^["']|["']$/g, '').trim();
const cleanToken = JIRA_TOKEN.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();

const auth = Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64');

// Fonction pour convertir texte en ADF
function textToADF(text) {
  if (!text || text.trim().length === 0) {
    return {
      type: 'doc',
      version: 1,
      content: []
    };
  }

  // Diviser le texte en paragraphes
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  const content = paragraphs.map(paragraph => {
    // Diviser chaque paragraphe en lignes
    const lines = paragraph.split('\n');
    
    if (lines.length === 1) {
      // Paragraphe simple
      return {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: lines[0].trim()
          }
        ]
      };
    } else {
      // Plusieurs lignes - créer un paragraphe avec des sauts de ligne
      const textContent = [];
      lines.forEach((line, index) => {
        if (line.trim().length > 0) {
          textContent.push({
            type: 'text',
            text: line.trim()
          });
          if (index < lines.length - 1) {
            textContent.push({
              type: 'hardBreak'
            });
          }
        }
      });
      return {
        type: 'paragraph',
        content: textContent
      };
    }
  });

  return {
    type: 'doc',
    version: 1,
    content: content.length > 0 ? content : [
      {
        type: 'paragraph',
        content: []
      }
    ]
  };
}

async function testPriorityFormats() {
  console.log('🧪 Test des formats de priorité JIRA\n');
  console.log('═'.repeat(60));

  // Récupérer les priorités disponibles
  try {
      const response = await fetch(`${cleanUrl}/rest/api/3/priority`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const priorities = await response.json();
      console.log('📋 Priorités disponibles dans JIRA :\n');
      priorities.forEach((p) => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });
      console.log('\n');
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  // Tester différents formats
  const testFormats = [
    { name: 'Format 1: Objet avec name', priority: { name: 'Medium' } },
    { name: 'Format 2: Objet avec id', priority: { id: '3' } },
    { name: 'Format 3: Chaîne simple', priority: 'Medium' }
  ];

  const descriptionADF = textToADF('Description de test');

  for (const testFormat of testFormats) {
    console.log(`\n🔍 Test: ${testFormat.name}`);
    console.log(`   Format: ${JSON.stringify(testFormat.priority)}`);

    const payload = {
      fields: {
        project: { key: 'OD' },
        summary: `Test Priorité - ${testFormat.name}`,
        description: descriptionADF,
        issuetype: { name: 'Bug' },
        priority: testFormat.priority
      }
    };

    try {
      const response = await fetch(`${cleanUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCÈS ! Ticket créé: ${data.key}`);
        
        // Supprimer le ticket de test
        await fetch(`${cleanUrl}/rest/api/3/issue/${data.key}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        });
        break; // Arrêter après le premier succès
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Échec (${response.status})`);
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors && errorJson.errors.priority) {
            console.log(`   Erreur priorité: ${errorJson.errors.priority}`);
          }
        } catch {
          console.log(`   Réponse: ${errorText.substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }
}

testPriorityFormats();

