/**
 * Script pour mettre à jour TOUS les tickets restants depuis le Google Sheet
 * 
 * Ce script :
 * 1. Lit le Google Sheet pour obtenir le mapping Clé OD → ID Rapporteur
 * 2. Pour chaque ticket OD, trouve le ticket dans Supabase via jira_issue_key
 * 3. Met à jour created_by avec le profil correspondant
 * 4. Gère les cas où le profil n'existe pas encore
 * 
 * Usage: node scripts/update-all-remaining-tickets.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

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
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PO84DrMeGAAqQ8UXIC36hGfG1Z0tGhLys6SFHvVvteI/export?format=csv&gid=906879761';

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

async function downloadAndParseGoogleSheet() {
  console.log('📥 Téléchargement du Google Sheet...\n');
  
  const response = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  const csvText = await response.text();
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  const header = parseCSVLine(lines[0]);
  
  const reporterIdIndex = header.findIndex(col => 
    col.toLowerCase().includes('id de rapporteur') || 
    (col.toLowerCase().includes('rapporteur') && col.toLowerCase().includes('id'))
  );
  const duplicateLinkIndex = header.findIndex(col => 
    col.toLowerCase().includes('lien du ticket entrant') && 
    col.toLowerCase().includes('duplicate')
  );
  
  if (reporterIdIndex === -1 || duplicateLinkIndex === -1) {
    throw new Error('Colonnes non trouvées');
  }
  
  const mapping = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    
    if (row.length <= Math.max(reporterIdIndex, duplicateLinkIndex)) continue;
    
    const odTicketKey = row[duplicateLinkIndex]?.trim();
    const reporterId = row[reporterIdIndex]?.trim();
    
    if (odTicketKey && odTicketKey.startsWith('OD-') && reporterId) {
      mapping.set(odTicketKey, reporterId);
    }
  }
  
  console.log(`✅ ${mapping.size} tickets OD trouvés dans le sheet\n`);
  return mapping;
}

async function updateAllTickets() {
  console.log('🔄 Mise à jour de tous les tickets restants...\n');
  
  // 1. Télécharger le mapping depuis le Google Sheet
  const mapping = await downloadAndParseGoogleSheet();
  
  // 2. Récupérer tous les profils avec jira_user_id
  const allReporterIds = Array.from(new Set(mapping.values()));
  console.log(`👥 Récupération de ${allReporterIds.length} profils...\n`);
  
  const profilesMap = new Map();
  const batchSize = 1000;
  
  for (let i = 0; i < allReporterIds.length; i += batchSize) {
    const batch = allReporterIds.slice(i, i + batchSize);
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, jira_user_id')
      .in('jira_user_id', batch);
    
    if (error) {
      console.error(`⚠️  Erreur batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      continue;
    }
    
    if (profiles) {
      profiles.forEach(profile => {
        if (profile.jira_user_id) {
          profilesMap.set(profile.jira_user_id, profile);
        }
      });
    }
  }
  
  console.log(`✅ ${profilesMap.size} profils trouvés\n`);
  
  // 3. Récupérer tous les tickets OD depuis Supabase
  const odTicketKeys = Array.from(mapping.keys());
  console.log(`📊 Traitement de ${odTicketKeys.length} tickets...\n`);
  
  const results = {
    updated: [],
    skipped: [],
    notFound: [],
    missingProfile: []
  };
  
  const batchSizeTickets = 100;
  let processed = 0;
  
  for (let i = 0; i < odTicketKeys.length; i += batchSizeTickets) {
    const batch = odTicketKeys.slice(i, i + batchSizeTickets);
    
    // Récupérer les tickets par jira_issue_key (depuis tickets directement)
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, created_by, jira_issue_key')
      .in('jira_issue_key', batch);
    
    if (error) {
      console.error(`⚠️  Erreur batch tickets ${Math.floor(i / batchSizeTickets) + 1}:`, error.message);
      continue;
    }
    
    if (!tickets) continue;
    
    // Mettre à jour chaque ticket
    for (const ticket of tickets) {
      const ticketKey = ticket.jira_issue_key;
      const reporterId = mapping.get(ticketKey);
      const profile = profilesMap.get(reporterId);
      
      processed++;
      
      if (!reporterId) {
        results.notFound.push({
          jira_issue_key: ticketKey,
          reason: 'Non trouvé dans le sheet'
        });
        continue;
      }
      
      if (!profile) {
        results.missingProfile.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          title: ticket.title,
          reporter_id: reporterId
        });
        continue;
      }
      
      // Vérifier si déjà correct
      if (ticket.created_by === profile.id) {
        results.skipped.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          reason: 'Déjà correct'
        });
        continue;
      }
      
      // Mettre à jour le ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ created_by: profile.id })
        .eq('id', ticket.id);
      
      if (updateError) {
        console.error(`❌ Erreur ${ticketKey}:`, updateError.message);
        results.skipped.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          reason: `Erreur: ${updateError.message}`
        });
      } else {
        results.updated.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          title: ticket.title,
          old_created_by: ticket.created_by || 'NULL',
          new_created_by: profile.id,
          reporter_name: profile.full_name
        });
      }
    }
    
    if (processed % 100 === 0 || processed === odTicketKeys.length) {
      console.log(`   📊 Progression: ${processed}/${odTicketKeys.length} tickets traités`);
    }
  }
  
  // 4. Afficher le rapport
  console.log('\n' + '═'.repeat(80));
  console.log('📊 RAPPORT FINAL');
  console.log('═'.repeat(80));
  console.log('');
  console.log(`✅ Tickets mis à jour: ${results.updated.length}`);
  console.log(`⏭️  Tickets ignorés: ${results.skipped.length}`);
  console.log(`❌ Tickets non trouvés: ${results.notFound.length}`);
  console.log(`⚠️  Tickets avec profil manquant: ${results.missingProfile.length}`);
  console.log('');
  
  if (results.updated.length > 0) {
    console.log('📋 Exemples de tickets mis à jour:');
    results.updated.slice(0, 10).forEach((ticket, idx) => {
      console.log(`   ${idx + 1}. ${ticket.jira_issue_key}: ${ticket.title}`);
      console.log(`      Rapporteur: ${ticket.reporter_name}`);
      console.log(`      created_by: ${ticket.old_created_by} → ${ticket.new_created_by}`);
    });
    if (results.updated.length > 10) {
      console.log(`   ... et ${results.updated.length - 10} autres`);
    }
    console.log('');
  }
  
  // Sauvegarder le rapport
  const reportPath = path.resolve(process.cwd(), 'docs/analysis/rapport-mise-a-jour-tous-tickets.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`💾 Rapport sauvegardé dans: ${reportPath}\n`);
  
  return results;
}

console.log('⚠️  ATTENTION: Ce script va mettre à jour TOUS les tickets depuis le Google Sheet');
console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n');

setTimeout(() => {
  updateAllTickets()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}, 5000);

