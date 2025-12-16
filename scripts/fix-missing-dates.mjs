/**
 * Script pour corriger les dates manquantes des tickets d'assistance
 * 
 * Ce script :
 * 1. Lit le CSV de l'export JIRA
 * 2. Identifie les tickets qui n'ont pas de created_at dans les migrations
 * 3. Génère des UPDATE statements pour corriger ces dates
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMP_CSV = join(__dirname, '..', 'temp_jira_export.csv');
const OUTPUT_DIR = join(__dirname, '..', 'supabase', 'migrations', 'fix-missing-dates');

/**
 * Parse une date française au format "07/déc./25 10:51" en ISO 8601 UTC
 */
function parseFrenchDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Format français: "07/déc./25 10:51" ou "07/déc/25 10:51" ou "14/févr./25 17:50" ou "31/août/25 19:36"
  // Regex améliorée pour capturer les mois avec accents et points
  const frenchMatch = dateStr.match(/(\d{1,2})\/([a-zéèêàûô]+)\.?\/(\d{2})\s+(\d{1,2}):(\d{2})/i);
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

async function main() {
  try {
    console.log('🔍 Correction des dates manquantes des tickets d\'assistance\n');
    
    // 1. Lire le CSV
    console.log('📖 Lecture du CSV...');
    const csvText = readFileSync(TEMP_CSV, 'utf-8');
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const rows = lines.map(line => parseCSVLine(line));
    
    if (rows.length < 2) {
      throw new Error('Le CSV doit contenir au moins un en-tête et une ligne de données');
    }
    
    const headers = rows[0];
    console.log(`✅ ${rows.length - 1} lignes de données trouvées\n`);
    
    // 2. Identifier les colonnes
    const colIndices = {
      jiraIssueKey: headers.findIndex(h => h.includes('Clé de ticket') || h.includes('Clé')),
      ticketType: headers.findIndex(h => h.includes('Type de ticket')),
      created: headers.findIndex(h => h === 'Création' || h.includes('Création'))
    };
    
    if (colIndices.jiraIssueKey < 0 || colIndices.created < 0) {
      throw new Error('Colonnes essentielles non trouvées');
    }
    
    // 3. Récupérer la liste des tickets avec date 2025-12-09 depuis Supabase
    // On va utiliser une liste hardcodée pour l'instant (402 tickets)
    console.log('🔍 Filtrage des tickets avec date 2025-12-09...');
    
    // Liste des tickets à corriger (récupérée depuis la base de données)
    const ticketsToFix = new Set([
      'OBCS-10559', 'OBCS-10560', 'OBCS-10561', 'OBCS-10566', 'OBCS-10567', 'OBCS-10568', 'OBCS-10570',
      'OBCS-10571', 'OBCS-10572', 'OBCS-10573', 'OBCS-10574', 'OBCS-10575', 'OBCS-10576', 'OBCS-10577',
      'OBCS-10578', 'OBCS-10579', 'OBCS-10582', 'OBCS-10583', 'OBCS-10584', 'OBCS-10587', 'OBCS-10589',
      'OBCS-10590', 'OBCS-10592', 'OBCS-10602', 'OBCS-10603', 'OBCS-10608', 'OBCS-10618', 'OBCS-10619',
      'OBCS-10620', 'OBCS-10640', 'OBCS-10641', 'OBCS-10642', 'OBCS-10643', 'OBCS-10644', 'OBCS-10646',
      'OBCS-10647', 'OBCS-10648', 'OBCS-10649', 'OBCS-10650', 'OBCS-10651', 'OBCS-10652', 'OBCS-10653',
      'OBCS-10654', 'OBCS-10655', 'OBCS-10656', 'OBCS-10657', 'OBCS-10658', 'OBCS-10659', 'OBCS-10660',
      'OBCS-10661', 'OBCS-10663', 'OBCS-10664', 'OBCS-10665', 'OBCS-10666', 'OBCS-10667', 'OBCS-10668',
      'OBCS-10669', 'OBCS-10698', 'OBCS-10709', 'OBCS-10710', 'OBCS-10711', 'OBCS-10712', 'OBCS-10713',
      'OBCS-10714', 'OBCS-10715', 'OBCS-10716', 'OBCS-10717', 'OBCS-10718', 'OBCS-10719', 'OBCS-10720',
      'OBCS-10721', 'OBCS-10722', 'OBCS-10723', 'OBCS-10724', 'OBCS-10730', 'OBCS-10731', 'OBCS-10733',
      'OBCS-10734', 'OBCS-10739', 'OBCS-10741', 'OBCS-10743', 'OBCS-10745', 'OBCS-10760', 'OBCS-10761',
      'OBCS-10765', 'OBCS-10766', 'OBCS-10769', 'OBCS-10772', 'OBCS-10774', 'OBCS-10775', 'OBCS-10778',
      'OBCS-10779', 'OBCS-10780', 'OBCS-10782', 'OBCS-10783', 'OBCS-10784', 'OBCS-10785', 'OBCS-10786',
      'OBCS-10787', 'OBCS-10788', 'OBCS-10790', 'OBCS-10791', 'OBCS-6324', 'OBCS-6325', 'OBCS-6326',
      'OBCS-6339', 'OBCS-6340', 'OBCS-6341', 'OBCS-6342', 'OBCS-6344', 'OBCS-6345', 'OBCS-6346',
      'OBCS-6347', 'OBCS-6348', 'OBCS-6354', 'OBCS-6355', 'OBCS-6356', 'OBCS-6357', 'OBCS-6358',
      'OBCS-6360', 'OBCS-6361', 'OBCS-6362', 'OBCS-6369', 'OBCS-6379', 'OBCS-6384', 'OBCS-6399',
      'OBCS-6400', 'OBCS-6401', 'OBCS-6405', 'OBCS-6406', 'OBCS-6407', 'OBCS-6413', 'OBCS-6414',
      'OBCS-6417', 'OBCS-6437', 'OBCS-6442', 'OBCS-6444', 'OBCS-6470', 'OBCS-6473', 'OBCS-6482',
      'OBCS-6483', 'OBCS-6484', 'OBCS-6486', 'OBCS-6487', 'OBCS-6488', 'OBCS-6489', 'OBCS-6490',
      'OBCS-6506', 'OBCS-6514', 'OBCS-6515', 'OBCS-6516', 'OBCS-6517', 'OBCS-6518', 'OBCS-6519',
      'OBCS-6520', 'OBCS-6521', 'OBCS-6522', 'OBCS-6523', 'OBCS-6524', 'OBCS-6525', 'OBCS-6526',
      'OBCS-6527', 'OBCS-6530', 'OBCS-6532', 'OBCS-6542', 'OBCS-6543', 'OBCS-6544', 'OBCS-6546',
      'OBCS-6566', 'OBCS-6600', 'OBCS-6602', 'OBCS-6606', 'OBCS-6607', 'OBCS-6608', 'OBCS-6609',
      'OBCS-6610', 'OBCS-6611', 'OBCS-6612', 'OBCS-6615', 'OBCS-6616', 'OBCS-6617', 'OBCS-6627',
      'OBCS-6630', 'OBCS-6632', 'OBCS-6633', 'OBCS-7965', 'OBCS-7966', 'OBCS-7967', 'OBCS-7976',
      'OBCS-7978', 'OBCS-7980', 'OBCS-7981', 'OBCS-7982', 'OBCS-7983', 'OBCS-7984', 'OBCS-7985',
      'OBCS-7986', 'OBCS-7987', 'OBCS-7988', 'OBCS-7989', 'OBCS-7990', 'OBCS-7991', 'OBCS-7992',
      'OBCS-7996', 'OBCS-8003', 'OBCS-8004', 'OBCS-8005', 'OBCS-8006', 'OBCS-8007', 'OBCS-8008',
      'OBCS-8009', 'OBCS-8010', 'OBCS-8011', 'OBCS-8012', 'OBCS-8013', 'OBCS-8014', 'OBCS-8029',
      'OBCS-8030', 'OBCS-8031', 'OBCS-8032', 'OBCS-8033', 'OBCS-8034', 'OBCS-8036', 'OBCS-8037',
      'OBCS-8038', 'OBCS-8055', 'OBCS-8056', 'OBCS-8057', 'OBCS-8058', 'OBCS-8059', 'OBCS-8060',
      'OBCS-8062', 'OBCS-8063', 'OBCS-8064', 'OBCS-8065', 'OBCS-8082', 'OBCS-8094', 'OBCS-8095',
      'OBCS-8097', 'OBCS-8101', 'OBCS-8105', 'OBCS-8108', 'OBCS-8109', 'OBCS-8110', 'OBCS-8111',
      'OBCS-8112', 'OBCS-8113', 'OBCS-8114', 'OBCS-8115', 'OBCS-8116', 'OBCS-8122', 'OBCS-8123',
      'OBCS-8124', 'OBCS-8125', 'OBCS-8127', 'OBCS-8134', 'OBCS-8137', 'OBCS-8148', 'OBCS-8150',
      'OBCS-8151', 'OBCS-8152', 'OBCS-8153', 'OBCS-8163', 'OBCS-8164', 'OBCS-8165', 'OBCS-8166',
      'OBCS-8167', 'OBCS-8168', 'OBCS-8179', 'OBCS-8180', 'OBCS-8181', 'OBCS-8182', 'OBCS-8183',
      'OBCS-8184', 'OBCS-8187', 'OBCS-8189', 'OBCS-8190', 'OBCS-8191', 'OBCS-8192', 'OBCS-8193',
      'OBCS-8194', 'OBCS-8195', 'OBCS-8200', 'OBCS-8201', 'OBCS-8202', 'OBCS-8203', 'OBCS-8204',
      'OBCS-8206', 'OBCS-8207', 'OBCS-8214', 'OBCS-8215', 'OBCS-8216', 'OBCS-8217', 'OBCS-8218',
      'OBCS-8235', 'OBCS-8236', 'OBCS-8237', 'OBCS-8238', 'OBCS-8239', 'OBCS-8240', 'OBCS-8241',
      'OBCS-8242', 'OBCS-8243', 'OBCS-8244', 'OBCS-8245', 'OBCS-8246', 'OBCS-8247', 'OBCS-8248',
      'OBCS-8249', 'OBCS-8250', 'OBCS-8251', 'OBCS-8252', 'OBCS-8253', 'OBCS-8254', 'OBCS-8255',
      'OBCS-8739', 'OBCS-8786', 'OBCS-8787', 'OBCS-8788', 'OBCS-8789', 'OBCS-8790', 'OBCS-8792',
      'OBCS-8793', 'OBCS-8794', 'OBCS-8795', 'OBCS-8796', 'OBCS-8797', 'OBCS-8801', 'OBCS-8802',
      'OBCS-8803', 'OBCS-8804', 'OBCS-8805', 'OBCS-8806', 'OBCS-8807', 'OBCS-8808', 'OBCS-8809',
      'OBCS-8810', 'OBCS-8811', 'OBCS-8812', 'OBCS-8813', 'OBCS-8814', 'OBCS-8815', 'OBCS-8816',
      'OBCS-8830', 'OBCS-8831', 'OBCS-8832', 'OBCS-8833', 'OBCS-8834', 'OBCS-8835', 'OBCS-8837',
      'OBCS-8838', 'OBCS-8839', 'OBCS-8840', 'OBCS-8841', 'OBCS-8842', 'OBCS-8843', 'OBCS-8844',
      'OBCS-8845', 'OBCS-8846', 'OBCS-8847', 'OBCS-8848', 'OBCS-8851', 'OBCS-8852', 'OBCS-8853',
      'OBCS-8854', 'OBCS-8858', 'OBCS-8863', 'OBCS-8864', 'OBCS-8865', 'OBCS-8866', 'OBCS-8872',
      'OBCS-8875', 'OBCS-8876', 'OBCS-8877', 'OBCS-8879', 'OBCS-8892', 'OBCS-8893', 'OBCS-8894',
      'OBCS-8907', 'OBCS-8908', 'OBCS-8909', 'OBCS-8910', 'OBCS-8913', 'OBCS-8914', 'OBCS-8915',
      'OBCS-8916', 'OBCS-8918', 'OBCS-8923', 'OBCS-8924', 'OBCS-8925', 'OBCS-8926', 'OBCS-8927',
      'OBCS-8928', 'OBCS-8929', 'OBCS-8930', 'OBCS-8931', 'OBCS-8932', 'OBCS-8933', 'OBCS-8934',
      'OBCS-8935', 'OBCS-8936', 'OBCS-8937'
    ]);
    
    console.log(`   ℹ️  ${ticketsToFix.size} tickets à corriger\n`);
    
    // 4. Traiter uniquement les tickets à corriger
    console.log('🔄 Traitement des tickets...');
    const updates = [];
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let notFound = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length < headers.length) {
        while (row.length < headers.length) {
          row.push('');
        }
      }
      
      const jiraIssueKey = row[colIndices.jiraIssueKey]?.trim();
      if (!jiraIssueKey || !jiraIssueKey.startsWith('OBCS-')) {
        skipped++;
        continue;
      }
      
      // Ne traiter que les tickets à corriger
      if (!ticketsToFix.has(jiraIssueKey)) {
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
        
        if (createdDate) {
          updates.push({
            jira_issue_key: jiraIssueKey,
            created_at: createdDate
          });
          processed++;
        } else {
          notFound++;
          console.log(`   ⚠️  Date non trouvée pour ${jiraIssueKey}: "${row[colIndices.created]?.trim()}"`);
        }
        
        if (processed % 50 === 0) {
          console.log(`   Progression: ${processed} tickets avec dates trouvés...`);
        }
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${jiraIssueKey}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n   ⚠️  ${notFound} tickets sans date dans le CSV`);
    
    console.log(`\n✅ Traitement terminé:`);
    console.log(`   - Tickets avec dates: ${processed}`);
    console.log(`   - Tickets ignorés: ${skipped}`);
    console.log(`   - Erreurs: ${errors}`);
    
    if (updates.length === 0) {
      console.log('\n⚠️  Aucun ticket à mettre à jour');
      return;
    }
    
    // 4. Générer le fichier SQL de correction
    console.log(`\n📝 Génération du fichier SQL de correction...`);
    
    const sqlStatements = updates.map(update => {
      return `UPDATE tickets SET created_at = '${update.created_at}'::timestamptz WHERE jira_issue_key = '${update.jira_issue_key}';`;
    }).join('\n');
    
    const header = `-- OnpointDoc - Correction des dates manquantes des tickets d'assistance
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: Met à jour created_at pour les tickets qui n'avaient pas de date dans les migrations précédentes
-- Total: ${updates.length} tickets

`;
    
    const sql = header + sqlStatements + '\n';
    
    // Créer le dossier si nécessaire
    try {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    } catch {}
    
    const filename = join(OUTPUT_DIR, `2025-12-09-fix-missing-created-at-dates.sql`);
    writeFileSync(filename, sql, 'utf-8');
    console.log(`   ✅ ${filename} (${updates.length} tickets)`);
    
    console.log(`\n✅ Fichier de correction généré avec succès!`);
    console.log(`\n📋 Résumé:`);
    console.log(`   - Tickets à corriger: ${updates.length}`);
    console.log(`\n⚠️  Prochaine étape:`);
    console.log(`   Appliquer la migration via Supabase MCP ou l'éditeur SQL`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();

