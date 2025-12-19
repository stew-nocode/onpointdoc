/**
 * Script pour corriger les dates des tickets d'assistance (version avec split)
 * Génère plusieurs fichiers de migration pour éviter les limites de taille
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SHEET_ID = '1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM';
const GID = '239102801';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
const BATCH_SIZE = 500; // Nombre de UPDATE par fichier

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

async function fixDatesSplit() {
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
    
    // Parser les tickets
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
      
      const createdAtParsed = parseDate(createdAtRaw);
      const updatedAtParsed = parseDate(updatedAtRaw);
      
      if (createdAtParsed || updatedAtParsed) {
        withDates++;
        updates.push({
          jiraKey,
          createdAt: createdAtParsed,
          updatedAt: updatedAtParsed
        });
      } else {
        withoutDates++;
      }
    }
    
    console.log(`\n📊 Statistiques:`);
    console.log(`  Tickets parsés: ${parsed}`);
    console.log(`  Avec dates: ${withDates}`);
    console.log(`  Sans dates: ${withoutDates}`);
    
    // Créer le dossier pour les fichiers split
    const outputDir = join(__dirname, '..', 'supabase', 'migrations', 'fix-dates-split');
    mkdirSync(outputDir, { recursive: true });
    
    // Diviser en batches
    const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
    console.log(`\n📦 Division en ${totalBatches} fichiers de ${BATCH_SIZE} UPDATE chacun...`);
    
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const startIdx = batchNum * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, updates.length);
      const batch = updates.slice(startIdx, endIdx);
      
      const sqlUpdates = batch.map(u => {
        const updates = [];
        if (u.createdAt) updates.push(`created_at = '${u.createdAt}'::timestamptz`);
        if (u.updatedAt) updates.push(`updated_at = '${u.updatedAt}'::timestamptz`);
        
        return `UPDATE tickets SET ${updates.join(', ')} WHERE jira_issue_key = '${u.jiraKey}';`;
      }).join('\n');
      
      const migrationSQL = `-- OnpointDoc - Correction des dates des tickets d'assistance (PARTIE ${batchNum + 1})
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: Met à jour les dates de création et mise à jour depuis le Google Sheet
-- Partie ${batchNum + 1} sur ${totalBatches} (tickets ${startIdx + 1} à ${endIdx} sur ${updates.length})

${sqlUpdates}
`;
      
      const outputFile = join(outputDir, `2025-12-09-fix-assistance-tickets-dates-part-${String(batchNum + 1).padStart(2, '0')}.sql`);
      writeFileSync(outputFile, migrationSQL, 'utf-8');
      
      console.log(`  ✅ Partie ${batchNum + 1}/${totalBatches}: ${batch.length} tickets → ${outputFile}`);
    }
    
    console.log(`\n✅ ${totalBatches} fichiers de migration générés dans: ${outputDir}`);
    console.log(`\n💡 Pour appliquer les migrations, exécutez-les dans l'ordre (part-01, part-02, etc.)`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixDatesSplit();

