#!/usr/bin/env node

/**
 * Script pour comparer les entreprises du Google Sheets avec Supabase
 * 
 * Usage:
 *   node scripts/compare-companies-sheet-supabase.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'https';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { EXCLUDED_COMPANIES, shouldExcludeCompany } from './config/excluded-companies.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { writeFileSync } from 'node:fs';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

// URL du Google Sheets
const GOOGLE_SHEETS_ID = '1Gc1GQZrdAyac15lS9aUMULvqos1IjcixeF1fpuSEpYQ';
const GID = '100813665';
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${GID}`;

/**
 * Télécharge le CSV depuis Google Sheets
 */
async function downloadCSV() {
  return new Promise((resolve, reject) => {
    const followRedirect = (url) => {
      https.get(url, (response) => {
        // Suivre les redirections
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

/**
 * Extrait les entreprises uniques du CSV (colonne J - Entreprises)
 */
async function extractCompaniesFromSheet() {
  try {
    console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...');
    console.log(`   URL: ${CSV_EXPORT_URL}\n`);
    
    const csvContent = await downloadCSV();

    console.log('📊 Parsing du CSV...');
    const records = parse(csvContent, {
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    });

    if (records.length === 0) {
      throw new Error('Le fichier CSV est vide');
    }

    console.log(`✅ ${records.length} lignes trouvées (incluant l'en-tête)\n`);

    // Trouver l'index de la colonne "Entreprises" (colonne J)
    const headers = records[0];
    const companiesIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('entreprises')
    );

    if (companiesIndex === -1) {
      throw new Error('Colonne "Entreprises" non trouvée');
    }

    console.log(`📋 Colonne identifiée:`);
    console.log(`   - Entreprises: colonne ${companiesIndex + 1} (${headers[companiesIndex]})\n`);

    // Afficher les entreprises exclues
    if (EXCLUDED_COMPANIES.length > 0) {
      console.log('🚫 Entreprises exclues (filtrées dans Google Sheets):');
      EXCLUDED_COMPANIES.forEach((name, idx) => {
        console.log(`   ${idx + 1}. ${name}`);
      });
      console.log('');
    }

    // Extraire les entreprises uniques (en respectant le filtre - les lignes vides sont ignorées)
    const companiesSet = new Set();

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      if (row.length <= companiesIndex) continue;

      const company = row[companiesIndex]?.trim();
      
      // Vérifier si l'entreprise doit être exclue (filtrée dans Google Sheets)
      if (!shouldExcludeCompany(company)) {
        companiesSet.add(company);
      }
    }

    const companies = Array.from(companiesSet).sort();
    console.log(`✅ ${companies.length} entreprises uniques trouvées dans le fichier\n`);

    return companies;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error.message);
    throw error;
  }
}

/**
 * Récupère toutes les entreprises de Supabase
 */
async function getSupabaseCompanies() {
  console.log('🔍 Récupération des entreprises depuis Supabase...\n');
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  console.log(`✅ ${companies.length} entreprises trouvées dans Supabase\n`);
  return companies || [];
}

/**
 * Compare les entreprises et génère un rapport
 */
async function compareCompanies(sheetCompanies, supabaseCompanies) {
  console.log('🔍 Comparaison des entreprises...\n');

  const report = {
    summary: {
      totalInSheet: sheetCompanies.length,
      totalInSupabase: supabaseCompanies.length,
      foundInBoth: 0,
      onlyInSheet: [],
      onlyInSupabase: []
    },
    details: {
      found: [],
      missingInSupabase: [],
      missingInSheet: []
    }
  };

  // Créer un map pour recherche rapide
  const supabaseMap = new Map();
  supabaseCompanies.forEach(c => {
    const key = c.name.toLowerCase().trim();
    supabaseMap.set(key, c);
  });

  const sheetMap = new Map();
  sheetCompanies.forEach(name => {
    const key = name.toLowerCase().trim();
    sheetMap.set(key, name);
  });

  // Vérifier les entreprises du fichier
  for (const sheetCompany of sheetCompanies) {
    const key = sheetCompany.toLowerCase().trim();
    const supabaseCompany = supabaseMap.get(key);

    if (supabaseCompany) {
      report.summary.foundInBoth++;
      report.details.found.push({
        name: sheetCompany,
        supabase_id: supabaseCompany.id,
        jira_company_id: supabaseCompany.jira_company_id
      });
    } else {
      report.summary.onlyInSheet.push(sheetCompany);
      report.details.missingInSupabase.push({
        name: sheetCompany,
        status: '❌ Non trouvée dans Supabase'
      });
    }
  }

  // Vérifier les entreprises de Supabase
  for (const supabaseCompany of supabaseCompanies) {
    const key = supabaseCompany.name.toLowerCase().trim();
    const sheetCompany = sheetMap.get(key);

    if (!sheetCompany) {
      report.summary.onlyInSupabase.push(supabaseCompany.name);
      report.details.missingInSheet.push({
        name: supabaseCompany.name,
        id: supabaseCompany.id,
        jira_company_id: supabaseCompany.jira_company_id,
        status: '⚠️  Non trouvée dans le fichier'
      });
    }
  }

  return report;
}

/**
 * Affiche le rapport
 */
function displayReport(report) {
  console.log('═'.repeat(80));
  console.log('📊 RAPPORT DE COMPARAISON DES ENTREPRISES');
  console.log('═'.repeat(80));
  console.log('');

  console.log('📈 RÉSUMÉ:');
  console.log(`   📋 Entreprises dans le fichier: ${report.summary.totalInSheet}`);
  console.log(`   🗄️  Entreprises dans Supabase: ${report.summary.totalInSupabase}`);
  console.log(`   ✅ Trouvées dans les deux: ${report.summary.foundInBoth}`);
  console.log(`   ⚠️  Uniquement dans le fichier: ${report.summary.onlyInSheet.length}`);
  console.log(`   ⚠️  Uniquement dans Supabase: ${report.summary.onlyInSupabase.length}`);
  console.log('');

  if (report.details.missingInSupabase.length > 0) {
    console.log('═'.repeat(80));
    console.log(`❌ ENTREPRISES DANS LE FICHIER MAIS PAS DANS SUPABASE (${report.details.missingInSupabase.length})`);
    console.log('═'.repeat(80));
    console.log('');
    report.details.missingInSupabase.forEach((company, idx) => {
      console.log(`   ${idx + 1}. ${company.name}`);
    });
    console.log('');
  }

  if (report.details.missingInSheet.length > 0) {
    console.log('═'.repeat(80));
    console.log(`⚠️  ENTREPRISES DANS SUPABASE MAIS PAS DANS LE FICHIER (${report.details.missingInSheet.length})`);
    console.log('═'.repeat(80));
    console.log('');
    report.details.missingInSheet.slice(0, 20).forEach((company, idx) => {
      console.log(`   ${idx + 1}. ${company.name}`);
      if (company.jira_company_id) {
        console.log(`      JIRA ID: ${company.jira_company_id}`);
      }
    });
    if (report.details.missingInSheet.length > 20) {
      console.log(`   ... et ${report.details.missingInSheet.length - 20} autres`);
    }
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log('✅ Rapport terminé');
  console.log('═'.repeat(80));
  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // 1. Extraire les entreprises du Google Sheets
    const sheetCompanies = await extractCompaniesFromSheet();

    // 2. Récupérer les entreprises de Supabase
    const supabaseCompanies = await getSupabaseCompanies();

    // 3. Comparer
    const report = await compareCompanies(sheetCompanies, supabaseCompanies);

    // 4. Afficher le rapport
    displayReport(report);

    // 5. Sauvegarder le rapport en JSON
    const reportPath = path.resolve(process.cwd(), 'docs/analysis/rapport-comparaison-entreprises.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`💾 Rapport sauvegardé dans: ${reportPath}\n`);

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
main()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

