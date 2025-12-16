/**
 * Script pour analyser le Google Sheet d'export JIRA
 * Identifie les colonnes pertinentes pour les dates et autres champs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Google Sheet
const SHEET_ID = '1ASCYRKkEzwneb_14e66LhIZ42inAnugneYw7VMHGvXI';
const GID = '1666703735'; // ID de l'onglet
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const TEMP_CSV = join(__dirname, '..', 'temp_jira_export.csv');
const ANALYSIS_OUTPUT = join(__dirname, '..', 'jira-export-analysis.json');

/**
 * Télécharge un CSV depuis une URL
 */
async function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Téléchargement depuis: ${url}`);
    
    https.get(url, (res) => {
      if (res.statusCode === 307 || res.statusCode === 302) {
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
      res.on('end', () => {
        writeFileSync(TEMP_CSV, data, 'utf-8');
        console.log(`✅ CSV téléchargé: ${TEMP_CSV}`);
        resolve(data);
      });
    }).on('error', reject);
  });
}

/**
 * Parse un CSV simple (gère les guillemets et virgules)
 */
function parseCSV(csvText) {
  const lines = [];
  const rows = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  
  for (const line of lines) {
    const row = [];
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
        row.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    row.push(currentField);
    rows.push(row);
  }
  
  return rows;
}

/**
 * Analyse les colonnes et identifie celles pertinentes
 */
function analyzeColumns(rows) {
  if (rows.length < 2) {
    throw new Error('Le CSV doit contenir au moins un en-tête et une ligne de données');
  }
  
  const headers = rows[0];
  const sampleRow = rows[1];
  
  console.log(`\n📊 Analyse de ${headers.length} colonnes...\n`);
  
  // Identifier les colonnes pertinentes
  const relevantColumns = {
    // Colonnes principales
    jira_issue_key: null,
    ticket_type: null,
    status: null,
    priority: null,
    reporter: null,
    duration: null,
    created: null,
    description: null,
    
    // Colonnes de dates potentielles
    dates: [],
    
    // Autres colonnes intéressantes
    custom_fields: []
  };
  
  // Chercher les colonnes par nom
  headers.forEach((header, index) => {
    const headerLower = header.toLowerCase();
    const value = sampleRow[index];
    
    // Clé JIRA
    if (headerLower.includes('clé') && headerLower.includes('ticket')) {
      relevantColumns.jira_issue_key = { index, name: header, sample: value };
    }
    
    // Type de ticket
    if (headerLower.includes('type') && headerLower.includes('ticket')) {
      relevantColumns.ticket_type = { index, name: header, sample: value };
    }
    
    // État/Status
    if (headerLower === 'état' || headerLower === 'status' || headerLower === 'state') {
      relevantColumns.status = { index, name: header, sample: value };
    }
    
    // Priorité
    if (headerLower === 'priorité' || headerLower === 'priority') {
      relevantColumns.priority = { index, name: header, sample: value };
    }
    
    // Rapporteur
    if (headerLower === 'rapporteur' || headerLower === 'reporter') {
      relevantColumns.reporter = { index, name: header, sample: value };
    }
    
    // Durée
    if (headerLower.includes('durée') || headerLower.includes('duration')) {
      relevantColumns.duration = { index, name: header, sample: value };
    }
    
    // Création
    if (headerLower === 'création' || headerLower === 'creation' || headerLower === 'created') {
      relevantColumns.created = { index, name: header, sample: value };
    }
    
    // Description
    if (headerLower === 'description') {
      relevantColumns.description = { index, name: header, sample: value };
    }
    
    // Dates potentielles
    if (headerLower.includes('date') || 
        headerLower.includes('créé') || 
        headerLower.includes('updated') || 
        headerLower.includes('mise à jour') ||
        headerLower.includes('résolu') ||
        headerLower.includes('resolved')) {
      relevantColumns.dates.push({ index, name: header, sample: value });
    }
    
    // Champs personnalisés
    if (headerLower.includes('champs personnalisés') || headerLower.includes('custom field')) {
      relevantColumns.custom_fields.push({ index, name: header, sample: value });
    }
  });
  
  return { headers, relevantColumns, totalRows: rows.length - 1 };
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🔍 Analyse du Google Sheet d\'export JIRA\n');
    
    // 1. Télécharger le CSV
    const csvText = await downloadCSV(CSV_URL);
    
    // 2. Parser le CSV
    console.log('\n📝 Parsing du CSV...');
    const rows = parseCSV(csvText);
    console.log(`✅ ${rows.length} lignes parsées`);
    
    // 3. Analyser les colonnes
    const analysis = analyzeColumns(rows);
    
    // 4. Afficher les résultats
    console.log('\n' + '='.repeat(80));
    console.log('📋 COLONNES IDENTIFIÉES');
    console.log('='.repeat(80));
    
    console.log('\n✅ Colonnes principales:');
    Object.entries(analysis.relevantColumns).forEach(([key, value]) => {
      if (key !== 'dates' && key !== 'custom_fields' && value) {
        console.log(`   - ${key}: "${value.name}" (colonne ${value.index})`);
        console.log(`     Exemple: ${value.sample?.substring(0, 50) || 'vide'}...`);
      }
    });
    
    console.log('\n📅 Colonnes de dates trouvées:');
    if (analysis.relevantColumns.dates.length > 0) {
      analysis.relevantColumns.dates.forEach(date => {
        console.log(`   - "${date.name}" (colonne ${date.index})`);
        console.log(`     Exemple: ${date.sample || 'vide'}`);
      });
    } else {
      console.log('   ⚠️  Aucune colonne de date identifiée automatiquement');
    }
    
    console.log(`\n📊 Statistiques:`);
    console.log(`   - Total de colonnes: ${analysis.headers.length}`);
    console.log(`   - Total de lignes de données: ${analysis.totalRows}`);
    console.log(`   - Colonnes de dates: ${analysis.relevantColumns.dates.length}`);
    console.log(`   - Champs personnalisés: ${analysis.relevantColumns.custom_fields.length}`);
    
    // 5. Sauvegarder l'analyse
    const output = {
      sheet_url: CSV_URL,
      analysis_date: new Date().toISOString(),
      total_columns: analysis.headers.length,
      total_rows: analysis.totalRows,
      columns: {
        headers: analysis.headers,
        relevant: analysis.relevantColumns
      },
      sample_data: {
        first_row: rows[1] || [],
        second_row: rows[2] || []
      }
    };
    
    writeFileSync(ANALYSIS_OUTPUT, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n💾 Analyse sauvegardée dans: ${ANALYSIS_OUTPUT}`);
    
    // 6. Afficher les premières lignes pour inspection
    console.log('\n' + '='.repeat(80));
    console.log('👀 APERÇU DES DONNÉES (premières 3 lignes)');
    console.log('='.repeat(80));
    
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      console.log(`\nLigne ${i + 1}:`);
      if (analysis.relevantColumns.jira_issue_key) {
        const keyIndex = analysis.relevantColumns.jira_issue_key.index;
        console.log(`   Clé JIRA: ${rows[i][keyIndex]}`);
      }
      if (analysis.relevantColumns.created) {
        const createdIndex = analysis.relevantColumns.created.index;
        console.log(`   Création: ${rows[i][createdIndex]}`);
      }
      if (analysis.relevantColumns.status) {
        const statusIndex = analysis.relevantColumns.status.index;
        console.log(`   État: ${rows[i][statusIndex]}`);
      }
    }
    
    console.log('\n✅ Analyse terminée!');
    console.log(`\n📝 Prochaines étapes:`);
    console.log(`   1. Examiner le fichier ${ANALYSIS_OUTPUT}`);
    console.log(`   2. Identifier les colonnes de dates exactes à utiliser`);
    console.log(`   3. Adapter le script fetch-dates-from-jira.mjs`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();






