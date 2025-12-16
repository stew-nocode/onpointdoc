/**
 * Script pour mettre à jour les tickets d'assistance depuis l'export JIRA Google Sheet
 * 
 * Mises à jour:
 * - created_at (depuis "Création")
 * - duration_minutes (depuis "Durée(mn)")
 * - action_menee (nouveau champ depuis "Champs personnalisés (Action menée)")
 * - objet_principal (nouveau champ depuis "Objet principal")
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Google Sheet
const SHEET_ID = '1ASCYRKkEzwneb_14e66LhIZ42inAnugneYw7VMHGvXI';
const GID = '1666703735';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

// Configuration de sortie
const OUTPUT_DIR = join(__dirname, '..', 'supabase', 'migrations', 'update-from-jira-export');
const TEMP_CSV = join(__dirname, '..', 'temp_jira_export.csv');
const BATCH_SIZE = 500; // Nombre de tickets par fichier SQL

// Créer le dossier de sortie si nécessaire
try {
  mkdirSync(OUTPUT_DIR, { recursive: true });
} catch (error) {
  // Le dossier existe déjà
}

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
 * Parse une date française au format "07/déc./25 10:51" en ISO 8601 UTC
 */
function parseFrenchDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Format français: "07/déc./25 10:51" ou "07/déc/25 10:51"
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

/**
 * Parse la durée en minutes (convertit en integer)
 */
function parseDuration(durationStr) {
  if (!durationStr || durationStr.trim() === '') return null;
  
  const cleaned = durationStr.trim().replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed) || parsed < 0) return null;
  
  // Arrondir à l'entier le plus proche
  return Math.round(parsed);
}

/**
 * Échappe une chaîne pour SQL
 */
