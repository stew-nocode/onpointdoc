#!/usr/bin/env node

/**
 * Script pour analyser un Google Sheets et afficher sa structure
 * 
 * Usage:
 *   node scripts/analyze-google-sheet.mjs
 * 
 * Le script télécharge le CSV depuis Google Sheets et affiche :
 * - Les colonnes disponibles
 * - Les premières lignes de données
 * - Les statistiques (nombre de lignes, valeurs uniques, etc.)
 */

import https from 'https';
import { parse } from 'csv-parse/sync';

// URL du Google Sheets fourni
const GOOGLE_SHEETS_ID = '17FQ2rGWaf5N0YlX01mqbbWrPe5Lct2OkQ1_kCDmFoqw';
const GID = '1586111609';
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${GID}`;

async function downloadCSV() {
  return new Promise((resolve, reject) => {
    const followRedirect = (url) => {
      https.get(url, (response) => {
        // Suivre les redirections (301, 302, 307, 308)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          followRedirect(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download CSV: ${response.statusCode} ${response.statusText}`));
          return;
        }

        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(data);
        });
      }).on('error', (error) => {
        reject(error);
      });
    };

    followRedirect(CSV_EXPORT_URL);
  });
}

async function analyzeSheet() {
  try {
    console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...');
    console.log(`   URL: ${CSV_EXPORT_URL}\n`);
    
    const csvContent = await downloadCSV();

    console.log('📊 Parsing du CSV...');
    const records = parse(csvContent, {
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true, // Gérer le BOM UTF-8
    });

    if (records.length === 0) {
      console.log('⚠️  Le fichier est vide');
      return;
    }

    console.log(`✅ ${records.length} lignes trouvées (incluant l'en-tête)\n`);

    // Afficher les colonnes (première ligne)
    const headers = records[0];
    console.log('═'.repeat(80));
    console.log('📋 COLONNES IDENTIFIÉES');
    console.log('═'.repeat(80));
    headers.forEach((header, index) => {
      const letter = String.fromCharCode(65 + index); // A, B, C, ...
      console.log(`   ${letter.padStart(3)} (${index.toString().padStart(3)}) : ${header || '(vide)'}`);
    });
    console.log('═'.repeat(80));
    console.log(`\n✅ Total: ${headers.length} colonnes\n`);

    // Afficher quelques exemples de données
    const sampleRows = Math.min(5, records.length - 1);
    if (sampleRows > 0) {
      console.log('═'.repeat(80));
      console.log(`📊 EXEMPLES DE DONNÉES (${sampleRows} premières lignes)`);
      console.log('═'.repeat(80));
      
      for (let i = 1; i <= sampleRows; i++) {
        const row = records[i];
        console.log(`\n📄 Ligne ${i}:`);
        headers.forEach((header, index) => {
          const value = row[index] || '(vide)';
          const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
          console.log(`   ${header}: ${displayValue}`);
        });
      }
      console.log('\n');
    }

    // Statistiques par colonne
    console.log('═'.repeat(80));
    console.log('📈 STATISTIQUES PAR COLONNE');
    console.log('═'.repeat(80));
    
    const dataRows = records.slice(1); // Exclure l'en-tête
    headers.forEach((header, index) => {
      const values = dataRows
        .map(row => row[index])
        .filter(val => val && val.trim() !== '');
      
      const uniqueValues = new Set(values);
      
      console.log(`\n${header}:`);
      console.log(`   - Lignes avec valeur: ${values.length}/${dataRows.length}`);
      console.log(`   - Valeurs uniques: ${uniqueValues.size}`);
      
      if (uniqueValues.size > 0 && uniqueValues.size <= 20) {
        console.log(`   - Valeurs: ${Array.from(uniqueValues).slice(0, 10).join(', ')}${uniqueValues.size > 10 ? '...' : ''}`);
      } else if (uniqueValues.size > 20) {
        console.log(`   - Exemples: ${Array.from(uniqueValues).slice(0, 5).join(', ')}...`);
      }
    });

    console.log('\n═'.repeat(80));
    console.log('✅ Analyse terminée');
    console.log('═'.repeat(80));
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Identifier les colonnes à importer');
    console.log('   2. Créer le script d\'import correspondant');
    console.log('   3. Mapper les colonnes vers les tables Supabase\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
analyzeSheet();





