#!/usr/bin/env node

/**
 * Script pour vérifier si tous les rapporteurs du Google Sheets sont dans Supabase
 * comme utilisateurs internes avec leur rôle
 * 
 * Usage:
 *   node scripts/verify-reporters-in-supabase.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import https from 'https';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
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
 * Extrait tous les rapporteurs uniques du CSV
 */
async function extractReporters() {
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

    // Trouver les indices des colonnes
    const headers = records[0];
    const reporterNameIndex = headers.findIndex(
      col => col && (col.toLowerCase().includes('rapporteur') && !col.toLowerCase().includes('ancien') && !col.toLowerCase().includes('accountid') && !col.toLowerCase().includes('id jira'))
    );
    // Chercher "accountID (from Rapporteur)" - colonne M
    const reporterIdIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('accountid') && col.toLowerCase().includes('rapporteur')
    );
    const posteIndex = headers.findIndex(
      col => col && col.toLowerCase().includes('poste') && !col.toLowerCase().includes('id')
    );

    if (reporterNameIndex === -1) {
      throw new Error('Colonne "Rapporteur" non trouvée');
    }

    console.log(`📋 Colonnes identifiées:`);
    console.log(`   - Rapporteur: colonne ${reporterNameIndex + 1} (${headers[reporterNameIndex]})`);
    if (reporterIdIndex !== -1) {
      console.log(`   - accountID: colonne ${reporterIdIndex + 1} (${headers[reporterIdIndex]})`);
    }
    if (posteIndex !== -1) {
      console.log(`   - Poste: colonne ${posteIndex + 1} (${headers[posteIndex]})`);
    }
    console.log('');

    // Extraire les rapporteurs uniques
    const reportersMap = new Map(); // jira_user_id ou name → { name, jira_user_id, poste, count }

    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      if (row.length <= reporterNameIndex) continue;

      const reporterName = row[reporterNameIndex]?.trim();
      const reporterId = reporterIdIndex !== -1 ? row[reporterIdIndex]?.trim() : null;
      const poste = posteIndex !== -1 ? row[posteIndex]?.trim() : null;

      if (!reporterName || reporterName === '') continue;

      // Utiliser jira_user_id comme clé si disponible, sinon le nom
      const key = reporterId || reporterName.toLowerCase();

      if (reportersMap.has(key)) {
        const existing = reportersMap.get(key);
        existing.count++;
      } else {
        reportersMap.set(key, {
          name: reporterName,
          jira_user_id: reporterId || null,
          poste: poste || null,
          count: 1
        });
      }
    }

    console.log(`✅ ${reportersMap.size} rapporteurs uniques trouvés\n`);

    return Array.from(reportersMap.values());
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error.message);
    throw error;
  }
}

/**
 * Vérifie les rapporteurs dans Supabase
 */