function escapeSQL(str) {
  if (!str || str.trim() === '') return 'NULL';
  return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * Génère le SQL de migration pour une partie
 */
function generateMigrationSQL(updates, partNumber, totalParts) {
  const header = `-- OnpointDoc - Mise à jour des tickets d'assistance depuis l'export JIRA (PARTIE ${partNumber})
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: Met à jour created_at, duration_minutes, action_menee et objet_principal
-- Partie ${partNumber} sur ${totalParts} (${updates.length} tickets)

`;

  const sqlStatements = updates.map(update => {
    const clauses = [];
    
    // created_at
    if (update.created_at) {
      clauses.push(`created_at = '${update.created_at}'::timestamptz`);
    }
    
    // duration_minutes
    if (update.duration_minutes !== null && update.duration_minutes !== undefined) {
      clauses.push(`duration_minutes = ${update.duration_minutes}`);
    }
    
    // action_menee
    if (update.action_menee !== null && update.action_menee !== undefined) {
      clauses.push(`action_menee = ${escapeSQL(update.action_menee)}`);
    }
    
    // objet_principal
    if (update.objet_principal !== null && update.objet_principal !== undefined) {
      clauses.push(`objet_principal = ${escapeSQL(update.objet_principal)}`);
    }
    
    if (clauses.length === 0) {
      return null; // Pas de mise à jour nécessaire
    }
    
    return `UPDATE tickets SET ${clauses.join(', ')} WHERE jira_issue_key = '${update.jira_issue_key}';`;
  }).filter(stmt => stmt !== null).join('\n');

  return header + sqlStatements + '\n';
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🔍 Mise à jour des tickets d\'assistance depuis l\'export JIRA\n');
    
    // 1. Télécharger le CSV
    const csvText = await downloadCSV(CSV_URL);
    
    // 2. Parser le CSV
    console.log('\n📝 Parsing du CSV...');
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const rows = lines.map(line => parseCSVLine(line));
    
    if (rows.length < 2) {
      throw new Error('Le CSV doit contenir au moins un en-tête et une ligne de données');
    }
    
    const headers = rows[0];
    console.log(`✅ ${rows.length - 1} lignes de données trouvées`);
    console.log(`📊 ${headers.length} colonnes détectées\n`);
    
    // 3. Identifier les indices des colonnes
    const colIndices = {
      jiraIssueKey: headers.findIndex(h => h.includes('Clé de ticket') || h.includes('Clé')),
      ticketType: headers.findIndex(h => h.includes('Type de ticket')),
      status: headers.findIndex(h => h === 'État' || h.includes('État')),
      priority: headers.findIndex(h => h === 'Priorité' || h.includes('Priorité')),
      reporter: headers.findIndex(h => h === 'Rapporteur' || h.includes('Rapporteur')),
      duration: headers.findIndex(h => h.includes('Durée') || h.includes('Duration')),
      created: headers.findIndex(h => h === 'Création' || h.includes('Création')),
      description: headers.findIndex(h => h === 'Description'),
      actionMenee: headers.findIndex(h => h.includes('Action menée') || h.includes('Action menee')),
      canal: headers.findIndex(h => h === 'Canal' || h.includes('Canal')),
      entreprise: headers.findIndex(h => h === 'Entreprise' || h.includes('Entreprise')),
      utilisateur: headers.findIndex(h => h === 'Utilisateur' || h.includes('Utilisateur')),
      objetPrincipal: headers.findIndex(h => h.includes('Objet principal') || h.includes('Objet principal'))
    };
    
    console.log('📋 Colonnes identifiées:');
    Object.entries(colIndices).forEach(([key, index]) => {
      if (index >= 0) {
        console.log(`   - ${key}: "${headers[index]}" (colonne ${index})`);
      }
    });
    console.log('');
    
    // Vérifier les colonnes essentielles
    if (colIndices.jiraIssueKey < 0) {
      throw new Error('Colonne "Clé de ticket" non trouvée');
    }
    if (colIndices.created < 0) {
      throw new Error('Colonne "Création" non trouvée');
    }
    
    // 4. Traiter les tickets
    console.log('🔄 Traitement des tickets...');
    const updates = [];
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length < headers.length) {
        // Compléter avec des valeurs vides si nécessaire
        while (row.length < headers.length) {
          row.push('');
        }
      }
      
      const jiraIssueKey = row[colIndices.jiraIssueKey]?.trim();
      if (!jiraIssueKey || !jiraIssueKey.startsWith('OBCS-')) {
        skipped++;
        continue;
      }
      
      // Filtrer uniquement les tickets de type "Assistance"
      const ticketType = row[colIndices.ticketType]?.trim();
      if (ticketType && !ticketType.toLowerCase().includes('assistance')) {
        skipped++;
        continue;
      }
      
      try {
        const createdDate = parseFrenchDate(row[colIndices.created]?.trim());
        const duration = parseDuration(row[colIndices.duration]?.trim());
        const actionMenee = row[colIndices.actionMenee]?.trim() || null;
        const objetPrincipal = row[colIndices.objetPrincipal]?.trim() || null;
        
        updates.push({
          jira_issue_key: jiraIssueKey,
          created_at: createdDate,
          duration_minutes: duration,
          action_menee: actionMenee,
          objet_principal: objetPrincipal
        });
        
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`   Progression: ${processed} tickets traités...`);
        }
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${jiraIssueKey}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n✅ Traitement terminé:`);
    console.log(`   - Tickets traités: ${processed}`);
    console.log(`   - Tickets ignorés: ${skipped}`);
    console.log(`   - Erreurs: ${errors}`);
    
    if (updates.length === 0) {
      console.log('\n⚠️  Aucun ticket à mettre à jour');
      return;
    }
    
    // 5. Générer les fichiers SQL par batch
    const totalParts = Math.ceil(updates.length / BATCH_SIZE);
    console.log(`\n📝 Génération de ${totalParts} fichier(s) SQL...`);
    
    for (let i = 0; i < totalParts; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, updates.length);
      const batch = updates.slice(start, end);
      
      const sql = generateMigrationSQL(batch, i + 1, totalParts);
      const filename = join(OUTPUT_DIR, `2025-12-09-update-assistance-from-jira-export-part-${String(i + 1).padStart(2, '0')}.sql`);
      
      writeFileSync(filename, sql, 'utf-8');
      console.log(`   ✅ ${filename} (${batch.length} tickets)`);
    }
    
    console.log(`\n✅ Migration générée avec succès!`);
    console.log(`\n📋 Résumé:`);
    console.log(`   - Tickets à mettre à jour: ${updates.length}`);
    console.log(`   - Fichiers générés: ${totalParts}`);
    console.log(`\n⚠️  Prochaine étape:`);
    console.log(`   1. Créer les colonnes action_menee et objet_principal dans Supabase (si nécessaire)`);
    console.log(`   2. Appliquer les migrations via Supabase MCP`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();






