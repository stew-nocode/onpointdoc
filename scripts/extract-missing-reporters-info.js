/**
 * Script pour extraire les informations des rapporteurs manquants
 * depuis le Google Sheet et les tickets JIRA
 * 
 * Usage: node scripts/extract-missing-reporters-info.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// URL du Google Sheet
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PO84DrMeGAAqQ8UXIC36hGfG1Z0tGhLys6SFHvVvteI/export?format=csv&gid=906879761';

// IDs des rapporteurs manquants
const MISSING_REPORTERS = [
  '712020:d4a5e54b-dc78-41d8-a397-cc5dbd0461f0',
  'qm:f507503c-9014-4349-850e-b2659005bfbd:fc62df1a-ef74-43b4-9cdf-e9360887885c'
];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function extractReporterInfo() {
  console.log('🔍 Extraction des informations des rapporteurs manquants...\n');

  try {
    // 1. Télécharger le Google Sheet
    console.log('📥 Téléchargement du Google Sheet...');
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const header = parseCSVLine(lines[0]);

    // Trouver les colonnes
    const reporterIdIndex = header.findIndex(col => 
      col.toLowerCase().includes('id de rapporteur') || 
      (col.toLowerCase().includes('rapporteur') && col.toLowerCase().includes('id'))
    );
    const reporterNameIndex = header.findIndex(col => 
      col.toLowerCase().includes('rapporteur') && 
      !col.toLowerCase().includes('id') &&
      !col.toLowerCase().includes('email')
    );
    const duplicateLinkIndex = header.findIndex(col => 
      col.toLowerCase().includes('lien du ticket entrant') && 
      col.toLowerCase().includes('duplicate')
    );

    console.log(`✅ Colonnes trouvées:`);
    console.log(`   - ID rapporteur: ${reporterIdIndex + 1}`);
    console.log(`   - Nom rapporteur: ${reporterNameIndex !== -1 ? reporterNameIndex + 1 : 'N/A'}`);
    console.log(`   - Lien duplicate: ${duplicateLinkIndex + 1}\n`);

    // 2. Extraire les informations pour chaque rapporteur manquant
    const reporterInfo = new Map();

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      
      if (row.length <= Math.max(reporterIdIndex, duplicateLinkIndex)) continue;

      const reporterId = row[reporterIdIndex]?.trim();
      const odTicketKey = row[duplicateLinkIndex]?.trim();

      if (!MISSING_REPORTERS.includes(reporterId) || !odTicketKey?.startsWith('OD-')) {
        continue;
      }

      if (!reporterInfo.has(reporterId)) {
        reporterInfo.set(reporterId, {
          jira_user_id: reporterId,
          full_name: reporterNameIndex !== -1 ? row[reporterNameIndex]?.trim() : null,
          tickets: []
        });
      }

      reporterInfo.get(reporterId).tickets.push(odTicketKey);
    }

    // 3. Récupérer les tickets depuis Supabase pour plus d'infos
    console.log('📊 Récupération des tickets depuis Supabase...\n');
    
    for (const [reporterId, info] of reporterInfo.entries()) {
      if (info.tickets.length === 0) continue;

      // Récupérer quelques tickets pour analyser
      const sampleTickets = info.tickets.slice(0, 5);
      const { data: tickets, error } = await supabase
        .from('jira_sync')
        .select(`
          jira_issue_key,
          tickets!inner (
            id,
            title,
            ticket_type
          )
        `)
        .in('jira_issue_key', sampleTickets);

      if (!error && tickets) {
        info.sample_tickets = tickets.map(t => ({
          key: t.jira_issue_key,
          title: t.tickets?.title,
          type: t.tickets?.ticket_type
        }));
      }
    }

    // 4. Afficher les résultats
    console.log('═'.repeat(80));
    console.log('📋 INFORMATIONS DES RAPPORTEURS MANQUANTS');
    console.log('═'.repeat(80));
    console.log('');

    for (const [reporterId, info] of reporterInfo.entries()) {
      console.log(`🔑 JIRA User ID: ${reporterId}`);
      console.log(`   📝 Nom trouvé dans le sheet: ${info.full_name || '❌ Non trouvé'}`);
      console.log(`   📊 Nombre de tickets: ${info.tickets.length}`);
      if (info.sample_tickets && info.sample_tickets.length > 0) {
        console.log(`   📋 Exemples de tickets:`);
        info.sample_tickets.slice(0, 3).forEach(t => {
          console.log(`      - ${t.key}: ${t.title}`);
        });
      }
      console.log('');
    }

    // 5. Générer le code pour PROFILES_TO_CREATE
    console.log('═'.repeat(80));
    console.log('📝 CODE POUR PROFILES_TO_CREATE');
    console.log('═'.repeat(80));
    console.log('');
    console.log('const PROFILES_TO_CREATE = [');
    
    for (const [reporterId, info] of reporterInfo.entries()) {
      console.log('  {');
      console.log(`    jira_user_id: '${reporterId}',`);
      console.log(`    full_name: '${info.full_name || 'À RECHERCHER DANS JIRA'}',`);
      console.log(`    email: '', // À RECHERCHER DANS JIRA`);
      console.log(`    role: 'agent', // Vérifier dans JIRA: agent ou manager`);
      console.log(`    department_id: null, // Sera rempli automatiquement avec Support`);
      console.log(`    is_active: true`);
      console.log('  },');
    }
    
    console.log('];');
    console.log('');

    // 6. Sauvegarder les informations
    const reportPath = path.resolve(process.cwd(), 'docs/analysis/infos-rapporteurs-manquants.json');
    const reportData = {
      extracted_at: new Date().toISOString(),
      reporters: Array.from(reporterInfo.values())
    };
    writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    console.log(`💾 Informations sauvegardées dans: ${reportPath}\n`);

    // 7. Instructions
    console.log('═'.repeat(80));
    console.log('📋 PROCHAINES ÉTAPES');
    console.log('═'.repeat(80));
    console.log('');
    console.log('1. Vérifier les noms trouvés dans le sheet');
    console.log('2. Rechercher dans JIRA les emails et rôles pour ces Account IDs:');
    MISSING_REPORTERS.forEach(id => {
      console.log(`   - ${id}`);
    });
    console.log('3. Remplir les informations dans scripts/create-missing-reporters-profiles.js');
    console.log('4. Exécuter le script de création');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

extractReporterInfo()
  .then(() => {
    console.log('✅ Extraction terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

