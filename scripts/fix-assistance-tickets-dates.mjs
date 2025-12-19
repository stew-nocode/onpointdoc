/**
 * Script pour corriger les dates des tickets d'assistance
 * Télécharge le CSV depuis Google Sheets et met à jour les dates dans la base
 */

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
  
  // Format français avec point: "20/juil./25 16:22" ou sans point: "29/juin/25 16:51"
  const frenchMatch = dateStr.match(/(\d{1,2})\/(\w+)\.?\/(\d{2})\s+(\d{1,2}):(\d{2})/);
  if (frenchMatch) {
    const [, day, month, year, hour, minute] = frenchMatch;
    const monthNormalized = month.replace(/\.$/, '').toLowerCase();
    const monthMap = {
      'janv': '01', 'janvier': '01',
      'févr': '02', 'février': '02', 'fevr': '02', 'fevrier': '02',
      'mars': '03',
      'avr': '04', 'avril': '04',
      'mai': '05',
      'juin': '06',
      'juil': '07', 'juillet': '07',
      'août': '08', 'aout': '08', 'aoû': '08',
      'sept': '09', 'septembre': '09',
      'oct': '10', 'octobre': '10',
      'nov': '11', 'novembre': '11',
      'déc': '12', 'décembre': '12', 'dec': '12', 'decembre': '12'
    };
    const monthNum = monthMap[monthNormalized] || '01';
    const fullYear = '20' + year;
    return `${fullYear}-${monthNum}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00.000Z`;
  }
  
  // Format ISO déjà
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr;
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

async function fixDates() {
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
    const colIndices = {
      jiraIssueKey: header.findIndex(h => h.includes('Clé') || h.includes('Jira') || h.includes('Issue')),
      createdAt: header.findIndex(h => h.includes('Création')),
      updatedAt: header.findIndex(h => h.includes('Mise à jour')),
      recordedDate: header.findIndex(h => h.includes('Date d\'enregistrement') || h.includes('Enregistrement')),
    };
    
    console.log('🔍 Colonnes trouvées:');
    console.log('  JIRA Key:', colIndices.jiraIssueKey);
    console.log('  Création:', colIndices.createdAt);
    console.log('  Mise à jour:', colIndices.updatedAt);
    console.log('  Date d\'enregistrement:', colIndices.recordedDate);
    
    // Parser les tickets et générer le SQL
    const updates = [];
    let parsed = 0;
    let withDates = 0;
    let withoutDates = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      const jiraKey = fields[colIndices.jiraIssueKey]?.trim() || '';
      
      if (!jiraKey || !jiraKey.startsWith('OBCS-')) continue;
      
      parsed++;
      const createdAtRaw = fields[colIndices.createdAt]?.trim() || '';
      const updatedAtRaw = fields[colIndices.updatedAt]?.trim() || '';
      const recordedDateRaw = fields[colIndices.recordedDate]?.trim() || '';
      
      const createdAtParsed = parseDate(createdAtRaw);
      const updatedAtParsed = parseDate(updatedAtRaw);
      const recordedDateParsed = parseDate(recordedDateRaw);
      
      if (createdAtParsed || updatedAtParsed || recordedDateParsed) {
        withDates++;
        updates.push({
          jiraKey,
          createdAt: createdAtParsed,
          updatedAt: updatedAtParsed,
          recordedDate: recordedDateParsed
        });
      } else {
        withoutDates++;
      }
    }
    
    console.log(`\n📊 Statistiques:`);
    console.log(`  Tickets parsés: ${parsed}`);
    console.log(`  Avec dates: ${withDates}`);
    console.log(`  Sans dates: ${withoutDates}`);
    
    // Générer le SQL de mise à jour
    const sqlUpdates = updates.map(u => {
      const updates = [];
      if (u.createdAt) updates.push(`created_at = '${u.createdAt}'::timestamptz`);
      if (u.updatedAt) updates.push(`updated_at = '${u.updatedAt}'::timestamptz`);
      
      return `UPDATE tickets SET ${updates.join(', ')} WHERE jira_issue_key = '${u.jiraKey}';`;
    }).join('\n');
    
    const migrationSQL = `-- OnpointDoc - Correction des dates des tickets d'assistance
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: Met à jour les dates de création et mise à jour depuis le Google Sheet
-- Total: ${updates.length} tickets à mettre à jour

${sqlUpdates}

-- Vérification
SELECT 
  COUNT(*) FILTER (WHERE DATE(created_at) = '2025-12-09') as tickets_avec_date_aujourdhui,
  COUNT(*) FILTER (WHERE DATE(created_at) != '2025-12-09') as tickets_avec_dates_correctes
FROM tickets
WHERE ticket_type = 'ASSISTANCE' AND old = true;
`;
    
    const outputFile = join(__dirname, '..', 'supabase', 'migrations', `2025-12-09-fix-assistance-tickets-dates.sql`);
    const fs = await import('fs');
    fs.writeFileSync(outputFile, migrationSQL, 'utf-8');
    
    console.log(`\n✅ Migration SQL générée: ${outputFile}`);
    console.log(`   ${updates.length} tickets seront mis à jour`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixDates();

