#!/usr/bin/env node

/**
 * Script pour importer les entreprises depuis Google Sheets dans Supabase
 * 
 * Actions:
 * 1. Récupère la liste des entreprises du Google Sheets
 * 2. Supprime toutes les entreprises de Supabase sauf "ONPOINT AFRICA GROUP"
 * 3. Importe les entreprises du fichier dans Supabase
 * 
 * Usage:
 *   node scripts/import-companies-from-sheet.mjs
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

// Importer la configuration des entreprises exclues
import { EXCLUDED_COMPANIES, shouldExcludeCompany } from './config/excluded-companies.mjs';

/**
 * Extrait les entreprises uniques du CSV (colonne J - Entreprises)
 * Respecte les filtres appliqués dans Google Sheets
 */
async function extractCompaniesFromSheet() {
  try {
    console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...');
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

    // Trouver l'index de la colonne "Entreprises" (colonne J)
    const headers = records[0];
    const companiesIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('entreprises')
    );

    if (companiesIndex === -1) {
      throw new Error('Colonne "Entreprises" non trouvée');
    }

    console.log(`📋 Colonne identifiée: Entreprises (colonne ${companiesIndex + 1})\n`);

    // Afficher les entreprises exclues
    if (EXCLUDED_COMPANIES.length > 0) {
      console.log('🚫 Entreprises exclues (filtrées dans Google Sheets):');
      EXCLUDED_COMPANIES.forEach((name, idx) => {
        console.log(`   ${idx + 1}. ${name}`);
      });
      console.log('');
    }

    // Extraire les entreprises uniques (en excluant celles filtrées)
    const companiesSet = new Set();
    const excludedCount = new Map();

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      if (row.length <= companiesIndex) continue;

      const company = row[companiesIndex]?.trim();
      
      // Vérifier si l'entreprise doit être exclue
      if (shouldExcludeCompany(company)) {
        if (company) {
          excludedCount.set(company, (excludedCount.get(company) || 0) + 1);
        }
        continue;
      }

      companiesSet.add(company);
    }

    const companies = Array.from(companiesSet).sort();
    
    console.log(`✅ ${companies.length} entreprises uniques trouvées dans le fichier (après exclusion des filtres)\n`);
    
    if (excludedCount.size > 0) {
      console.log('📊 Entreprises exclues par les filtres:');
      Array.from(excludedCount.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
          console.log(`   - ${name}: ${count} occurrence(s)`);
        });
      console.log('');
    }

    return companies;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error.message);
    throw error;
  }
}

/**
 * Récupère l'ID de "ONPOINT AFRICA GROUP"
 */
async function getOnpointAfricaGroupId() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('name', 'ONPOINT AFRICA GROUP')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('ONPOINT AFRICA GROUP n\'existe pas dans Supabase');
    }
    throw new Error(`Erreur lors de la récupération: ${error.message}`);
  }

  return data.id;
}

/**
 * Supprime toutes les entreprises sauf "ONPOINT AFRICA GROUP"
 */
async function deleteAllCompaniesExceptOnpoint() {
  console.log('🗑️  Suppression des entreprises (sauf ONPOINT AFRICA GROUP)...\n');

  const onpointId = await getOnpointAfricaGroupId();
  console.log(`   ✅ ONPOINT AFRICA GROUP trouvé (ID: ${onpointId})\n`);

  // Récupérer toutes les entreprises sauf ONPOINT AFRICA GROUP
  const { data: companiesToDelete, error: fetchError } = await supabase
    .from('companies')
    .select('id, name')
    .neq('id', onpointId);

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération des entreprises: ${fetchError.message}`);
  }

  if (!companiesToDelete || companiesToDelete.length === 0) {
    console.log('   ℹ️  Aucune entreprise à supprimer\n');
    return;
  }

  console.log(`   📋 ${companiesToDelete.length} entreprises à supprimer\n`);

  // Supprimer les entreprises une par une pour gérer les erreurs
  let deletedCount = 0;
  let errorCount = 0;

  for (const company of companiesToDelete) {
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id);

    if (deleteError) {
      console.error(`   ❌ Erreur lors de la suppression de "${company.name}": ${deleteError.message}`);
      errorCount++;
    } else {
      deletedCount++;
      console.log(`   ✅ Supprimé: ${company.name}`);
    }
  }

  console.log(`\n   📊 Résultat: ${deletedCount} supprimées, ${errorCount} erreurs\n`);
}

/**
 * Vérifie si une entreprise existe déjà dans Supabase
 */
async function companyExists(name) {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification: ${error.message}`);
  }

  return data !== null;
}

/**
 * Crée une entreprise dans Supabase
 */
async function createCompany(name) {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name })
    .select('id, name')
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de "${name}": ${error.message}`);
  }

  return data;
}

/**
 * Importe les entreprises du fichier dans Supabase
 * Ne importe que les entreprises non filtrées
 */
async function importCompaniesFromSheet() {
  console.log('📥 Import des entreprises depuis le fichier...\n');
  console.log('ℹ️  Les entreprises filtrées dans Google Sheets seront automatiquement exclues\n');

  const sheetCompanies = await extractCompaniesFromSheet();

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const companyName of sheetCompanies) {
    try {
      // Vérifier si l'entreprise existe déjà
      const exists = await companyExists(companyName);

      if (exists) {
        console.log(`   ⏭️  Déjà présente: ${companyName}`);
        skippedCount++;
        continue;
      }

      // Créer l'entreprise
      const created = await createCompany(companyName);
      console.log(`   ✅ Créée: ${created.name}`);
      createdCount++;
    } catch (error) {
      console.error(`   ❌ Erreur pour "${companyName}": ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n   📊 Résultat:`);
  console.log(`      ✅ ${createdCount} créées`);
  console.log(`      ⏭️  ${skippedCount} déjà présentes`);
  console.log(`      ❌ ${errorCount} erreurs\n`);
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('═'.repeat(80));
    console.log('🚀 IMPORT DES ENTREPRISES DEPUIS GOOGLE SHEETS');
    console.log('═'.repeat(80));
    console.log('');

    // Étape 1: Supprimer toutes les entreprises sauf ONPOINT AFRICA GROUP
    await deleteAllCompaniesExceptOnpoint();

    // Étape 2: Importer les entreprises du fichier
    await importCompaniesFromSheet();

    // Étape 3: Vérification finale
    console.log('═'.repeat(80));
    console.log('🔍 VÉRIFICATION FINALE');
    console.log('═'.repeat(80));
    console.log('');

    const { data: finalCompanies, error: finalError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true });

    if (finalError) {
      throw new Error(`Erreur lors de la vérification finale: ${finalError.message}`);
    }

    console.log(`✅ Total d'entreprises dans Supabase: ${finalCompanies.length}\n`);
    console.log('📋 Liste des entreprises:');
    finalCompanies.forEach((company, idx) => {
      console.log(`   ${idx + 1}. ${company.name}`);
    });

    console.log('\n═'.repeat(80));
    console.log('✅ Import terminé avec succès');
    console.log('═'.repeat(80));
    console.log('');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
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