async function verifyReportersInSupabase(reporters) {
  console.log('🔍 Vérification des rapporteurs dans Supabase...\n');

  const report = {
    summary: {
      totalReporters: reporters.length,
      foundInSupabase: 0,
      notFoundInSupabase: 0,
      internalUsers: 0,
      externalUsers: 0,
      missingRole: 0
    },
    reporters: {
      found: [],
      notFound: [],
      external: [],
      missingRole: []
    }
  };

  // Récupérer tous les profils avec jira_user_id
  const allJiraUserIds = reporters
    .filter(r => r.jira_user_id)
    .map(r => r.jira_user_id);

  console.log(`📊 Recherche de ${allJiraUserIds.length} rapporteurs par jira_user_id...`);

  const profilesByJiraId = new Map();
  if (allJiraUserIds.length > 0) {
    // Traiter par batch de 1000 (limite Supabase)
    const batchSize = 1000;
    for (let i = 0; i < allJiraUserIds.length; i += batchSize) {
      const batch = allJiraUserIds.slice(i, i + batchSize);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, jira_user_id, job_title, company_id')
        .in('jira_user_id', batch);

      if (error) {
        console.error(`⚠️  Erreur lors de la récupération du batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        continue;
      }

      if (profiles) {
        profiles.forEach(profile => {
          if (profile.jira_user_id) {
            profilesByJiraId.set(profile.jira_user_id, profile);
          }
        });
      }
    }
  }

  console.log(`✅ ${profilesByJiraId.size} profils trouvés par jira_user_id\n`);

  // Rechercher aussi par nom (pour ceux sans jira_user_id)
  const reportersWithoutId = reporters.filter(r => !r.jira_user_id);
  const profilesByName = new Map();

  if (reportersWithoutId.length > 0) {
    console.log(`📊 Recherche de ${reportersWithoutId.length} rapporteurs par nom...`);
    
    for (const reporter of reportersWithoutId) {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, jira_user_id, job_title, company_id')
        .ilike('full_name', `%${reporter.name}%`)
        .limit(5);

      if (!error && profiles && profiles.length > 0) {
        // Prendre le premier match exact ou le plus proche
        const exactMatch = profiles.find(p => 
          p.full_name.toLowerCase().trim() === reporter.name.toLowerCase().trim()
        );
        if (exactMatch) {
          profilesByName.set(reporter.name.toLowerCase(), exactMatch);
        } else if (profiles.length === 1) {
          profilesByName.set(reporter.name.toLowerCase(), profiles[0]);
        }
      }
    }
  }

  console.log(`✅ ${profilesByName.size} profils trouvés par nom\n`);

  // Analyser chaque rapporteur
  for (const reporter of reporters) {
    let profile = null;

    // Chercher d'abord par jira_user_id
    if (reporter.jira_user_id) {
      profile = profilesByJiraId.get(reporter.jira_user_id);
    }

    // Sinon chercher par nom
    if (!profile && !reporter.jira_user_id) {
      profile = profilesByName.get(reporter.name.toLowerCase());
    }

    if (profile) {
      report.summary.foundInSupabase++;
      
      const isInternal = profile.role !== 'client' && profile.role !== null;
      const hasRole = profile.role !== null && profile.role !== '';

      if (isInternal) {
        report.summary.internalUsers++;
        report.reporters.found.push({
          name: reporter.name,
          jira_user_id: reporter.jira_user_id,
          poste: reporter.poste,
          ticket_count: reporter.count,
          profile: {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role,
            job_title: profile.job_title,
            company_id: profile.company_id
          },
          status: '✅ Utilisateur interne'
        });
      } else if (profile.role === 'client') {
        report.summary.externalUsers++;
        report.reporters.external.push({
          name: reporter.name,
          jira_user_id: reporter.jira_user_id,
          poste: reporter.poste,
          ticket_count: reporter.count,
          profile: {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role,
            job_title: profile.job_title,
            company_id: profile.company_id
          },
          status: '⚠️  Utilisateur externe (client)'
        });
      } else if (!hasRole) {
        report.summary.missingRole++;
        report.reporters.missingRole.push({
          name: reporter.name,
          jira_user_id: reporter.jira_user_id,
          poste: reporter.poste,
          ticket_count: reporter.count,
          profile: {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role,
            job_title: profile.job_title,
            company_id: profile.company_id
          },
          status: '❌ Rôle manquant'
        });
      }
    } else {
      report.summary.notFoundInSupabase++;
      report.reporters.notFound.push({
        name: reporter.name,
        jira_user_id: reporter.jira_user_id,
        poste: reporter.poste,
        ticket_count: reporter.count,
        status: '❌ Non trouvé dans Supabase'
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
  console.log('📊 RAPPORT DE VÉRIFICATION DES RAPPORTEURS');
  console.log('═'.repeat(80));
  console.log('');

  console.log('📈 RÉSUMÉ:');
  console.log(`   📋 Total rapporteurs dans le fichier: ${report.summary.totalReporters}`);
  console.log(`   ✅ Trouvés dans Supabase: ${report.summary.foundInSupabase}`);
  console.log(`   ❌ Non trouvés dans Supabase: ${report.summary.notFoundInSupabase}`);
  console.log(`   👤 Utilisateurs internes (role != 'client'): ${report.summary.internalUsers}`);
  console.log(`   👥 Utilisateurs externes (role = 'client'): ${report.summary.externalUsers}`);
  console.log(`   ⚠️  Rôle manquant: ${report.summary.missingRole}`);
  console.log('');

  if (report.reporters.found.length > 0) {
    console.log('═'.repeat(80));
    console.log(`✅ UTILISATEURS INTERNES (${report.reporters.found.length})`);
    console.log('═'.repeat(80));
    report.reporters.found.slice(0, 10).forEach((r, idx) => {
      console.log(`\n${idx + 1}. ${r.name}`);
      console.log(`   - Rôle: ${r.profile.role}`);
      console.log(`   - Email: ${r.profile.email || 'N/A'}`);
      console.log(`   - Poste: ${r.profile.job_title || r.poste || 'N/A'}`);
      console.log(`   - Tickets: ${r.ticket_count}`);
      if (r.jira_user_id) {
        console.log(`   - JIRA ID: ${r.jira_user_id}`);
      }
    });
    if (report.reporters.found.length > 10) {
      console.log(`\n   ... et ${report.reporters.found.length - 10} autres`);
    }
    console.log('');
  }

  if (report.reporters.external.length > 0) {
    console.log('═'.repeat(80));
    console.log(`⚠️  UTILISATEURS EXTERNES (CLIENTS) (${report.reporters.external.length})`);
    console.log('═'.repeat(80));
    report.reporters.external.slice(0, 10).forEach((r, idx) => {
      console.log(`\n${idx + 1}. ${r.name}`);
      console.log(`   - Rôle: ${r.profile.role}`);
      console.log(`   - Email: ${r.profile.email || 'N/A'}`);
      console.log(`   - Tickets: ${r.ticket_count}`);
    });
    if (report.reporters.external.length > 10) {
      console.log(`\n   ... et ${report.reporters.external.length - 10} autres`);
    }
    console.log('');
  }

  if (report.reporters.missingRole.length > 0) {
    console.log('═'.repeat(80));
    console.log(`❌ RÔLE MANQUANT (${report.reporters.missingRole.length})`);
    console.log('═'.repeat(80));
    report.reporters.missingRole.slice(0, 10).forEach((r, idx) => {
      console.log(`\n${idx + 1}. ${r.name}`);
      console.log(`   - Email: ${r.profile.email || 'N/A'}`);
      console.log(`   - Rôle actuel: ${r.profile.role || 'NULL'}`);
      console.log(`   - Tickets: ${r.ticket_count}`);
    });
    if (report.reporters.missingRole.length > 10) {
      console.log(`\n   ... et ${report.reporters.missingRole.length - 10} autres`);
    }
    console.log('');
  }

  if (report.reporters.notFound.length > 0) {
    console.log('═'.repeat(80));
    console.log(`❌ NON TROUVÉS DANS SUPABASE (${report.reporters.notFound.length})`);
    console.log('═'.repeat(80));
    report.reporters.notFound.slice(0, 20).forEach((r, idx) => {
      console.log(`\n${idx + 1}. ${r.name}`);
      if (r.jira_user_id) {
        console.log(`   - JIRA ID: ${r.jira_user_id}`);
      }
      if (r.poste) {
        console.log(`   - Poste: ${r.poste}`);
      }
      console.log(`   - Tickets: ${r.ticket_count}`);
    });
    if (report.reporters.notFound.length > 20) {
      console.log(`\n   ... et ${report.reporters.notFound.length - 20} autres`);
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
    // 1. Extraire les rapporteurs du Google Sheets
    const reporters = await extractReporters();

    // 2. Vérifier dans Supabase
    const report = await verifyReportersInSupabase(reporters);

    // 3. Afficher le rapport
    displayReport(report);

    // 4. Sauvegarder le rapport en JSON
    const reportPath = path.resolve(process.cwd(), 'docs/analysis/rapport-verification-rapporteurs.json');
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

