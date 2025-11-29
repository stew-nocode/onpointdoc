#!/usr/bin/env node

/**
 * Script pour trouver les correspondances OD pour les clés OBCS sans correspondance
 * en utilisant le Google Sheet avec colonnes B (OBCS) et C (OD)
 * 
 * Processus:
 * 1. Lit la liste des 62 clés OBCS sans correspondance
 * 2. Télécharge le Google Sheet avec colonnes B (OBCS) et C (OD)
 * 3. Crée un mapping OBCS → OD
 * 4. Prépare la mise à jour de created_by dans Supabase
 * 
 * Usage:
 *   node scripts/find-od-correspondences-from-google-sheet.mjs [--dry-run]
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const DRY_RUN = process.argv.includes('--dry-run');

// URL du Google Sheet avec colonnes B (OBCS) et C (OD)
const GOOGLE_SHEETS_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${GID}`;

// Chemins des fichiers
const OBCS_SANS_CORRESPONDANCE_PATH = path.resolve(__dirname, '../liste-obcs-tous-sans-correspondance.txt');
const RAPPORT_PATH = path.resolve(__dirname, '../docs/ticket/rapport-tickets-sans-correspondance.md');

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔍 RECHERCHE DES CORRESPONDANCES OD DEPUIS GOOGLE SHEET');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

if (DRY_RUN) {
  console.log('⚠️  MODE DRY-RUN : Aucune modification ne sera effectuée\n');
}

/**
 * Télécharge le CSV depuis Google Sheets
 */
async function downloadGoogleSheetCSV() {
  console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...');
  console.log(`   URL: ${CSV_EXPORT_URL}\n`);
  
  try {
    const response = await fetch(CSV_EXPORT_URL);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Le fichier CSV téléchargé est vide');
    }
    
    console.log(`✅ CSV téléchargé (${csvText.length} caractères)\n`);
    return csvText;
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error.message);
    throw error;
  }
}

/**
 * Charge la liste des clés OBCS sans correspondance
 */
function loadOBCSWithoutCorrespondence() {
  if (!existsSync(OBCS_SANS_CORRESPONDANCE_PATH)) {
    throw new Error(`Fichier introuvable: ${OBCS_SANS_CORRESPONDANCE_PATH}`);
  }
  
  const content = readFileSync(OBCS_SANS_CORRESPONDANCE_PATH, 'utf-8');
  const obcsKeys = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && (line.startsWith('OBCS-') || line.startsWith('OBBCS-') || line.startsWith('OBCSS-')))
    .map(key => key.toUpperCase());
  
  return new Set(obcsKeys);
}

/**
 * Parse le rapport pour obtenir l'agent associé à chaque OBCS
 */
