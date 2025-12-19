/**
 * Script pour analyser le Google Sheet contenant les tickets à impact global
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM/edit?gid=1192006101#gid=1192006101';

/**
 * Télécharge le CSV depuis Google Sheets
 */
async function downloadCSV(url) {
  // Convertir l'URL d'édition en URL d'export CSV
  const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  const gid = url.match(/gid=(\d+)/)?.[1];
  
  if (!sheetId || !gid) {
    throw new Error('Impossible d\'extraire l\'ID du sheet ou le gid');
  }
  
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  
  console.log(`📥 Téléchargement depuis: ${exportUrl}`);
  
  let response = await fetch(exportUrl);
  
  // Gérer les redirections
  while (response.status === 307 || response.status === 302) {
    const location = response.headers.get('location');
    if (!location) break;
    console.log(`   → Redirection vers: ${location}`);
    response = await fetch(location);
  }
  
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
  }
  
  return await response.text();
}

/**
 * Reconstruit les lignes CSV complètes (gère les retours à la ligne dans les champs)
 */
function reconstructCSVLines(content) {
  const lines = content.split('\n');
  const completeLines = [];
  let currentLine = '';
  let inQuotes = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') {
      continue;
    }

    const quoteCount = (trimmedLine.match(/"/g) || []).length;

    if (inQuotes) {
      currentLine += '\n' + trimmedLine;
      if (quoteCount % 2 === 1) {
        inQuotes = false;
        completeLines.push(currentLine);
        currentLine = '';
      }
    } else {
      if (currentLine) {
        completeLines.push(currentLine);
      }
      currentLine = trimmedLine;
      if (quoteCount % 2 === 1) {
        inQuotes = true;
      } else {
        completeLines.push(currentLine);
        currentLine = '';
      }
    }
  }

  if (currentLine) {
    completeLines.push(currentLine);
  }

  return completeLines;
}

/**
 * Parse une ligne CSV avec gestion des guillemets
 */
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  let escapedQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());
  return fields;
}

