import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Télécharge un CSV depuis une URL Google Sheets
 */
async function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Téléchargement depuis: ${url}`);
    
    https.get(url, (res) => {
      if (res.statusCode === 307 || res.statusCode === 302) {
        // Suivre la redirection
        const redirectUrl = res.headers.location;
        console.log(`🔄 Redirection vers: ${redirectUrl}`);
        return downloadCSV(redirectUrl).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Erreur HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Reconstruit les lignes complètes (gère les retours à la ligne dans les champs)
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

/**
 * Parse une date française ou ISO
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Format français: "20/juil./25 16:22"
  const frenchMatch = dateStr.match(/(\d{1,2})\/(\w+)\.\/(\d{2})\s+(\d{1,2}):(\d{2})/);
  if (frenchMatch) {
    const [, day, month, year, hour, minute] = frenchMatch;
    const monthMap = {
      'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04',
      'mai': '05', 'juin': '06', 'juil': '07', 'août': '08',
      'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12'
    };
    const monthNum = monthMap[month.toLowerCase()] || '01';
    const fullYear = '20' + year;
    return `${fullYear}-${monthNum}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00.000Z`;
  }
  
  // Format ISO déjà
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr;
  }
  
  return null;
}

async function main() {
  // Construire l'URL d'export CSV directement
  const SHEET_ID = '1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM';
  const GID = '239102801';
  const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  const OUTPUT_MD = join(__dirname, '..', 'docs', 'ticket', 'analyse-assistance-tickets-from-sheet.md');
  const TEMP_CSV = join(__dirname, '..', 'temp_assistance_tickets.csv');

  try {
    console.log('📥 Téléchargement du CSV depuis Google Sheets...');
    const csvContent = await downloadCSV(googleSheetUrl);
    writeFileSync(TEMP_CSV, csvContent, 'utf-8');
    console.log(`✅ CSV téléchargé: ${TEMP_CSV}`);

    const lines = reconstructCSVLines(csvContent);
    if (lines.length < 2) {
      console.log('⚠️ Le fichier CSV est vide ou ne contient pas d\'en-têtes.');
      return;
    }

    const header = parseCSVLine(lines[0]);
    console.log('📋 En-têtes du CSV:', header);
    console.log(`📊 Nombre de colonnes: ${header.length}`);

    // Identifier les indices des colonnes
    const colIndices = {
      jiraIssueKey: header.findIndex(h => h.includes('Clé de ticket') || h.includes('Clé')),
      title: header.findIndex(h => h.includes('Résumé')),
      description: header.findIndex(h => h.includes('Description')),
      reporter: header.findIndex(h => h.includes('Rapporteur')),
      client: header.findIndex(h => h.includes('Client')),
      contactUser: header.findIndex(h => h.includes('Interlocuteur')),
      jobTitle: header.findIndex(h => h.includes('Poste')),
      module: header.findIndex(h => h.includes('Module')),
      canal: header.findIndex(h => h.includes('Canal')),
      reporterId: header.findIndex(h => h.includes('ID de rapporteur')),
      createdAt: header.findIndex(h => h.includes('Création')),
      updatedAt: header.findIndex(h => h.includes('Mise à jour')),
      action: header.findIndex(h => h.includes('Action menée')),
      recordedDate: header.findIndex(h => h.includes('Date d\'enregistrement')),
      duration: header.findIndex(h => h.includes('Durée')),
      ticketId: header.findIndex(h => h.includes('ID de ticket')),
      ticketType: header.findIndex(h => h.includes('Type de ticket')),
      status: header.findIndex(h => h.includes('État') || h.includes('Etat')),
      projectKey: header.findIndex(h => h.includes('Clé de projet')),
      projectName: header.findIndex(h => h.includes('Nom du projet')),
      priority: header.findIndex(h => h.includes('Priorité')),
      mainObject: header.findIndex(h => h.includes('Objet principal')),
      direction: header.findIndex(h => h.includes('Sens')),
      statusCategory: header.findIndex(h => h.includes('Catégorie d\'état')),
      statusCategoryModified: header.findIndex(h => h.includes('Catégorie d\'état modifiée')),
      submodule: header.findIndex(h => h.includes('Sous-Module')),
    };

    console.log('🔍 Indices des colonnes:', JSON.stringify(colIndices, null, 2));

    // Parser les tickets
    const tickets = [];
    const uniqueValues = {
      ticketTypes: new Set(),
      statuses: new Set(),
      modules: new Set(),
      canals: new Set(),
      priorities: new Set(),
      directions: new Set(),
      mainObjects: new Set(),
      statusCategories: new Set(),
      companies: new Set(),
      reporters: new Set(),
      contactUsers: new Set(),
    };

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      
      if (fields.length < 3) continue;

      const ticket = {
        jiraIssueKey: fields[colIndices.jiraIssueKey]?.trim() || '',
        title: fields[colIndices.title]?.trim() || '',
        description: fields[colIndices.description]?.trim() || '',
        reporter: fields[colIndices.reporter]?.trim() || '',
        client: fields[colIndices.client]?.trim() || '',
        contactUser: fields[colIndices.contactUser]?.trim() || '',
        jobTitle: fields[colIndices.jobTitle]?.trim() || '',
        module: fields[colIndices.module]?.trim() || '',
        canal: fields[colIndices.canal]?.trim() || '',
        reporterId: fields[colIndices.reporterId]?.trim() || '',
        createdAt: parseDate(fields[colIndices.createdAt]?.trim() || ''),
        updatedAt: parseDate(fields[colIndices.updatedAt]?.trim() || ''),
        action: fields[colIndices.action]?.trim() || '',
        recordedDate: parseDate(fields[colIndices.recordedDate]?.trim() || ''),
        duration: fields[colIndices.duration]?.trim() || '',
        ticketId: fields[colIndices.ticketId]?.trim() || '',
        ticketType: fields[colIndices.ticketType]?.trim() || '',
        status: fields[colIndices.status]?.trim() || '',
        projectKey: fields[colIndices.projectKey]?.trim() || '',
        projectName: fields[colIndices.projectName]?.trim() || '',
        priority: fields[colIndices.priority]?.trim() || '',
        mainObject: fields[colIndices.mainObject]?.trim() || '',
        direction: fields[colIndices.direction]?.trim() || '',
        statusCategory: fields[colIndices.statusCategory]?.trim() || '',
        statusCategoryModified: fields[colIndices.statusCategoryModified]?.trim() || '',
        submodule: fields[colIndices.submodule]?.trim() || '',
      };

      if (!ticket.jiraIssueKey || ticket.jiraIssueKey === '') {
        continue;
      }

      tickets.push(ticket);
      
      // Collecter les valeurs uniques
      if (ticket.ticketType) uniqueValues.ticketTypes.add(ticket.ticketType);
      if (ticket.status) uniqueValues.statuses.add(ticket.status);
      if (ticket.module) uniqueValues.modules.add(ticket.module);
      if (ticket.canal) uniqueValues.canals.add(ticket.canal);
      if (ticket.priority) uniqueValues.priorities.add(ticket.priority);
      if (ticket.direction) uniqueValues.directions.add(ticket.direction);
      if (ticket.mainObject) uniqueValues.mainObjects.add(ticket.mainObject);
      if (ticket.statusCategory) uniqueValues.statusCategories.add(ticket.statusCategory);
      if (ticket.client) uniqueValues.companies.add(ticket.client);
      if (ticket.reporter) uniqueValues.reporters.add(ticket.reporter);
      if (ticket.contactUser) uniqueValues.contactUsers.add(ticket.contactUser);
    }

    console.log(`✅ ${tickets.length} tickets parsés`);

    // Générer le rapport
    const report = `# Analyse des Tickets d'Assistance depuis Google Sheet

