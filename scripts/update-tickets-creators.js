/**
 * Script pour mettre à jour tickets.created_by depuis le Google Sheet
 * 
 * Ce script :
 * 1. Lit le Google Sheet pour obtenir le mapping Clé OD → ID Rapporteur + champs supplémentaires
 * 2. Met à jour tickets.created_by pour tous les tickets où le profil existe
 * 3. Génère un rapport des tickets mis à jour
 * 4. Liste les tickets avec profils manquants
 * 5. Détecte les incohérences entre le Sheet et Supabase
 * 
 * Usage: node scripts/update-tickets-creators.js
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
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// URL du Google Sheet (export CSV)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PO84DrMeGAAqQ8UXIC36hGfG1Z0tGhLys6SFHvVvteI/export?format=csv&gid=906879761';

/**
 * Parse une ligne CSV en tenant compte des guillemets et virgules
 */
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

/**
 * Télécharge et parse le Google Sheet CSV
 */
async function downloadAndParseGoogleSheet() {
  console.log('📥 Téléchargement du Google Sheet...\n');
  
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('Le fichier CSV est vide');
    }
    
    // Parser le header
    const header = parseCSVLine(lines[0]);
    
    // Trouver les indices des colonnes recherchées
    const reporterIdIndex = header.findIndex(col => 
      col.toLowerCase().includes('id de rapporteur') || 
      (col.toLowerCase().includes('rapporteur') && col.toLowerCase().includes('id'))
    );
    const duplicateLinkIndex = header.findIndex(col => 
      col.toLowerCase().includes('lien du ticket entrant') && 
      col.toLowerCase().includes('duplicate')
    );
    
    if (reporterIdIndex === -1) {
      throw new Error('Colonne "ID de rapporteur" non trouvée');
    }
    if (duplicateLinkIndex === -1) {
      throw new Error('Colonne "Lien du ticket entrant (Duplicate)" non trouvée');
    }
    
    // Champs supplémentaires
    const canalIndex = header.findIndex(col => 
      col.toLowerCase().includes('champs personnalisés') && 
      col.toLowerCase().includes('canal')
    );
    const dateEnregistrementIndex = header.findIndex(col => 
      col.toLowerCase().includes('champs personnalisés') && 
      col.toLowerCase().includes('date d\'enregistrement')
    );
    const posteIndex = header.findIndex(col => 
      col.toLowerCase().includes('champs personnalisés') && 
      col.toLowerCase().includes('poste')
    );
    const sousModuleFinanceIndex = header.findIndex(col => 
      col.toLowerCase().includes('champs personnalisés') && 
      col.toLowerCase().includes('sous-module') && 
      col.toLowerCase().includes('finance')
    );
    const typeBugsIndex = header.findIndex(col => 
      col.toLowerCase().includes('champs personnalisés') && 
      col.toLowerCase().includes('type de bugs')
    );
    const clientsIndex = header.findIndex(col => 
      col.toLowerCase().includes('champs personnalisés') && 
      col.toLowerCase().includes('client')
    );
    
    // Parser les données
    // IMPORTANT: "Lien du ticket entrant (Duplicate)" contient la clé OD (ex: OD-2987)
    const mapping = new Map(); // Clé OD → { reporterId, canal, dateEnregistrement, poste, sousModuleFinance, typeBugs, clients }
    
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      
      const maxIndex = Math.max(
        reporterIdIndex,
        duplicateLinkIndex,
        canalIndex !== -1 ? canalIndex : 0,
        dateEnregistrementIndex !== -1 ? dateEnregistrementIndex : 0,
        posteIndex !== -1 ? posteIndex : 0,
        sousModuleFinanceIndex !== -1 ? sousModuleFinanceIndex : 0,
        typeBugsIndex !== -1 ? typeBugsIndex : 0,
        clientsIndex !== -1 ? clientsIndex : 0
      );
      
      if (row.length <= maxIndex) {
        continue;
      }
      
      const odTicketKey = row[duplicateLinkIndex]?.trim();
      const reporterId = row[reporterIdIndex]?.trim();
      
      // Récupérer les champs supplémentaires
      const canal = canalIndex !== -1 ? row[canalIndex]?.trim() : null;
      const dateEnregistrement = dateEnregistrementIndex !== -1 ? row[dateEnregistrementIndex]?.trim() : null;
      const poste = posteIndex !== -1 ? row[posteIndex]?.trim() : null;
      const sousModuleFinance = sousModuleFinanceIndex !== -1 ? row[sousModuleFinanceIndex]?.trim() : null;
      const typeBugs = typeBugsIndex !== -1 ? row[typeBugsIndex]?.trim() : null;
      const clients = clientsIndex !== -1 ? row[clientsIndex]?.trim() : null;
      
      // Filtrer uniquement les tickets OD
      if (odTicketKey && odTicketKey.startsWith('OD-') && reporterId) {
        mapping.set(odTicketKey, {
          reporterId,
          canal: canal || null,
          dateEnregistrement: dateEnregistrement || null,
          poste: poste || null,
          sousModuleFinance: sousModuleFinance || null,
          typeBugs: typeBugs || null,
          clients: clients || null
        });
      }
    }
    
    console.log(`✅ ${mapping.size} tickets OD trouvés dans le sheet\n`);
    
    return mapping;
    
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement/parsing:', error.message);
    throw error;
  }
}

