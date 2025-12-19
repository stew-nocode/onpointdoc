#!/usr/bin/env node

/**
 * Script pour importer les utilisateurs depuis Google Sheets
 * 
 * Actions:
 * 1. Extrait les utilisateurs visibles (avec filtre appliqué)
 * 2. Vérifie les doublons dans Supabase
 * 3. Importe les utilisateurs manquants
 * 4. Les rattache à leur entreprise
 * 
 * Usage:
 *   node scripts/import-users-from-sheet.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import https from 'https';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { shouldExcludeCompany } from './config/excluded-companies.mjs';

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
  console.error('❌ Variables d\'environnement manquantes');
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

/**
 * Extrait les utilisateurs du CSV
 */
async function extractUsersFromSheet() {
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

    // Trouver les indices des colonnes
    const headers = records[0];
    const companiesIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('entreprises')
    );
    // Chercher "Utilisateurs" (colonne L) - pas "Rapporteur" (colonne K)
    // Le filtre est appliqué sur la colonne "Utilisateurs"
    const usersIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('utilisateurs') && 
             !col.toLowerCase().includes('ancien')
    );

    if (companiesIndex === -1) {
      throw new Error('Colonne "Entreprises" non trouvée');
    }
    if (usersIndex === -1) {
      throw new Error('Colonne "Utilisateurs" ou "Rapporteur" non trouvée');
    }

    console.log(`📋 Colonnes identifiées:`);
    console.log(`   - Entreprises: colonne ${companiesIndex + 1} (${headers[companiesIndex]})`);
    console.log(`   - Utilisateurs: colonne ${usersIndex + 1} (${headers[usersIndex]})\n`);

    // Extraire les utilisateurs uniques avec leur entreprise
    const usersMap = new Map(); // email -> { name, company }

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      if (row.length <= Math.max(companiesIndex, usersIndex)) continue;

      const company = row[companiesIndex]?.trim();
      const userName = row[usersIndex]?.trim();

      // Ignorer les lignes sans utilisateur ou avec entreprise exclue
      if (!userName || userName === '' || 
          userName.toLowerCase() === 'non renseigné' ||
          userName.toLowerCase() === 'non enregistré') {
        continue;
      }

      // Ignorer si l'entreprise est exclue
      if (shouldExcludeCompany(company)) {
        continue;
      }

      // Normaliser le nom (supprimer les espaces multiples)
      const normalizedName = userName.trim().replace(/\s+/g, ' ');

      // Utiliser le nom comme clé (on gérera les doublons plus tard)
      if (!usersMap.has(normalizedName)) {
        usersMap.set(normalizedName, {
          name: normalizedName,
          company: company || null,
        });
      } else {
        // Si l'utilisateur existe déjà, vérifier l'entreprise
        const existing = usersMap.get(normalizedName);
        if (company && company !== existing.company) {
          console.log(`   ⚠️  Utilisateur "${normalizedName}" avec entreprises différentes: "${existing.company}" vs "${company}"`);
        }
      }
    }

    const users = Array.from(usersMap.values());
    console.log(`✅ ${users.length} utilisateurs uniques trouvés dans le fichier\n`);

    return users;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error.message);
    throw error;
  }
}

/**
 * Vérifie les doublons dans Supabase
 */
