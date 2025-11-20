/* eslint-disable no-console */
/**
 * Test final de création JIRA avec les corrections (ADF + Priority ID)
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

// Fonction textToADF (copie de celle dans adf-parser.ts)
function textToADF(text) {
  if (!text || text.trim().length === 0) {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }

  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const content = paragraphs.map((paragraph) => {
    const trimmedParagraph = paragraph.trim();
    const lines = trimmedParagraph.split('\n');
    
    if (lines.length === 1) {
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
      const textContent = [];
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          textContent.push({
            type: 'text',
            text: trimmedLine
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
        content: textContent.length > 0 ? textContent : []
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

async function testFixedCreation() {
  console.log('🧪 Test de création JIRA avec corrections (ADF + Priority ID)\n');
  console.log('═'.repeat(60));

  // Simuler les données du ticket qui a échoué
  const descriptionText = `is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets 

---

**Contexte Client** : is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets 
**Canal** : Whatsapp
**Produit** : OBC
**Module** : CRM
**Type de bug** : Mauvais déversement des données`;

  const descriptionADF = textToADF(descriptionText);

  const payload = {
    fields: {
      project: { key: 'OD' },
      summary: 'test',
      description: descriptionADF,
      issuetype: { name: 'Bug' },
      priority: { id: '3' }, // Medium (Priorité 3)
      labels: ['canal:Whatsapp', 'product:OBC', 'module:CRM']
    }
  };

  console.log('📤 Payload JIRA (corrigé) :');
  console.log(JSON.stringify(payload, null, 2));
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
      body: JSON.stringify(payload)
    });

    console.log(`📊 Statut HTTP: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur lors de la création du ticket JIRA');
      console.error(`   Statut: ${response.status}`);
      console.error(`   Réponse: ${errorText}\n`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('📋 Détails de l\'erreur :');
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        // Pas de JSON
      }
      
      return;
    }

    const jiraData = await response.json();
    console.log('✅ Ticket JIRA créé avec succès !');
    console.log(`   Clé: ${jiraData.key}`);
    console.log(`   ID: ${jiraData.id}\n`);
    
    console.log('📋 Réponse complète :');
    console.log(JSON.stringify(jiraData, null, 2));
    
    console.log('\n✅ Les corrections fonctionnent ! Le ticket a été créé dans JIRA.\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API :');
    console.error(`   ${error.message}\n`);
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

testFixedCreation();