/**
 * Met à jour les tickets dans Supabase
 */
async function updateTickets(mapping) {
  console.log('🔄 Mise à jour des tickets dans Supabase...\n');
  
  const results = {
    updated: [],
    skipped: [],
    notFound: [],
    missingProfile: []
  };
  
  // Récupérer tous les profils avec jira_user_id
  const allReporterIds = Array.from(new Set(Array.from(mapping.values()).map(d => d.reporterId)));
  console.log(`👥 Récupération de ${allReporterIds.length} profils uniques...\n`);
  
  // Récupérer les profils par batch (Supabase limite à 1000)
  const profilesMap = new Map();
  const batchSize = 1000;
  
  for (let i = 0; i < allReporterIds.length; i += batchSize) {
    const batch = allReporterIds.slice(i, i + batchSize);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, jira_user_id')
      .in('jira_user_id', batch);
    
    if (profilesError) {
      console.error(`⚠️  Erreur lors de la récupération du batch ${Math.floor(i / batchSize) + 1}:`, profilesError.message);
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
  
  // Récupérer tous les tickets OD par batch
  const odTicketKeys = Array.from(mapping.keys());
  console.log(`📊 Mise à jour de ${odTicketKeys.length} tickets...\n`);
  
  let processed = 0;
  
  for (let i = 0; i < odTicketKeys.length; i += batchSize) {
    const batch = odTicketKeys.slice(i, i + batchSize);
    
    // Récupérer les tickets de ce batch
    const { data: tickets, error: ticketsError } = await supabase
      .from('jira_sync')
      .select(`
        ticket_id,
        jira_issue_key,
        tickets!inner (
          id,
          title,
          ticket_type,
          created_by
        )
      `)
      .in('jira_issue_key', batch);
    
    if (ticketsError) {
      console.error(`⚠️  Erreur lors de la récupération du batch ${Math.floor(i / batchSize) + 1}:`, ticketsError.message);
      continue;
    }
    
    if (!tickets) continue;
    
    // Mettre à jour chaque ticket
    for (const entry of tickets) {
      const ticketKey = entry.jira_issue_key;
      const sheetData = mapping.get(ticketKey);
      const ticket = entry.tickets;
      
      processed++;
      
      if (!ticket) {
        results.notFound.push({
          jira_issue_key: ticketKey,
          sheet_data: sheetData
        });
        continue;
      }
      
      if (!sheetData) {
        results.notFound.push({
          jira_issue_key: ticketKey,
          reason: 'Non trouvé dans le sheet'
        });
        continue;
      }
      
      const profile = profilesMap.get(sheetData.reporterId);
      
      if (!profile) {
        results.missingProfile.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          title: ticket.title,
          ticket_type: ticket.ticket_type,
          reporter_id: sheetData.reporterId,
          sheet_data: sheetData
        });
        continue;
      }
      
      // Vérifier si déjà correct
      if (ticket.created_by === profile.id) {
        results.skipped.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          title: ticket.title,
          reporter_name: profile.full_name,
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
        console.error(`❌ Erreur lors de la mise à jour de ${ticketKey}:`, updateError.message);
        results.skipped.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          title: ticket.title,
          reporter_name: profile.full_name,
          reason: `Erreur: ${updateError.message}`
        });
      } else {
        results.updated.push({
          jira_issue_key: ticketKey,
          ticket_id: ticket.id,
          title: ticket.title,
          ticket_type: ticket.ticket_type,
          old_created_by: ticket.created_by || 'NULL',
          new_created_by: profile.id,
          reporter_name: profile.full_name,
          reporter_email: profile.email,
          sheet_data: sheetData
        });
      }
    }
    
    // Afficher la progression
    if (processed % 100 === 0 || processed === odTicketKeys.length) {
      console.log(`   📊 Progression: ${processed}/${odTicketKeys.length} tickets traités`);
    }
  }
  
  return results;
}