async function checkDuplicatesInSupabase() {
  console.log('🔍 Vérification des doublons dans Supabase...\n');

  // Récupérer tous les profils clients
  const { data: clients, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, company_id')
    .eq('role', 'client')
    .order('full_name', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération: ${error.message}`);
  }

  // Détecter les doublons par nom (normalisé)
  const nameMap = new Map();
  const duplicates = [];

  clients.forEach(client => {
    if (!client.full_name) return;
    
    const normalizedName = client.full_name.trim().toUpperCase();
    
    if (nameMap.has(normalizedName)) {
      duplicates.push({
        name: normalizedName,
        profiles: [nameMap.get(normalizedName), client]
      });
    } else {
      nameMap.set(normalizedName, client);
    }
  });

  if (duplicates.length > 0) {
    console.log(`⚠️  ${duplicates.length} doublon(s) détecté(s):\n`);
    duplicates.forEach((dup, idx) => {
      console.log(`   ${idx + 1}. "${dup.name}":`);
      dup.profiles.forEach(profile => {
        console.log(`      - ID: ${profile.id}, Email: ${profile.email || 'N/A'}, Entreprise: ${profile.company_id || 'N/A'}`);
      });
      console.log('');
    });
  } else {
    console.log('✅ Aucun doublon détecté\n');
  }

  return { clients: clients || [], duplicates };
}

/**
 * Récupère l'ID d'une entreprise par son nom
 */
async function getCompanyIdByName(companyName) {
  if (!companyName) return null;

  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', companyName)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`   ⚠️  Erreur lors de la recherche de "${companyName}": ${error.message}`);
    return null;
  }

  return data?.id || null;
}

/**
 * Vérifie si un utilisateur existe déjà dans Supabase
 */
async function userExists(name, email) {
  const queries = [];

  if (name) {
    queries.push(
      supabase
        .from('profiles')
        .select('id, full_name, email, company_id, role')
        .ilike('full_name', name)
        .single()
    );
  }

  if (email) {
    queries.push(
      supabase
        .from('profiles')
        .select('id, full_name, email, company_id, role')
        .eq('email', email)
        .single()
    );
  }

  const results = await Promise.all(queries);
  
  for (const { data, error } of results) {
    if (!error && data) {
      return data;
    }
  }

  return null;
}

/**
 * Crée un utilisateur dans Supabase
 */
async function createUser(name, companyId) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      full_name: name,
      role: 'client',
      company_id: companyId,
    })
    .select('id, full_name, email, company_id, role')
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création: ${error.message}`);
  }

  return data;
}

/**
 * Met à jour l'entreprise d'un utilisateur
 */
