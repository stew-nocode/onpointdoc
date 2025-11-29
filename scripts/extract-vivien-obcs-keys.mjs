#!/usr/bin/env node

/**
 * Script pour extraire les clés OBCS des tickets créés par Vivien DAKPOGAN
 * depuis le Google Sheet filtré
 * 
 * Usage:
 *   node scripts/extract-vivien-obcs-keys.mjs [--output fichier.txt]
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL du Google Sheet filtré sur Vivien DAKPOGAN
const GOOGLE_SHEETS_ID = '1M3FraNFTqqanqEjaVA0r957KfNUuNARU6mZBERGpnq8';
const GID = '701656857'; // Mettre à jour si différent pour le filtre
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${GID}`;

/**
 * Télécharge le CSV depuis Google Sheets
 */
async function downloadGoogleSheetCSV() {
  console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...');
  
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
 * Parse le CSV et extrait les clés OBCS des tickets créés par Vivien DAKPOGAN
 */
function extractOBCSKeys(csvText) {
  console.log('📋 Parsing du CSV et extraction des clés OBCS...\n');
  
  // ✅ Utiliser csv-parse pour un parsing robuste
  const records = parse(csvText, {
    columns: true, // Première ligne = headers
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true
  });
  
  if (records.length === 0) {
    throw new Error('Aucune donnée trouvée dans le CSV');
  }
  
  // Afficher les colonnes disponibles pour debug
  const firstRecord = records[0];
  console.log('📊 Colonnes disponibles:', Object.keys(firstRecord).join(', '));
  console.log('');
  
  // Chercher les colonnes pertinentes
  const creatorColumn = Object.keys(firstRecord).find(col => 
    col.toLowerCase().includes('créé par') ||
    col.toLowerCase().includes('createur') ||
    col.toLowerCase().includes('rapporteur') ||
    col.toLowerCase().includes('reporter') ||
    (col.toLowerCase().includes('nom') && col.toLowerCase().includes('rapporteur'))
  );
  
  const obcsKeyColumn = Object.keys(firstRecord).find(col => 
    col.toLowerCase().includes('clé de ticket') ||
    col.toLowerCase().includes('ticket key') ||
    col.toLowerCase().includes('obcs') ||
    col.toLowerCase().includes('key')
  );
  
  if (!creatorColumn) {
    console.warn('⚠️  Colonne créateur non trouvée. Colonnes disponibles:', Object.keys(firstRecord).join(', '));
    console.warn('   Le script va tenter de trouver tous les tickets avec des clés OBCS...\n');
  } else {
    console.log(`✅ Colonne créateur trouvée: "${creatorColumn}"`);
  }
  
  if (!obcsKeyColumn) {
    throw new Error(`Colonne clé OBCS non trouvée. Colonnes disponibles: ${Object.keys(firstRecord).join(', ')}`);
  }
  
  console.log(`✅ Colonne clé OBCS trouvée: "${obcsKeyColumn}"`);
  console.log('');
  
  // Filtrer sur Vivien DAKPOGAN et extraire les clés OBCS
  const obcsKeys = [];
  const vivienVariants = ['vivien', 'dakpogan', 'vivien dakpogan'];
  
  for (const record of records) {
    const creator = record[creatorColumn]?.trim() || '';
    const obcsKey = record[obcsKeyColumn]?.trim() || '';
    
    // Si pas de colonne créateur, prendre tous les tickets avec clés OBCS (sheet déjà filtré)
    if (!creatorColumn) {
      if (obcsKey && (obcsKey.startsWith('OBCS-') || obcsKey.startsWith('OBBCS-') || obcsKey.startsWith('OBCSS-'))) {
        obcsKeys.push(obcsKey);
      }
      continue;
    }
    
    // Vérifier si le créateur correspond à Vivien DAKPOGAN (insensible à la casse)
    const creatorLower = creator.toLowerCase();
    const isVivien = vivienVariants.some(variant => creatorLower.includes(variant));
    
    if (isVivien && obcsKey && (obcsKey.startsWith('OBCS-') || obcsKey.startsWith('OBBCS-') || obcsKey.startsWith('OBCSS-'))) {
      obcsKeys.push(obcsKey);
    }
  }
  
  // Supprimer les doublons
  const uniqueOBCSKeys = [...new Set(obcsKeys)];
  
  return {
    obcsKeys: uniqueOBCSKeys,
    creatorColumn,
    obcsKeyColumn,
    totalRecords: records.length
  };
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const outputFile = args.includes('--output') 
    ? args[args.indexOf('--output') + 1] 
    : null;
  
  console.log('🔍 EXTRACTION DES CLÉS OBCS - TICKETS CRÉÉS PAR Vivien DAKPOGAN\n');
  console.log(`📎 Google Sheet: ${CSV_EXPORT_URL}\n`);
  
  try {
    // 1. Télécharger le CSV
    const csvText = await downloadGoogleSheetCSV();
    
    // 2. Extraire les clés OBCS
    const { obcsKeys, creatorColumn, obcsKeyColumn, totalRecords } = extractOBCSKeys(csvText);
    
    console.log(`📊 Résultats:`);
    console.log(`   • Total de lignes dans le CSV: ${totalRecords}`);
    console.log(`   • Clés OBCS uniques trouvées: ${obcsKeys.length}\n`);
    
    if (obcsKeys.length === 0) {
      console.warn('⚠️  Aucune clé OBCS trouvée. Vérifiez le filtre du Google Sheet.');
      process.exit(1);
    }
    
    // 3. Afficher un aperçu
    console.log('📋 Aperçu des clés OBCS (10 premières):');
    obcsKeys.slice(0, 10).forEach(key => {
      console.log(`   • ${key}`);
    });
    if (obcsKeys.length > 10) {
      console.log(`   ... et ${obcsKeys.length - 10} autres`);
    }
    console.log('');
    
    // 4. Sauvegarder dans un fichier
    const outputPath = outputFile 
      ? path.resolve(process.cwd(), outputFile)
      : path.resolve(__dirname, '../liste-obcs-vivien.txt');
    
    const content = obcsKeys.join('\n') + '\n';
    writeFileSync(outputPath, content, 'utf-8');
    
    console.log(`✅ ${obcsKeys.length} clés OBCS sauvegardées dans: ${outputPath}`);
    console.log('');
    console.log('📝 Utilisation suivante:');
    console.log(`   node scripts/update-vivien-tickets-created-by.mjs --file ${path.basename(outputPath)}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

