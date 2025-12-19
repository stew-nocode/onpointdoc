#!/usr/bin/env node

/**
 * Script pour vérifier si ROADMAP était dans le fichier Google Sheets
 */

import https from 'https';
import { parse } from 'csv-parse/sync';

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

async function checkRoadmap() {
  try {
    console.log('📥 Téléchargement du fichier CSV...\n');
    const csvContent = await downloadCSV();

    console.log('📊 Parsing du CSV...\n');
    const records = parse(csvContent, {
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    });

    const headers = records[0];
    const companiesIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('entreprises')
    );

    if (companiesIndex === -1) {
      throw new Error('Colonne "Entreprises" non trouvée');
    }

    console.log(`📋 Colonne Entreprises: ${companiesIndex + 1}\n`);

    // Chercher ROADMAP dans toutes les lignes
    const roadmapOccurrences = [];
    
    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      if (row.length <= companiesIndex) continue;

      const company = row[companiesIndex]?.trim();
      
      if (company && company.toUpperCase() === 'ROADMAP') {
        roadmapOccurrences.push({
          row: i + 1,
          company: company,
          ticketKey: row[0] || 'N/A',
          summary: row[1] || 'N/A'
        });
      }
    }

    console.log('═'.repeat(80));
    console.log('🔍 RÉSULTAT DE LA RECHERCHE');
    console.log('═'.repeat(80));
    console.log('');

    if (roadmapOccurrences.length === 0) {
      console.log('❌ ROADMAP n\'a PAS été trouvé dans le fichier CSV téléchargé');
      console.log('   → Cela signifie que le filtre Google Sheets l\'a exclu\n');
    } else {
      console.log(`✅ ROADMAP trouvé ${roadmapOccurrences.length} fois dans le fichier:\n`);
      roadmapOccurrences.forEach((occ, idx) => {
        console.log(`   ${idx + 1}. Ligne ${occ.row}:`);
        console.log(`      - Entreprise: ${occ.company}`);
        console.log(`      - Ticket: ${occ.ticketKey}`);
        console.log(`      - Résumé: ${occ.summary.substring(0, 60)}...`);
        console.log('');
      });
    }

    // Vérifier aussi toutes les entreprises uniques
    const companiesSet = new Set();
    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      if (row.length <= companiesIndex) continue;
      const company = row[companiesIndex]?.trim();
      if (company && 
          company !== '' && 
          company.toLowerCase() !== 'non enregistré' &&
          company.toLowerCase() !== 'non renseigné' &&
          company.toLowerCase() !== 'all') {
        companiesSet.add(company);
      }
    }

    const companies = Array.from(companiesSet).sort();
    console.log('═'.repeat(80));
    console.log(`📋 Total d'entreprises uniques dans le fichier: ${companies.length}`);
    console.log('═'.repeat(80));
    console.log('');
    
    if (companies.includes('ROADMAP')) {
      console.log('✅ ROADMAP est dans la liste des entreprises uniques');
    } else {
      console.log('❌ ROADMAP n\'est PAS dans la liste des entreprises uniques');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkRoadmap()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });





