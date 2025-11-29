#!/usr/bin/env node

/**
 * Script pour examiner tous les champs d'un ticket OD et trouver
 * le champ "Lien de ticket sortant (Duplicate)"
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

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
console.log('🔍 EXAMEN DES CHAMPS D\'UN TICKET OD');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

async function examineTicketFields(ticketKey = 'OD-2373') {
  try {
    console.log(`📥 Récupération du ticket ${ticketKey} avec tous les champs et les noms...\n`);
    
    const response = await fetch(`${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=*all&expand=names`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur ${response.status}: ${errorText}`);
      return;
    }

    const ticket = await response.json();
    const fields = ticket.fields || {};
    const names = ticket.names || {}; // Mapping des IDs de champs vers leurs noms

    console.log(`✅ Ticket ${ticket.key} récupéré\n`);
    console.log(`📋 Titre: ${fields.summary || 'N/A'}\n`);

    // Rechercher le champ "Lien de ticket sortant (Duplicate)"
    console.log('🔍 Recherche du champ "Lien de ticket sortant (Duplicate)"...\n');
    
    // Méthode 1: Chercher dans les noms de champs (mapping)
    const matchingFieldIds = [];
    for (const [fieldId, fieldName] of Object.entries(names)) {
      const normalizedName = String(fieldName).toLowerCase();
      if (
        normalizedName.includes('lien') && 
        (normalizedName.includes('ticket') || normalizedName.includes('issue')) &&
        (normalizedName.includes('sortant') || normalizedName.includes('outgoing') || normalizedName.includes('outward')) &&
        (normalizedName.includes('duplicate') || normalizedName.includes('duplicata'))
      ) {
        matchingFieldIds.push({ fieldId, fieldName });
      }
    }

    if (matchingFieldIds.length > 0) {
      console.log('✅ Champs correspondants trouvés dans le mapping des noms:\n');
      for (const { fieldId, fieldName } of matchingFieldIds) {
        const fieldValue = fields[fieldId];
        console.log(`   📌 ${fieldName} (${fieldId}):`);
        console.log(`      Valeur: ${JSON.stringify(fieldValue, null, 2).substring(0, 200)}`);
        console.log('');
      }
    } else {
      console.log('⚠️  Aucun champ correspondant trouvé dans le mapping des noms\n');
    }

    // Méthode 2: Chercher dans les issue links pour "Duplicate"
    console.log('🔍 Recherche dans les Issue Links...\n');
    const issueLinks = fields.issuelinks || [];
    if (issueLinks.length > 0) {
      console.log(`   📋 ${issueLinks.length} Issue Link(s) trouvé(s):\n`);
      issueLinks.forEach((link, index) => {
        console.log(`   ${index + 1}. Type: ${link.type?.name || 'N/A'}`);
        if (link.outwardIssue) {
          console.log(`      → Outward: ${link.outwardIssue.key} - ${link.outwardIssue.fields?.summary || 'N/A'}`);
        }
        if (link.inwardIssue) {
          console.log(`      ← Inward: ${link.inwardIssue.key} - ${link.inwardIssue.fields?.summary || 'N/A'}`);
        }
        console.log('');
      });

      // Filtrer les liens "Duplicate"
      const duplicateLinks = issueLinks.filter(link => 
        link.type?.name?.toLowerCase().includes('duplicate')
      );
      if (duplicateLinks.length > 0) {
        console.log(`✅ ${duplicateLinks.length} lien(s) "Duplicate" trouvé(s):\n`);
        duplicateLinks.forEach(link => {
          if (link.outwardIssue && link.outwardIssue.key.startsWith('OBCS-')) {
            console.log(`   ${ticket.key} → ${link.outwardIssue.key}`);
          }
        });
        console.log('');
      }
    } else {
      console.log('   ⚠️  Aucun Issue Link trouvé\n');
    }

    // Méthode 3: Lister tous les champs personnalisés avec leurs valeurs
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('📋 TOUS LES CHAMPS PERSONNALISÉS');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    const customFields = [];
    for (const [fieldId, fieldValue] of Object.entries(fields)) {
      if (fieldId.startsWith('customfield_')) {
        const fieldName = names[fieldId] || fieldId;
        customFields.push({ fieldId, fieldName, value: fieldValue });
      }
    }

    customFields.sort((a, b) => a.fieldName.localeCompare(b.fieldName));

    console.log(`📊 ${customFields.length} champs personnalisés trouvés:\n`);
    
    // Afficher tous les champs personnalisés
    for (const { fieldId, fieldName, value } of customFields) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || 'null');
      const preview = valueStr.length > 150 ? valueStr.substring(0, 150) + '...' : valueStr;
      
      // Vérifier si la valeur contient "OBCS-"
      const containsOBCS = valueStr.includes('OBCS-');
      
      console.log(`${containsOBCS ? '🎯' : '   '} ${fieldName}`);
      console.log(`      ID: ${fieldId}`);
      console.log(`      Valeur: ${preview.replace(/\n/g, ' ')}`);
      console.log('');
    }

    // Sauvegarder tous les détails dans un fichier JSON
    const outputPath = path.join(__dirname, '../docs/ticket/od-ticket-fields-analysis.json');
    const analysis = {
      ticketKey: ticket.key,
      ticketSummary: fields.summary,
      names: names,
      fields: Object.keys(fields).reduce((acc, key) => {
        if (key.startsWith('customfield_')) {
          acc[key] = {
            name: names[key] || key,
            value: fields[key]
          };
        }
        return acc;
      }, {}),
      issueLinks: issueLinks.map(link => ({
        type: link.type?.name,
        outwardIssue: link.outwardIssue?.key,
        inwardIssue: link.inwardIssue?.key
      }))
    };

    writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`💾 Analyse complète sauvegardée dans: ${outputPath}\n`);

    console.log('✅ Analyse terminée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Tester avec quelques tickets
const testTickets = ['OD-2373', 'OD-3018', 'OD-3017'];
console.log(`📋 Test avec ${testTickets.length} tickets: ${testTickets.join(', ')}\n\n`);

examineTicketFields(testTickets[0]).then(() => {
  console.log('\n💡 Pour examiner d\'autres tickets, modifiez le script ou passez un autre ticket en paramètre.');
});