async function main() {
  const TEMP_CSV = 'temp_google_sheet_global_tickets.csv';
  const OUTPUT_ANALYSIS = 'docs/ticket/analyse-google-sheet-global-tickets.md';

  try {
    console.log('📥 Téléchargement du CSV depuis Google Sheets...');
    const csvContent = await downloadCSV(GOOGLE_SHEET_URL);
    writeFileSync(TEMP_CSV, csvContent, 'utf-8');
    console.log(`✅ CSV téléchargé: ${TEMP_CSV}`);

    const lines = reconstructCSVLines(csvContent);
    if (lines.length < 2) {
      console.log('⚠️ Le fichier CSV est vide ou ne contient pas d\'en-têtes.');
      return;
    }

    const header = parseCSVLine(lines[0]);
    console.log(`\n📋 En-têtes trouvés (${header.length} colonnes):`);
    header.forEach((h, i) => {
      console.log(`   ${i + 1}. ${h}`);
    });

    // Identifier les colonnes importantes
    const colIndices = {
      jiraIssueKey: header.findIndex(h => h.includes('Clé Ticket IT') || h.includes('Ticket IT')),
      title: header.findIndex(h => h.includes('Résumé')),
      description: header.findIndex(h => h.includes('Description')),
      ticketType: header.findIndex(h => h.includes('Type_Ticket') || h.includes('Type')),
      priority: header.findIndex(h => h.includes('Priorité')),
      canal: header.findIndex(h => h.includes('Canal')),
      status: header.findIndex(h => h.includes('Etat') || h.includes('État')),
      module: header.findIndex(h => h.includes('Module')),
      submodule: header.findIndex(h => h.includes('Sous-Module')),
      feature: header.findIndex(h => h.includes('Fonctionnalité')),
      bugType: header.findIndex(h => h.includes('Type de bug')),
      reporter: header.findIndex(h => h.includes('Rapporteur')),
      users: header.findIndex(h => h.includes('Utilisateurs')),
      company: header.findIndex(h => h.includes('Entreprises') || h.includes('Entreprise')),
      createdAt: header.findIndex(h => h.includes('Date de creation') || h.includes('Date de création')),
      updatedAt: header.findIndex(h => h.includes('Date de mise à jour')),
      resolvedAt: header.findIndex(h => h.includes('Date de résolution')),
    };

    console.log('\n🔍 Indices des colonnes identifiées:');
    Object.entries(colIndices).forEach(([key, value]) => {
      if (value !== -1) {
        console.log(`   ${key}: colonne ${value} (${header[value]})`);
      } else {
        console.log(`   ${key}: NON TROUVÉ`);
      }
    });

    // Analyser les données
    const tickets = [];
    const companies = new Set();
    const statuses = new Set();
    const priorities = new Set();
    const canals = new Set();
    const ticketTypes = new Set();

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      
      if (fields.length < 3) continue;

      const ticket = {
        jiraIssueKey: fields[colIndices.jiraIssueKey]?.trim() || '',
        title: fields[colIndices.title]?.trim() || '',
        company: fields[colIndices.company]?.trim() || '',
      };

      if (ticket.jiraIssueKey && ticket.jiraIssueKey.startsWith('OD-')) {
        tickets.push(ticket);
        if (ticket.company) companies.add(ticket.company);
        
        const status = fields[colIndices.status]?.trim() || '';
        const priority = fields[colIndices.priority]?.trim() || '';
        const canal = fields[colIndices.canal]?.trim() || '';
        const ticketType = fields[colIndices.ticketType]?.trim() || '';
        
        if (status) statuses.add(status);
        if (priority) priorities.add(priority);
        if (canal) canals.add(canal);
        if (ticketType) ticketTypes.add(ticketType);
      }
    }

    console.log(`\n📊 Statistiques:`);
    console.log(`   Total tickets: ${tickets.length}`);
    console.log(`   Entreprises uniques: ${companies.size}`);
    console.log(`   Statuts uniques: ${statuses.size}`);
    console.log(`   Priorités uniques: ${priorities.size}`);
    console.log(`   Canaux uniques: ${canals.size}`);
    console.log(`   Types de tickets uniques: ${ticketTypes.size}`);

    // Vérifier si tous les tickets ont "ALL" comme entreprise
    const allTickets = tickets.filter(t => t.company.toUpperCase() === 'ALL');
    const otherTickets = tickets.filter(t => t.company.toUpperCase() !== 'ALL');

    console.log(`\n🏢 Répartition par entreprise:`);
    console.log(`   Tickets avec "ALL": ${allTickets.length}`);
    console.log(`   Tickets avec autres entreprises: ${otherTickets.length}`);

    if (otherTickets.length > 0) {
      console.log(`\n⚠️ ATTENTION: ${otherTickets.length} tickets n'ont pas "ALL" comme entreprise:`);
      const otherCompanies = new Set(otherTickets.map(t => t.company));
      otherCompanies.forEach(comp => {
        const count = otherTickets.filter(t => t.company === comp).length;
        console.log(`   - ${comp}: ${count} tickets`);
      });
    }

    // Générer le rapport d'analyse
    const analysis = `# Analyse du Google Sheet - Tickets à Impact Global

**Date:** ${new Date().toISOString().split('T')[0]}
**Source:** ${GOOGLE_SHEET_URL}

## 📊 Statistiques Générales

- **Total tickets:** ${tickets.length}
- **Tickets avec "ALL":** ${allTickets.length}
- **Tickets avec autres entreprises:** ${otherTickets.length}

## 🏢 Entreprises

${Array.from(companies).map(c => `- ${c}`).join('\n')}

## 📋 Colonnes Identifiées

${Object.entries(colIndices).map(([key, value]) => {
  if (value !== -1) {
    return `- **${key}**: Colonne ${value} - "${header[value]}"`;
  } else {
    return `- **${key}**: ❌ NON TROUVÉ`;
  }
}).join('\n')}

## 🔍 Valeurs Uniques

### Statuts
${Array.from(statuses).map(s => `- ${s}`).join('\n')}

### Priorités
${Array.from(priorities).map(p => `- ${p}`).join('\n')}

### Canaux
${Array.from(canals).map(c => `- ${c}`).join('\n')}

### Types de Tickets
${Array.from(ticketTypes).map(t => `- ${t}`).join('\n')}

## ⚠️ Questions à Clarifier

1. **Tous les tickets doivent-ils avoir affects_all_companies = true ?**
   - Si oui, tous les tickets doivent avoir company_id = NULL
   - Les tickets avec d'autres entreprises que "ALL" doivent-ils être ignorés ?

2. **Module Global:**
   - Tous les tickets doivent-ils utiliser le module "Global" existant ?
   - submodule_id = NULL et feature_id = NULL ?

3. **Mapping des statuts:**
   - Utiliser les statuts JIRA dynamiques (comme pour le fichier précédent) ?

4. **Utilisateurs contact:**
   - Si le champ "Utilisateurs" est vide, contact_user_id = NULL ?
   - Recherche par nom uniquement (sans filtre de rôle) ?

5. **Dates:**
   - Format des dates dans le CSV ? (ISO ou format français)
   - Gérer les conflits avec les dates JIRA existantes ?

## 📝 Exemples de Tickets

${tickets.slice(0, 5).map((t, i) => `
### Ticket ${i + 1}
- **Clé JIRA:** ${t.jiraIssueKey}
- **Titre:** ${t.title.substring(0, 100)}${t.title.length > 100 ? '...' : ''}
- **Entreprise:** ${t.company}
`).join('\n')}
`;

    writeFileSync(OUTPUT_ANALYSIS, analysis, 'utf-8');
    console.log(`\n✅ Analyse sauvegardée: ${OUTPUT_ANALYSIS}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