/**
 * Affiche le rapport final
 */
function displayFinalReport(results) {
  console.log('\n' + '═'.repeat(80));
  console.log('📊 RAPPORT FINAL DE MISE À JOUR');
  console.log('═'.repeat(80));
  console.log('');
  
  console.log('✅ Tickets mis à jour:', results.updated.length);
  console.log('⏭️  Tickets ignorés (déjà correct ou erreur):', results.skipped.length);
  console.log('❌ Tickets non trouvés dans Supabase:', results.notFound.length);
  console.log('⚠️  Tickets avec profil manquant:', results.missingProfile.length);
  console.log('');
  
  if (results.updated.length > 0) {
    console.log('═'.repeat(80));
    console.log('✅ EXEMPLES DE TICKETS MIS À JOUR (10 premiers)');
    console.log('═'.repeat(80));
    console.log('');
    results.updated.slice(0, 10).forEach((ticket, idx) => {
      console.log(`${idx + 1}. ${ticket.jira_issue_key}: ${ticket.title}`);
      console.log(`   Rapporteur: ${ticket.reporter_name} (${ticket.reporter_email})`);
      console.log(`   created_by: ${ticket.old_created_by} → ${ticket.new_created_by}`);
      console.log('');
    });
    if (results.updated.length > 10) {
      console.log(`   ... et ${results.updated.length - 10} autres`);
      console.log('');
    }
  }
  
  if (results.missingProfile.length > 0) {
    console.log('═'.repeat(80));
    console.log('⚠️  TICKETS AVEC PROFIL MANQUANT');
    console.log('═'.repeat(80));
    console.log('');
    
    // Grouper par rapporteur ID
    const byReporter = new Map();
    results.missingProfile.forEach(ticket => {
      if (!byReporter.has(ticket.reporter_id)) {
        byReporter.set(ticket.reporter_id, []);
      }
      byReporter.get(ticket.reporter_id).push(ticket);
    });
    
    console.log(`📋 ${byReporter.size} rapporteurs sans profil:\n`);
    
    byReporter.forEach((tickets, reporterId) => {
      console.log(`   🔑 Rapporteur ID: ${reporterId}`);
      console.log(`   📊 Tickets concernés: ${tickets.length}`);
      console.log(`   📝 Exemples:`);
      tickets.slice(0, 3).forEach(ticket => {
        console.log(`      - ${ticket.jira_issue_key}: ${ticket.title}`);
      });
      if (tickets.length > 3) {
        console.log(`      ... et ${tickets.length - 3} autres`);
      }
      console.log('');
    });
  }
  
  console.log('═'.repeat(80));
  console.log('✅ Mise à jour terminée');
  console.log('═'.repeat(80));
  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // 1. Télécharger et parser le Google Sheet
    const mapping = await downloadAndParseGoogleSheet();
    
    // 2. Demander confirmation
    console.log('⚠️  ATTENTION: Ce script va modifier la base de données Supabase');
    console.log(`   ${mapping.size} tickets seront potentiellement mis à jour\n`);
    console.log('Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. Mettre à jour les tickets
    const results = await updateTickets(mapping);
    
    // 4. Afficher le rapport final
    displayFinalReport(results);
    
    // 5. Sauvegarder le rapport en JSON
    const reportPath = path.resolve(process.cwd(), 'docs/analysis/rapport-mise-a-jour-createurs.json');
    writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`💾 Rapport sauvegardé dans: ${reportPath}\n`);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
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