async function updateUserCompany(userId, companyId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ company_id: companyId })
    .eq('id', userId)
    .select('id, full_name, email, company_id')
    .single();

  if (error) {
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }

  return data;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('═'.repeat(80));
    console.log('👥 IMPORT DES UTILISATEURS DEPUIS GOOGLE SHEETS');
    console.log('═'.repeat(80));
    console.log('');

    // 1. Extraire les utilisateurs du sheet
    const sheetUsers = await extractUsersFromSheet();

    // 2. Vérifier les doublons dans Supabase
    const { clients, duplicates } = await checkDuplicatesInSupabase();

    if (duplicates.length > 0) {
      console.log('═'.repeat(80));
      console.log('⚠️  DOUBLONS DÉTECTÉS - ACTION REQUISE');
      console.log('═'.repeat(80));
      console.log('');
      console.log('Des doublons ont été détectés dans Supabase.');
      console.log('Voulez-vous que je continue l\'import malgré les doublons ?');
      console.log('(Les doublons devront être résolus manuellement)\n');
      // Pour l'instant, on continue mais on affiche un avertissement
    }

    // 3. Récupérer toutes les entreprises pour le mapping
    console.log('🔍 Récupération des entreprises...\n');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true });

    if (companiesError) {
      throw new Error(`Erreur lors de la récupération des entreprises: ${companiesError.message}`);
    }

    const companiesMap = new Map();
    companies.forEach(c => {
      companiesMap.set(c.name.toUpperCase().trim(), c.id);
    });

    // Mapping spécial pour "ONPOINT" → "ONPOINT AFRICA GROUP"
    const onpointAfricaGroupId = companiesMap.get('ONPOINT AFRICA GROUP');
    if (onpointAfricaGroupId) {
      companiesMap.set('ONPOINT', onpointAfricaGroupId);
    }

    console.log(`✅ ${companies.length} entreprises trouvées\n`);

    // 4. Traiter chaque utilisateur
    console.log('═'.repeat(80));
    console.log('📥 IMPORT DES UTILISATEURS');
    console.log('═'.repeat(80));
    console.log('');

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const sheetUser of sheetUsers) {
      try {
        // Trouver l'entreprise (avec normalisation)
        let companyId = null;
        if (sheetUser.company) {
          // Normaliser le nom de l'entreprise (corriger les typos courantes)
          let normalizedCompany = sheetUser.company.toUpperCase().trim();
          
          // Corrections de typos courantes
          const typoCorrections = {
            'ONNPOINT': 'ONPOINT',
            'SIIE-TRAVAUX': 'SIE-TRAVAUX',
            'SEERTEM': 'SERTEM',
            'ROOCFED': 'ROCFED',
            'PRROPERTY KRO': 'PROPERTY KRO',
            'NOOAH': 'NOAH',
            'MYYKA': 'MYKA',
            'MAATRELEC': 'MATRELEC',
            'LAABOGEM': 'LABOGEM',
            'KOORI TRANSPORT': 'KORI TRANSPORT',
            'JOOEL K PERFORMANCE': 'JOEL K PERFORMANCE',
            'IVVOIRE DEVELOPPEMENT': 'IVOIRE DEVELOPPEMENT',
            'IPPT': 'IPT',
            'FIIRST CAPITAL': 'FIRST CAPITAL',
            'FAALCON': 'FALCON',
            'ETTRAKOM-CI': 'ETRAKOM-CI',
            'ENNVAL LABORATOIRE': 'ENVAL LABORATOIRE',
            'ELLIO GROUP': 'ELIO GROUP',
            'EJJARA': 'EJARA',
            'EGGBV': 'EGBV',
            'EDDIPRESSE': 'EDIPRESSE',
            'CIILAGRI': 'CILAGRI',
            'S--TEL': 'S-TEL',
            'KOOFFI & DIABATE': 'KOFFI & DIABATE',
            'ENVIPPUR': 'ENVIPUR',
            'ETTS MAB': 'ETS MAB',
          };

          if (typoCorrections[normalizedCompany]) {
            normalizedCompany = typoCorrections[normalizedCompany];
          }

          companyId = companiesMap.get(normalizedCompany);
          if (!companyId) {
            console.log(`   ⚠️  Entreprise "${sheetUser.company}" (normalisé: "${normalizedCompany}") non trouvée pour "${sheetUser.name}"`);
          }
        }

        // Vérifier si l'utilisateur existe
        const existing = await userExists(sheetUser.name, null);

        if (existing) {
          // Mettre à jour l'entreprise si nécessaire
          if (companyId && existing.company_id !== companyId) {
            await updateUserCompany(existing.id, companyId);
            console.log(`   ✅ Mis à jour: ${sheetUser.name} → Entreprise: ${sheetUser.company || 'N/A'}`);
            updatedCount++;
          } else {
            console.log(`   ⏭️  Déjà présent: ${sheetUser.name}`);
            skippedCount++;
          }
        } else {
          // Créer l'utilisateur
          await createUser(sheetUser.name, companyId);
          console.log(`   ✅ Créé: ${sheetUser.name} → Entreprise: ${sheetUser.company || 'N/A'}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour "${sheetUser.name}": ${error.message}`);
        errors.push({ user: sheetUser.name, error: error.message });
        errorCount++;
      }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('📊 RÉSULTAT');
    console.log('═'.repeat(80));
    console.log(`   ✅ ${createdCount} créé(s)`);
    console.log(`   🔄 ${updatedCount} mis à jour`);
    console.log(`   ⏭️  ${skippedCount} déjà présent(s)`);
    console.log(`   ❌ ${errorCount} erreur(s)`);
    console.log('');

    if (errors.length > 0) {
      console.log('❌ Erreurs détaillées:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.user}: ${err.error}`);
      });
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('✅ Import terminé');
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

main()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