**Date d'analyse:** ${new Date().toISOString().split('T')[0]}
**Source:** Google Sheet (GID: 239102801)
**Total de tickets:** ${tickets.length}

## 📊 Statistiques Générales

- **Tickets analysés:** ${tickets.length}
- **Tickets avec clé JIRA:** ${tickets.filter(t => t.jiraIssueKey).length}
- **Tickets avec entreprise:** ${tickets.filter(t => t.client).length}
- **Tickets avec contact utilisateur:** ${tickets.filter(t => t.contactUser).length}
- **Tickets avec rapporteur:** ${tickets.filter(t => t.reporter).length}

## 🔍 Colonnes Identifiées

${header.map((h, i) => `${i + 1}. **${h}** (index: ${i})`).join('\n')}

## 📋 Valeurs Uniques par Champ

### Type de Ticket
${Array.from(uniqueValues.ticketTypes).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Statuts
${Array.from(uniqueValues.statuses).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Modules
${Array.from(uniqueValues.modules).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Canaux
${Array.from(uniqueValues.canals).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Priorités
${Array.from(uniqueValues.priorities).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Sens/Direction
${Array.from(uniqueValues.directions).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Objet Principal
${Array.from(uniqueValues.mainObjects).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Catégories d'État
${Array.from(uniqueValues.statusCategories).sort().map(v => `- ${v}`).join('\n') || '- (vide)'}

### Entreprises (Clients)
${Array.from(uniqueValues.companies).sort().slice(0, 20).map(v => `- ${v}`).join('\n')}${uniqueValues.companies.size > 20 ? `\n... et ${uniqueValues.companies.size - 20} autres` : ''}

### Rapporteurs
${Array.from(uniqueValues.reporters).sort().slice(0, 20).map(v => `- ${v}`).join('\n')}${uniqueValues.reporters.size > 20 ? `\n... et ${uniqueValues.reporters.size - 20} autres` : ''}

### Utilisateurs Contact
${Array.from(uniqueValues.contactUsers).sort().slice(0, 20).map(v => `- ${v}`).join('\n')}${uniqueValues.contactUsers.size > 20 ? `\n... et ${uniqueValues.contactUsers.size - 20} autres` : ''}

## 📝 Exemples de Tickets

${tickets.slice(0, 5).map((t, i) => `
### Ticket ${i + 1}: ${t.jiraIssueKey}
- **Titre:** ${t.title}
- **Type:** ${t.ticketType}
- **Statut:** ${t.status}
- **Client:** ${t.client}
- **Contact:** ${t.contactUser} (${t.jobTitle})
- **Module:** ${t.module}
- **Canal:** ${t.canal}
- **Priorité:** ${t.priority}
- **Sens:** ${t.direction}
- **Objet principal:** ${t.mainObject}
- **Durée:** ${t.duration} min
- **Créé le:** ${t.createdAt || 'N/A'}
- **Mis à jour le:** ${t.updatedAt || 'N/A'}
`).join('\n')}

## ❓ Questions de Clarification

### 1. Type de Ticket
- Tous les tickets ont le type "Interaction" → Doivent-ils être mappés vers le type \`Assistance\` dans Supabase ?
- Ou faut-il créer un nouveau type \`Interaction\` ?

### 2. Clé JIRA
- Les clés sont au format \`OBCS-XXXXX\` (pas \`OD-XXXXX\`)
- Ces tickets sont-ils dans le même projet JIRA que les BUG/REQ ?
- Faut-il les traiter différemment ?

### 3. Champ "Sens" (Entrant/Sortant)
- Ce champ n'existe pas dans le schéma Supabase actuel
- Faut-il l'ignorer ou l'ajouter comme nouveau champ ?

### 4. Champ "Durée" (en minutes)
- Ce champ n'existe pas dans le schéma Supabase actuel
- Faut-il l'ignorer ou l'ajouter comme nouveau champ ?

### 5. Champ "Action menée"
- Ce champ semble contenir des informations sur l'action effectuée (ex: "Explication en ligne")
- Faut-il l'ajouter à la description ou créer un nouveau champ ?

### 6. Champ "Objet principal" = "Assistance"
- Tous les tickets semblent avoir "Assistance" comme objet principal
- Faut-il utiliser ce champ pour différencier les tickets d'assistance des autres ?

### 7. Module Mapping
- Les modules dans le CSV sont: ${Array.from(uniqueValues.modules).join(', ')}
- Comment les mapper vers les modules Supabase existants ?

### 8. Canal Mapping
- Les canaux sont: ${Array.from(uniqueValues.canals).join(', ')}
- Comment les mapper vers l'enum \`canal_t\` existant ?

### 9. Priorité Mapping
- Les priorités sont: ${Array.from(uniqueValues.priorities).join(', ')}
- Comment les mapper vers l'enum \`priority_t\` existant ?

### 10. Statut Mapping
- Les statuts sont: ${Array.from(uniqueValues.statuses).join(', ')}
- Faut-il utiliser des statuts dynamiques JIRA comme pour les autres tickets ?

### 11. Entreprise (Client)
- Tous les tickets ont un client spécifique
- Faut-il définir \`affects_all_companies = false\` et lier chaque ticket à son entreprise ?

### 12. Contact Utilisateur
- Les tickets ont un "Interlocuteur" (contact utilisateur)
- Faut-il lier ce champ à \`contact_user_id\` dans Supabase ?

### 13. Sous-Module
- Certains tickets ont un sous-module dans "Sous-Module(s) (ancien)"
- Faut-il utiliser ce champ ou l'ignorer ?

### 14. Date d'enregistrement vs Date de création
- Il y a deux dates: "Création" et "Date d'enregistrement"
- Laquelle utiliser pour \`created_at\` ?

## 🎯 Plan d'Intégration Proposé

### Étape 1: Clarification des règles
- Répondre aux questions ci-dessus
- Valider le mapping des champs

### Étape 2: Adaptation du schéma (si nécessaire)
- Ajouter les champs manquants (Sens, Durée, Action menée) si nécessaire
- Ou décider de les ignorer

### Étape 3: Création du script de synchronisation
- Adapter \`scripts/sync-tickets-from-google-sheet.mjs\` pour les tickets d'assistance
- Gérer le format OBCS-XXXXX
- Mapper les champs selon les règles validées

### Étape 4: Génération de la migration SQL
- Créer une migration SQL pour UPSERT les tickets d'assistance
- Gérer les conflits sur \`jira_issue_key\`

### Étape 5: Application de la migration
- Appliquer la migration via Supabase (web interface ou CLI selon la taille)

## 📌 Notes Importantes

- Ces tickets sont différents des BUG/REQ précédents
- Ils ont un format de clé différent (OBCS vs OD)
- Ils ont des champs supplémentaires (Sens, Durée, Action)
- Ils sont tous de type "Interaction" / "Assistance"
`;

    writeFileSync(OUTPUT_MD, report, 'utf-8');
    console.log(`\n✅ Rapport généré: ${OUTPUT_MD}`);
    console.log(`📊 Total: ${tickets.length} tickets d'assistance analysés`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

