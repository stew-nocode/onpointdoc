#!/usr/bin/env node

/**
 * Script pour mettre à jour le Google Sheet
 * Remplace "ONPOINT" par "ONPOINT AFRICA GROUP" dans la colonne Entreprises
 * 
 * Note: Ce script génère un rapport des lignes à modifier.
 * Pour modifier automatiquement, vous devez configurer l'API Google Sheets.
 * 
 * Usage:
 *   node scripts/update-sheet-onpoint.mjs
 */

import https from 'https';
import { parse } from 'csv-parse/sync';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const GOOGLE_SHEETS_ID = '1Gc1GQZrdAyac15lS9aUMULvqos1IjcixeF1fpuSEpYQ';
const GID = '100813665';
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${GID}`;

async function downloadCSV() {
  return new Promise((resolve, reject) => {
    const followRedirect = (url) => {
      https.get(url, (response) => {
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

async function findOnpointRows() {
  try {
    console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...\n');
    const csvContent = await downloadCSV();

    console.log('📊 Parsing du CSV...\n');
    const records = parse(csvContent, {
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    });

    if (records.length === 0) {
      throw new Error('Le fichier CSV est vide');
    }

    // Trouver l'index de la colonne "Entreprises" (colonne J)
    const headers = records[0];
    const companiesIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('entreprises')
    );

    if (companiesIndex === -1) {
      throw new Error('Colonne "Entreprises" non trouvée');
    }

    console.log(`📋 Colonne Entreprises: ${companiesIndex + 1}\n`);

    // Trouver toutes les lignes avec "ONPOINT"
    const onpointRows = [];

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      if (row.length <= companiesIndex) continue;

      const company = row[companiesIndex]?.trim();
      
      if (company && company.toUpperCase() === 'ONPOINT') {
        onpointRows.push({
          rowNumber: i + 1, // Numéro de ligne dans le sheet (1-indexed)
          ticketKey: row[0] || 'N/A',
          summary: row[1] || 'N/A',
          company: company
        });
      }
    }

    console.log('═'.repeat(80));
    console.log('🔍 RÉSULTAT DE LA RECHERCHE');
    console.log('═'.repeat(80));
    console.log('');

    if (onpointRows.length === 0) {
      console.log('✅ Aucune ligne avec "ONPOINT" trouvée dans le fichier\n');
      console.log('   Le Google Sheet a peut-être déjà été mis à jour.\n');
      return;
    }

    console.log(`📊 ${onpointRows.length} ligne(s) trouvée(s) avec "ONPOINT":\n`);

    onpointRows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. Ligne ${row.rowNumber}:`);
      console.log(`      - Ticket: ${row.ticketKey}`);
      console.log(`      - Résumé: ${row.summary.substring(0, 60)}...`);
      console.log(`      - Entreprise actuelle: ${row.company}`);
      console.log(`      - À remplacer par: ONPOINT AFRICA GROUP`);
      console.log('');
    });

    // Générer un rapport JSON
    const report = {
      totalRows: onpointRows.length,
      rows: onpointRows,
      instructions: [
        '1. Ouvrez le Google Sheet',
        '2. Allez dans la colonne "Entreprises" (colonne J)',
        `3. Remplacez "ONPOINT" par "ONPOINT AFRICA GROUP" dans ${onpointRows.length} ligne(s)`,
        '4. Les lignes concernées sont listées ci-dessus'
      ]
    };

    const reportPath = path.resolve(process.cwd(), 'docs/analysis/rapport-mise-a-jour-onpoint.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`💾 Rapport sauvegardé dans: ${reportPath}\n`);

    console.log('═'.repeat(80));
    console.log('📝 INSTRUCTIONS POUR METTRE À JOUR LE GOOGLE SHEET');
    console.log('═'.repeat(80));
    console.log('');
    console.log('Option 1: Remplacement manuel');
    console.log('   1. Ouvrez le Google Sheet');
    console.log(`   2. Utilisez Ctrl+H (ou Cmd+H sur Mac) pour ouvrir "Rechercher et remplacer"`);
    console.log('   3. Recherchez: ONPOINT');
    console.log('   4. Remplacez par: ONPOINT AFRICA GROUP');
    console.log('   5. Limitez la recherche à la colonne "Entreprises" (colonne J)');
    console.log('   6. Cliquez sur "Tout remplacer"');
    console.log('');
    console.log('Option 2: Filtre et remplacement');
    console.log('   1. Filtrez la colonne "Entreprises" pour afficher uniquement "ONPOINT"');
    console.log('   2. Sélectionnez toutes les cellules avec "ONPOINT"');
    console.log('   3. Remplacez par "ONPOINT AFRICA GROUP"');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

findOnpointRows()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });





