#!/usr/bin/env node

/**
 * Script pour extraire les clés OBCS des tickets créés par EVA BASSE depuis Google Sheets
 * 
 * Usage:
 *   node scripts/extract-eva-obcs-keys.mjs
 *   node scripts/extract-eva-obcs-keys.mjs --output liste-obcs-eva.txt
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';

// URL du Google Sheet fourni par l'utilisateur
const GOOGLE_SHEETS_ID = '1M3FraNFTqqanqEjaVA0r957KfNUuNARU6mZBERGpnq8';
const GID = '701656857'; // Depuis l'URL: gid=701656857
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
 * Parse le CSV et extrait les clés OBCS des tickets créés par EVA BASSE
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
  
  // Filtrer sur EVA BASSE et extraire les clés OBCS
  const obcsKeys = [];
  const evaVariants = ['eva', 'basse', 'eva basse', 'ebasse'];
  
  for (const record of records) {
    const creator = record[creatorColumn]?.trim() || '';
    const obcsKey = record[obcsKeyColumn]?.trim() || '';
    
    // Si pas de colonne créateur, prendre tous les tickets avec clés OBCS
    if (!creatorColumn) {
      if (obcsKey && obcsKey.startsWith('OBCS-')) {
        obcsKeys.push(obcsKey);
      }
      continue;
    }
    
    // Vérifier si le créateur correspond à EVA BASSE (insensible à la casse)
    const creatorLower = creator.toLowerCase();
    const isEva = evaVariants.some(variant => creatorLower.includes(variant));
    
    if (isEva && obcsKey && obcsKey.startsWith('OBCS-')) {
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
  
  console.log('🔍 EXTRACTION DES CLÉS OBCS - TICKETS CRÉÉS PAR EVA BASSE\n');
  console.log(`📎 Google Sheet: ${CSV_EXPORT_URL}\n`);
  
  try {
    // 1. Télécharger le CSV
    const csvText = await downloadGoogleSheetCSV();
    
    // 2. Extraire les clés OBCS
    const { obcsKeys, creatorColumn, obcsKeyColumn, totalRecords } = extractOBCSKeys(csvText);
    
    console.log(`📊 RÉSULTATS:`);
    console.log(`   • Total de lignes dans le CSV: ${totalRecords}`);
    if (creatorColumn) {
      console.log(`   • Colonne créateur: "${creatorColumn}"`);
    }
    console.log(`   • Colonne clé OBCS: "${obcsKeyColumn}"`);
    console.log(`   • Clés OBCS trouvées: ${obcsKeys.length}`);
    console.log('');
    
    if (obcsKeys.length === 0) {
      console.warn('⚠️  Aucune clé OBCS trouvée pour EVA BASSE');
      console.warn('   Vérifiez que le filtre Google Sheets est bien appliqué sur EVA BASSE');
      process.exit(1);
    }
    
    // 3. Afficher les clés trouvées
    console.log('🔑 Clés OBCS extraites:');
    obcsKeys.slice(0, 20).forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
    if (obcsKeys.length > 20) {
      console.log(`   ... et ${obcsKeys.length - 20} autres`);
    }
    console.log('');
    
    // 4. Sauvegarder dans un fichier si demandé
    const defaultFile = outputFile || 'liste-obcs-eva.txt';
    const content = obcsKeys.join('\n') + '\n';
    writeFileSync(defaultFile, content, 'utf-8');
    console.log(`✅ Clés OBCS sauvegardées dans: ${defaultFile}`);
    console.log('');
    
    // 5. Afficher la commande pour mettre à jour
    console.log('🚀 Pour mettre à jour les tickets, exécutez:');
    console.log('');
    console.log(`   node scripts/update-eva-tickets-created-by.mjs --file ${defaultFile}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

main();

