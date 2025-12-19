/**
 * Script de diagnostic pour vérifier l'extraction des dates depuis le Google Sheet
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHEET_ID = '1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM';
const GID = '239102801';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);
  return fields;
}

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
  
  // Format date seule: "20/07/2025" ou "20-07-2025"
  const dateOnlyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dateOnlyMatch) {
    const [, day, month, year] = dateOnlyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
  }
  
  return null;
}

async function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 307 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
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

async function debugDates() {
  try {
    console.log('📥 Téléchargement du CSV depuis Google Sheets...');
    const csvData = await downloadCSV(CSV_URL);
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.error('❌ Le CSV ne contient pas assez de lignes');
      return;
    }
    
    // Parser l'en-tête
    const header = parseCSVLine(lines[0]);
    console.log('\n📋 Colonnes trouvées dans le CSV:');
    header.forEach((col, idx) => {
      console.log(`  [${idx}] "${col}"`);
    });
    
    // Trouver les colonnes de dates
    const colIndices = {
      jiraIssueKey: header.findIndex(h => h.includes('Clé') || h.includes('Jira') || h.includes('Issue')),
      createdAt: header.findIndex(h => h.includes('Création')),
      updatedAt: header.findIndex(h => h.includes('Mise à jour')),
      recordedDate: header.findIndex(h => h.includes('Date d\'enregistrement') || h.includes('Enregistrement')),
    };
    
    console.log('\n🔍 Indices des colonnes de dates:');
    console.log('  JIRA Key:', colIndices.jiraIssueKey);
    console.log('  Création:', colIndices.createdAt);
    console.log('  Mise à jour:', colIndices.updatedAt);
    console.log('  Date d\'enregistrement:', colIndices.recordedDate);
    
    // Analyser les 10 premières lignes de données
    console.log('\n📊 Analyse des 10 premières lignes de données:');
    for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
      const fields = parseCSVLine(lines[i]);
      const jiraKey = fields[colIndices.jiraIssueKey]?.trim() || '';
      
      if (!jiraKey) continue;
      
      const createdAtRaw = fields[colIndices.createdAt]?.trim() || '';
      const updatedAtRaw = fields[colIndices.updatedAt]?.trim() || '';
      const recordedDateRaw = fields[colIndices.recordedDate]?.trim() || '';
      
      const createdAtParsed = parseDate(createdAtRaw);
      const updatedAtParsed = parseDate(updatedAtRaw);
      const recordedDateParsed = parseDate(recordedDateRaw);
      
      console.log(`\n  Ticket ${jiraKey}:`);
      console.log(`    Création (raw): "${createdAtRaw}" → (parsed): ${createdAtParsed || 'NULL'}`);
      console.log(`    Mise à jour (raw): "${updatedAtRaw}" → (parsed): ${updatedAtParsed || 'NULL'}`);
      console.log(`    Enregistrement (raw): "${recordedDateRaw}" → (parsed): ${recordedDateParsed || 'NULL'}`);
    }
    
    // Compter les tickets avec/sans dates
    let withDates = 0;
    let withoutDates = 0;
    let total = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      const jiraKey = fields[colIndices.jiraIssueKey]?.trim() || '';
      if (!jiraKey) continue;
      
      total++;
      const createdAtRaw = fields[colIndices.createdAt]?.trim() || '';
      const createdAtParsed = parseDate(createdAtRaw);
      
      if (createdAtParsed) {
        withDates++;
      } else {
        withoutDates++;
        if (withoutDates <= 5) {
          console.log(`\n⚠️  Ticket sans date parsable: ${jiraKey}, valeur brute: "${createdAtRaw}"`);
        }
      }
    }
    
    console.log(`\n📈 Statistiques:`);
    console.log(`  Total de tickets: ${total}`);
    console.log(`  Avec dates parsables: ${withDates}`);
    console.log(`  Sans dates parsables: ${withoutDates}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

debugDates();