function parseRapportForAgents() {
  if (!existsSync(RAPPORT_PATH)) {
    return new Map();
  }
  
  const content = readFileSync(RAPPORT_PATH, 'utf-8');
  const lines = content.split('\n');
  const agentMap = new Map(); // OBCS key → agent name
  
  let currentAgent = null;
  
  for (const line of lines) {
    // Détecter une section d'agent (## Agent Name)
    const agentMatch = line.match(/^##\s+(.+)$/);
    if (agentMatch) {
      currentAgent = agentMatch[1].trim();
      continue;
    }
    
    // Détecter une ligne de ticket (OBCS-XXXX - Title)
    if (currentAgent && line.trim() && !line.startsWith('#')) {
      const ticketMatch = line.match(/^(OBCS-?\d+|OBBCS-?\d+|OBCSS-?\d+)\s*-/i);
      if (ticketMatch) {
        const obcsKey = ticketMatch[1].toUpperCase();
        agentMap.set(obcsKey, currentAgent);
      }
    }
  }
  
  return agentMap;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // 1. Charger la liste des OBCS sans correspondance
    console.log('📖 Chargement de la liste des OBCS sans correspondance...');
    const obcsWithoutCorrespondence = loadOBCSWithoutCorrespondence();
    console.log(`✅ ${obcsWithoutCorrespondence.size} clés OBCS à rechercher\n`);
    
    // 2. Charger le mapping agent → OBCS depuis le rapport
    console.log('📖 Chargement du mapping agent → OBCS depuis le rapport...');
    const agentMap = parseRapportForAgents();
    console.log(`✅ ${agentMap.size} tickets mappés à des agents\n`);
    
    // 3. Télécharger le Google Sheet
    const csvText = await downloadGoogleSheetCSV();
    
    // 4. Parser le CSV SANS headers pour utiliser les indices de colonnes directement
    // Colonne B = index 1, Colonne C = index 2
    console.log('📋 Parsing du CSV...');
    const records = parse(csvText, {
      columns: false, // Pas de headers, on utilise les indices directement
      skip_empty_lines: true,
      relax_quotes: true,
      trim: true
    });
    
    if (records.length === 0) {
      throw new Error('Aucune donnée trouvée dans le CSV');
    }
    
    console.log(`✅ ${records.length} lignes trouvées dans le CSV\n`);
    
    // 5. Afficher les premières lignes pour comprendre la structure
    console.log('📋 Aperçu des premières lignes (colonne B=index 1, colonne C=index 2):');
    for (let i = 0; i < Math.min(5, records.length); i++) {
      const row = records[i];
      const colB = row[1]?.trim() || '';
      const colC = row[2]?.trim() || '';
      console.log(`   Ligne ${i + 1}: B="${colB.substring(0, 30)}", C="${colC.substring(0, 30)}"`);
    }
    console.log('');
    
    // Utiliser directement les indices : colonne B = OD (index 1), colonne C = OBCS (index 2)
    const OD_COLUMN_INDEX = 1;   // Colonne B = OD
    const OBCS_COLUMN_INDEX = 2; // Colonne C = OBCS
    
    console.log(`✅ Utilisation directe des colonnes B (index ${OBCS_COLUMN_INDEX}) et C (index ${OD_COLUMN_INDEX})\n`);
    
    // 6. Extraire le mapping depuis les colonnes B (index 1) et C (index 2)
    console.log('🔍 Extraction du mapping OBCS → OD depuis les colonnes B et C...\n');
    
    const correspondences = new Map(); // obcsKey → { odKey, agent }
    let rowsWithData = 0;
    let rowsWithOBCS = 0;
    
    // Afficher quelques exemples
    console.log('📋 Exemples de données trouvées (5 premières lignes avec OBCS):');
    let examplesShown = 0;
    
    for (const record of records) {
      // Colonne B (index 1) = OD, Colonne C (index 2) = OBCS
      const odKey = record[OD_COLUMN_INDEX]?.trim() || '';
      const obcsKeyRaw = record[OBCS_COLUMN_INDEX]?.trim() || '';
      
      if (!obcsKeyRaw && !odKey) {
        continue;
      }
      
      rowsWithData++;
      
      // Vérifier si c'est une clé OBCS valide
      const obcsMatch = obcsKeyRaw.match(/^(?:OBCS|OBBCS|OBCSS)-?\d+/i);
      if (!obcsMatch) {
        continue;
      }
      
      rowsWithOBCS++;
      const obcsKey = obcsMatch[0].toUpperCase();
      
      // Afficher des exemples
      if (examplesShown < 5) {
        console.log(`   ${obcsKey} → ${odKey || 'N/A'}`);
        examplesShown++;
      }
      
      // Vérifier si cette clé OBCS est dans notre liste sans correspondance
      if (obcsWithoutCorrespondence.has(obcsKey)) {
        const agent = agentMap.get(obcsKey) || 'INCONNU';
        
        // Vérifier que la clé OD commence bien par OD-
        if (odKey && odKey.startsWith('OD-')) {
          // Ne garder que la première correspondance trouvée
          if (!correspondences.has(obcsKey)) {
            correspondences.set(obcsKey, {
              odKey: odKey,
              obcsKey: obcsKey,
              agent: agent
            });
            console.log(`   ✅ Trouvé: ${obcsKey} → ${odKey} (Agent: ${agent})`);
          }
        }
      }
    }
    
    if (examplesShown > 0) {
      console.log('');
    }
    
    console.log(`📊 Statistiques:`);
    console.log(`   • Lignes avec données: ${rowsWithData}`);
    console.log(`   • Lignes avec clés OBCS: ${rowsWithOBCS}`);
    console.log('');
    
    console.log(`\n📊 Statistiques:`);
    console.log(`   • Lignes avec données OBCS/OD: ${rowsWithData}`);
    console.log(`   • Correspondances trouvées: ${correspondences.size} sur ${obcsWithoutCorrespondence.size} recherchées\n`);
    
    if (correspondences.size === 0) {
      console.log('⚠️  Aucune correspondance trouvée dans le Google Sheet.\n');
      console.log('💡 Vérifiez que les colonnes B et C contiennent bien les clés OBCS et OD.\n');
      return;
    }
    
    // 6. Sauvegarder le mapping
    const mappingPath = path.resolve(__dirname, '../docs/ticket/od-correspondences-found-from-sheet.json');
    const mappingArray = Array.from(correspondences.entries()).map(([obcsKey, data]) => ({
      obcsKey,
      odKey: data.odKey,
      agent: data.agent
    }));
    writeFileSync(mappingPath, JSON.stringify(mappingArray, null, 2), 'utf-8');
    console.log(`💾 Mapping sauvegardé dans: ${mappingPath}\n`);
    
    // 7. Afficher le résumé
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ DES CORRESPONDANCES TROUVÉES');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    const byAgent = new Map();
    for (const [obcsKey, data] of correspondences.entries()) {
      if (!byAgent.has(data.agent)) {
        byAgent.set(data.agent, []);
      }
      byAgent.get(data.agent).push({ obcsKey, odKey: data.odKey });
    }
    
    for (const [agent, tickets] of byAgent.entries()) {
      console.log(`\n${agent} (${tickets.length} ticket(s)):`);
      tickets.forEach(({ obcsKey, odKey }) => {
        console.log(`   ${obcsKey} → ${odKey}`);
      });
    }
    
    console.log('\n');
    console.log('📝 Pour mettre à jour created_by dans Supabase, utilisez les scripts update-*-tickets-created-by.mjs');
    console.log('   avec les nouvelles correspondances OD trouvées.\n');
    
    // 8. Liste des OBCS toujours sans correspondance
    const foundOBCS = new Set(correspondences.keys());
    const stillWithout = Array.from(obcsWithoutCorrespondence).filter(key => 
      !foundOBCS.has(key) && !correspondences.has(key)
    );
    
    if (stillWithout.length > 0) {
      console.log(`⚠️  ${stillWithout.length} clé(s) OBCS toujours sans correspondance:`);
      stillWithout.slice(0, 10).forEach(key => console.log(`   • ${key}`));
      if (stillWithout.length > 10) {
        console.log(`   ... et ${stillWithout.length - 10} autres`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
