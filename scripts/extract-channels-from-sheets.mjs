#!/usr/bin/env node

/**
 * Script pour extraire tous les canaux uniques du fichier Google Sheets
 * 
 * Usage:
 *   node scripts/extract-channels-from-sheets.mjs
 * 
 * Le script télécharge le CSV depuis Google Sheets et extrait les canaux uniques
 * de la colonne P (index 15, 0-based = 15)
 */

import https from 'https';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const GOOGLE_SHEETS_ID = '1M3FraNFTqqanqEjaVA0r957KfNUuNARU6mZBERGpnq8';
const GID = '701656857';
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${GID}`;

// Index de la colonne Canal (colonne P = index 15, 0-based)
const CANAL_COLUMN_INDEX = 15;

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
          reject(new Error(`Failed to download CSV: ${response.statusCode}`));
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

async function extractChannels() {
  try {
    console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...');
    const csvContent = await downloadCSV();

    console.log('📊 Parsing du CSV...');
    const records = parse(csvContent, {
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true, // Gérer le BOM UTF-8
    });

    console.log(`✅ ${records.length} lignes trouvées`);

    // Extraire les canaux uniques (colonne P, index 15)
    // Ignorer la première ligne (en-têtes)
    const channels = new Set();
    let skippedHeader = false;

    for (const record of records) {
      if (!skippedHeader) {
        skippedHeader = true;
        continue; // Ignorer la ligne d'en-tête
      }

      if (record[CANAL_COLUMN_INDEX]) {
        const canal = record[CANAL_COLUMN_INDEX].trim();
        if (canal && canal !== '') {
          channels.add(canal);
        }
      }
    }

    // Convertir en tableau trié
    const uniqueChannels = Array.from(channels).sort();

    console.log('\n📋 Canaux uniques trouvés dans le fichier:');
    console.log('='.repeat(60));
    uniqueChannels.forEach((channel, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${channel}`);
    });
    console.log('='.repeat(60));
    console.log(`\n✅ Total: ${uniqueChannels.length} canaux uniques\n`);

    // Comparer avec les canaux déjà mappés
    console.log('🔍 Comparaison avec les canaux déjà mappés dans la base:');
    const existingMappings = [
      { jira: 'Appel Téléphonique', supabase: 'Appel' },
      { jira: 'Appel WhatsApp', supabase: 'Whatsapp' },
      { jira: 'Constat Interne', supabase: 'Autre' },
      { jira: 'En présentiel', supabase: 'Autre' },
      { jira: 'Online (Google Meet, Teams...)', supabase: 'Autre' },
    ];

    console.log('\nCanaux déjà mappés:');
    existingMappings.forEach((m) => {
      const found = uniqueChannels.includes(m.jira);
      console.log(`  ${found ? '✅' : '❌'} ${m.jira} → ${m.supabase}`);
    });

    const unmappedChannels = uniqueChannels.filter(
      (ch) => !existingMappings.some((m) => m.jira === ch)
    );

    if (unmappedChannels.length > 0) {
      console.log('\n⚠️  Canaux non mappés:');
      unmappedChannels.forEach((ch) => {
        console.log(`  ❌ ${ch}`);
      });
    } else {
      console.log('\n✅ Tous les canaux sont déjà mappés!');
    }

    return uniqueChannels;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
extractChannels();

