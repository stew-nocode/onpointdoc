#!/usr/bin/env node

/**
 * Script pour extraire les clés OBCS des tickets créés par Edwige KOUASSI depuis Google Sheets
 * 
 * Usage:
 *   node scripts/extract-edwige-obcs-keys.mjs
 *   node scripts/extract-edwige-obcs-keys.mjs --output liste-obcs.txt
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
 * Parse le CSV et extrait les clés OBCS des tickets créés par Edwige KOUASSI
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
  // - Colonne pour le créateur/rapporteur (peut être "Créé par", "Rapporteur", "Nom du rapporteur", etc.)
  // - Colonne pour la clé OBCS (peut être "Clé de ticket", "Ticket Key", "OBCS Key", etc.)
  
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
  
  // Filtrer sur Edwige KOUASSI et extraire les clés OBCS
  const obcsKeys = [];
  const edwigeVariants = ['edwige', 'kouassi', 'edwige kouassi', 'ekouassi'];
  
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
    
    // Vérifier si le créateur correspond à Edwige KOUASSI (insensible à la casse)
    const creatorLower = creator.toLowerCase();
    const isEdwige = edwigeVariants.some(variant => creatorLower.includes(variant));
    
    if (isEdwige && obcsKey && obcsKey.startsWith('OBCS-')) {
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
  
  console.log('🔍 EXTRACTION DES CLÉS OBCS - TICKETS CRÉÉS PAR EDWIGE KOUASSI\n');
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
      console.warn('⚠️  Aucune clé OBCS trouvée pour Edwige KOUASSI');
      console.warn('   Vérifiez que le filtre Google Sheets est bien appliqué sur Edwige KOUASSI');
      process.exit(1);
    }
    
    // 3. Afficher les clés trouvées
    console.log('🔑 Clés OBCS extraites:');
    obcsKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
    console.log('');
    
    // 4. Sauvegarder dans un fichier si demandé
    if (outputFile) {
      const content = obcsKeys.join('\n') + '\n';
      writeFileSync(outputFile, content, 'utf-8');
      console.log(`✅ Clés OBCS sauvegardées dans: ${outputFile}`);
      console.log('');
    }
    
    // 5. Afficher la commande pour mettre à jour
    console.log('🚀 Pour mettre à jour les tickets, exécutez:');
    console.log('');
    console.log(`   # Option 1: Liste directe`);
    console.log(`   node scripts/update-edwige-tickets-created-by.mjs --obcs ${obcsKeys.slice(0, 3).join(',')}${obcsKeys.length > 3 ? '...' : ''}`);
    console.log('');
    
    if (outputFile || !outputFile) {
      const defaultFile = outputFile || 'liste-obcs-edwige.txt';
      if (!outputFile) {
        writeFileSync(defaultFile, obcsKeys.join('\n') + '\n', 'utf-8');
        console.log(`✅ Fichier créé automatiquement: ${defaultFile}`);
        console.log('');
      }
      console.log(`   # Option 2: Fichier texte`);
      console.log(`   node scripts/update-edwige-tickets-created-by.mjs --file ${defaultFile}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

main();

