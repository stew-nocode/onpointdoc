/**
 * Script pour mapper les vrais créateurs depuis Google Sheet
 * 
 * Logique :
 * 1. Lire le Google Sheet (export CSV)
 * 2. Parser les colonnes : "ID de rapporteur", "Lien du ticket entrant (Duplicate)", "Clé de ticket"
 * 3. Créer un mapping : Clé OD (ex: OD-2862) → ID Rapporteur
 * 4. Identifier les tickets dans Supabase via jira_issue_key
 * 5. Mapper l'ID Rapporteur vers un profil Supabase via jira_user_id
 * 6. Générer un rapport de validation
 * 
 * Usage: node scripts/map-creators-from-google-sheet.js
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
    console.log(`✅ Header trouvé: ${header.length} colonnes\n`);
    
    // Trouver les indices des colonnes recherchées
    const reporterIdIndex = header.findIndex(col => 
      col.toLowerCase().includes('id de rapporteur') || 
      (col.toLowerCase().includes('rapporteur') && col.toLowerCase().includes('id'))
    );
    const duplicateLinkIndex = header.findIndex(col => 
      col.toLowerCase().includes('lien du ticket entrant') && 
      col.toLowerCase().includes('duplicate')
    );
    const ticketKeyIndex = header.findIndex(col => 
      col.toLowerCase().includes('clé de ticket') || 
      col.toLowerCase().includes('clé ticket')
    );
    
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
    
    if (reporterIdIndex === -1) {
      throw new Error('Colonne "ID de rapporteur" non trouvée');
    }
    if (duplicateLinkIndex === -1) {
      throw new Error('Colonne "Lien du ticket entrant (Duplicate)" non trouvée');
    }
    
    console.log(`📋 Colonnes identifiées:`);
    console.log(`   - ID de rapporteur: colonne ${reporterIdIndex + 1} (${header[reporterIdIndex]})`);
    console.log(`   - Lien du ticket entrant (Duplicate): colonne ${duplicateLinkIndex + 1} (${header[duplicateLinkIndex]})`);
    if (ticketKeyIndex !== -1) {
      console.log(`   - Clé de ticket (OBCS source): colonne ${ticketKeyIndex + 1} (${header[ticketKeyIndex]})`);
    }
    if (canalIndex !== -1) {
      console.log(`   - Champs personnalisés (Canal): colonne ${canalIndex + 1} (${header[canalIndex]})`);
    }
    if (dateEnregistrementIndex !== -1) {
      console.log(`   - Champs personnalisés (Date d'enregistrement): colonne ${dateEnregistrementIndex + 1} (${header[dateEnregistrementIndex]})`);
    }
    if (posteIndex !== -1) {
      console.log(`   - Champs personnalisés (Poste): colonne ${posteIndex + 1} (${header[posteIndex]})`);
    }
    if (sousModuleFinanceIndex !== -1) {
      console.log(`   - Champs personnalisés (Sous-Module(s) Finance): colonne ${sousModuleFinanceIndex + 1} (${header[sousModuleFinanceIndex]})`);
    }
    if (typeBugsIndex !== -1) {
      console.log(`   - Champs personnalisés (Type de bugs): colonne ${typeBugsIndex + 1} (${header[typeBugsIndex]})`);
    }
    if (clientsIndex !== -1) {
      console.log(`   - Champs personnalisés (Client(s)): colonne ${clientsIndex + 1} (${header[clientsIndex]})`);
    }
    console.log('');
    
    // Parser les données
    // IMPORTANT: "Lien du ticket entrant (Duplicate)" contient la clé OD (ex: OD-2987)
    // "Clé de ticket" contient le ticket source OBCS (ex: OBCS-11812)
    const mapping = new Map(); // Clé OD → { reporterId, canal, dateEnregistrement, poste, sousModuleFinance, typeBugs, clients }
    let skippedRows = 0;
    let sampleRows = [];
    
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
        skippedRows++;
        if (sampleRows.length < 3) {
          sampleRows.push({ line: i + 1, row, reason: 'Ligne trop courte' });
        }
        continue;
      }
      
      // "Lien du ticket entrant (Duplicate)" = Clé OD (ex: OD-2987)
      const odTicketKey = row[duplicateLinkIndex]?.trim();
      const reporterId = row[reporterIdIndex]?.trim();
      const obscTicketKey = ticketKeyIndex !== -1 ? row[ticketKeyIndex]?.trim() : null;
      
      // Récupérer les champs supplémentaires
      const canal = canalIndex !== -1 ? row[canalIndex]?.trim() : null;
      const dateEnregistrement = dateEnregistrementIndex !== -1 ? row[dateEnregistrementIndex]?.trim() : null;
      const poste = posteIndex !== -1 ? row[posteIndex]?.trim() : null;
      const sousModuleFinance = sousModuleFinanceIndex !== -1 ? row[sousModuleFinanceIndex]?.trim() : null;
      const typeBugs = typeBugsIndex !== -1 ? row[typeBugsIndex]?.trim() : null;
      const clients = clientsIndex !== -1 ? row[clientsIndex]?.trim() : null;
      
      // Debug: afficher quelques exemples (uniquement les lignes avec tickets OD)
      if (sampleRows.length < 5 && odTicketKey && odTicketKey.startsWith('OD-')) {
        sampleRows.push({
          line: i + 1,
          odTicketKey,
          obscTicketKey: obscTicketKey || 'N/A',
          reporterId: reporterId || 'VIDE',
          canal: canal || 'N/A',
          typeBugs: typeBugs || 'N/A'
        });
      }
      
      // Filtrer uniquement les tickets OD (commençant par "OD-")
      if (odTicketKey && odTicketKey.startsWith('OD-') && reporterId) {
        // Si plusieurs lignes pour le même ticket OD, garder la dernière
        mapping.set(odTicketKey, {
          reporterId,
          canal: canal || null,
          dateEnregistrement: dateEnregistrement || null,
          poste: poste || null,
          sousModuleFinance: sousModuleFinance || null,
          typeBugs: typeBugs || null,
          clients: clients || null
        });
      } else if (odTicketKey && odTicketKey.startsWith('OD-') && !reporterId) {
        skippedRows++;
        if (sampleRows.length < 3) {
          sampleRows.push({ line: i + 1, odTicketKey, reason: 'Pas de rapporteur ID' });
        }
      } else if (!odTicketKey || !odTicketKey.startsWith('OD-')) {
        // Ligne sans ticket OD (peut être un ticket OBCS direct ou autre)
        skippedRows++;
      }
    }
    
    console.log(`✅ ${mapping.size} tickets OD trouvés dans le sheet`);
    console.log(`⚠️  ${skippedRows} lignes ignorées\n`);
    
    // Afficher des exemples pour débogage
    if (sampleRows.length > 0) {
      console.log('📋 Exemples de lignes parsées (tickets OD):');
      sampleRows.slice(0, 5).forEach((sample, idx) => {
        console.log(`   ${idx + 1}. Ligne ${sample.line}:`);
        if (sample.odTicketKey) {
          console.log(`      - Ticket OD: "${sample.odTicketKey}"`);
          console.log(`      - Ticket OBCS source: "${sample.obscTicketKey}"`);
          console.log(`      - ID rapporteur: "${sample.reporterId}"`);
          console.log(`      - Canal: "${sample.canal}"`);
          console.log(`      - Type bugs: "${sample.typeBugs}"`);
        } else {
          console.log(`      - Raison: ${sample.reason}`);
          if (sample.row) {
            console.log(`      - Colonnes: ${sample.row.length}`);
          }
        }
      });
      console.log('');
    }
    
    // Afficher quelques exemples de tickets OD trouvés
    if (mapping.size > 0) {
      console.log('📋 Exemples de tickets OD mappés:');
      Array.from(mapping.entries()).slice(0, 5).forEach(([key, data]) => {
        console.log(`   - ${key} → Rapporteur: ${data.reporterId}`);
        if (data.canal) console.log(`     Canal: ${data.canal}`);
        if (data.typeBugs) console.log(`     Type bugs: ${data.typeBugs}`);
        if (data.clients) console.log(`     Client(s): ${data.clients}`);
      });
      console.log('');
    }
    
    return { mapping, header };
    
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement/parsing:', error.message);
    throw error;
  }
}

/**
 * Génère un rapport de validation
 */
async function generateValidationReport(mapping) {
  console.log('🔍 Génération du rapport de validation...\n');
  
  const report = {
    summary: {
      totalTicketsInSheet: mapping.size,
      ticketsFoundInSupabase: 0,
      ticketsNotFoundInSupabase: 0,
      reportersMapped: 0,
      reportersNotMapped: 0,
      ticketsWithCreatedBy: 0,
      ticketsWithoutCreatedBy: 0
    },
    tickets: {
      found: [],
      notFound: [],
      withProfile: [],
      withoutProfile: []
    },
    reporters: {
      mapped: new Set(),
      notMapped: new Set()
    }
  };
  
  // Récupérer tous les tickets OD depuis Supabase
  const odTicketKeys = Array.from(mapping.keys());
  console.log(`📊 Recherche de ${odTicketKeys.length} tickets dans Supabase...\n`);
  
  // Récupérer les tickets par batch (Supabase limite à 1000)
  const batchSize = 1000;
  const allTickets = [];
  
  for (let i = 0; i < odTicketKeys.length; i += batchSize) {
    const batch = odTicketKeys.slice(i, i + batchSize);
    
    const { data: tickets, error } = await supabase
      .from('jira_sync')
      .select(`
        ticket_id,
        jira_issue_key,
        tickets!inner (
          id,
          title,
          ticket_type,
          created_by,
          status
        )
      `)
      .in('jira_issue_key', batch);
    
    if (error) {
      console.error(`⚠️  Erreur lors de la récupération du batch ${i / batchSize + 1}:`, error.message);
      continue;
    }
    
    if (tickets) {
      allTickets.push(...tickets);
    }
  }
  
  console.log(`✅ ${allTickets.length} tickets trouvés dans Supabase\n`);
  
  // Créer un map pour accès rapide
  const ticketsMap = new Map();
  allTickets.forEach(entry => {
    ticketsMap.set(entry.jira_issue_key, entry);
  });
  
  // Récupérer tous les profils avec jira_user_id
  const allReporterIds = Array.from(new Set(Array.from(mapping.values()).map(d => d.reporterId)));
  console.log(`👥 Recherche de ${allReporterIds.length} rapporteurs uniques dans Supabase...\n`);
  
  // Récupérer les profils par batch (Supabase limite à 1000)
  const profilesMap = new Map();
  
  for (let i = 0; i < allReporterIds.length; i += batchSize) {
    const batch = allReporterIds.slice(i, i + batchSize);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, jira_user_id, departments(name, code)')
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
  
  console.log(`✅ ${profilesMap.size} profils trouvés dans Supabase\n`);
  
  // Analyser chaque ticket
  for (const [ticketKey, sheetData] of mapping.entries()) {
    const ticketEntry = ticketsMap.get(ticketKey);
    
    if (!ticketEntry) {
      report.summary.ticketsNotFoundInSupabase++;
      report.tickets.notFound.push({
        jira_issue_key: ticketKey,
        reporter_id: sheetData.reporterId,
        ...sheetData
      });
      continue;
    }
    
    report.summary.ticketsFoundInSupabase++;
    const ticket = ticketEntry.tickets;
    const profile = profilesMap.get(sheetData.reporterId);
    
    // Vérifier les incohérences
    const inconsistencies = [];
    
    // Vérifier le canal
    if (sheetData.canal && ticket.canal && sheetData.canal.toLowerCase() !== ticket.canal.toLowerCase()) {
      inconsistencies.push({
        field: 'canal',
        sheet_value: sheetData.canal,
        supabase_value: ticket.canal
      });
    }
    
    // Vérifier le poste du client
    if (sheetData.poste && ticket.contact_user?.job_title && 
        sheetData.poste.toLowerCase() !== ticket.contact_user.job_title.toLowerCase()) {
      inconsistencies.push({
        field: 'poste',
        sheet_value: sheetData.poste,
        supabase_value: ticket.contact_user.job_title
      });
    }
    
    // Vérifier le sous-module Finance
    if (sheetData.sousModuleFinance && ticket.submodules?.name && 
        !sheetData.sousModuleFinance.toLowerCase().includes(ticket.submodules.name.toLowerCase()) &&
        !ticket.submodules.name.toLowerCase().includes(sheetData.sousModuleFinance.toLowerCase())) {
      inconsistencies.push({
        field: 'sous_module_finance',
        sheet_value: sheetData.sousModuleFinance,
        supabase_value: ticket.submodules.name
      });
    }
    
    // Vérifier le client/entreprise
    if (sheetData.clients && ticket.contact_user?.companies?.name && 
        !sheetData.clients.toLowerCase().includes(ticket.contact_user.companies.name.toLowerCase()) &&
        !ticket.contact_user.companies.name.toLowerCase().includes(sheetData.clients.toLowerCase())) {
      inconsistencies.push({
        field: 'client',
        sheet_value: sheetData.clients,
        supabase_value: ticket.contact_user.companies.name
      });
    }
    
    if (profile) {
      report.summary.reportersMapped++;
      report.reporters.mapped.add(sheetData.reporterId);
      
      const ticketData = {
        jira_issue_key: ticketKey,
        ticket_id: ticket.id,
        title: ticket.title,
        ticket_type: ticket.ticket_type,
        current_created_by: ticket.created_by,
        reporter_id: sheetData.reporterId,
        reporter_name: profile.full_name,
        sheet_data: {
          canal: sheetData.canal,
          date_enregistrement: sheetData.dateEnregistrement,
          poste: sheetData.poste,
          sous_module_finance: sheetData.sousModuleFinance,
          type_bugs: sheetData.typeBugs,
          clients: sheetData.clients
        },
        supabase_data: {
          canal: ticket.canal,
          contact_user: ticket.contact_user?.full_name,
          contact_job_title: ticket.contact_user?.job_title,
          contact_company: ticket.contact_user?.companies?.name,
          submodule: ticket.submodules?.name,
          feature: ticket.features?.name
        },
        inconsistencies: inconsistencies.length > 0 ? inconsistencies : null
      };
      
      if (ticket.created_by === profile.id) {
        report.summary.ticketsWithCreatedBy++;
        ticketData.status = '✅ Déjà correct';
        report.tickets.withProfile.push(ticketData);
      } else {
        report.summary.ticketsWithoutCreatedBy++;
        ticketData.expected_created_by = profile.id;
        ticketData.reporter_email = profile.email;
        ticketData.reporter_role = profile.role;
        ticketData.status = '⚠️  À mettre à jour';
        report.tickets.withoutProfile.push(ticketData);
      }
    } else {
      report.summary.reportersNotMapped++;
      report.reporters.notMapped.add(sheetData.reporterId);
      report.tickets.withoutProfile.push({
        jira_issue_key: ticketKey,
        ticket_id: ticket.id,
        title: ticket.title,
        ticket_type: ticket.ticket_type,
        current_created_by: ticket.created_by || 'NULL',
        reporter_id: sheetData.reporterId,
        sheet_data: {
          canal: sheetData.canal,
          date_enregistrement: sheetData.dateEnregistrement,
          poste: sheetData.poste,
          sous_module_finance: sheetData.sousModuleFinance,
          type_bugs: sheetData.typeBugs,
          clients: sheetData.clients
        },
        status: '❌ Profil manquant'
      });
    }
  }
  
  // Convertir les Sets en Arrays pour le JSON
  report.reporters.mapped = Array.from(report.reporters.mapped);
  report.reporters.notMapped = Array.from(report.reporters.notMapped);
  
  return report;
}

/**
 * Affiche le rapport de validation
 */
function displayValidationReport(report) {
  console.log('═'.repeat(80));
  console.log('📊 RAPPORT DE VALIDATION');
  console.log('═'.repeat(80));
  console.log('');
  
  console.log('📈 RÉSUMÉ:');
  console.log(`   📋 Tickets dans le sheet: ${report.summary.totalTicketsInSheet}`);
  console.log(`   ✅ Tickets trouvés dans Supabase: ${report.summary.ticketsFoundInSupabase}`);
  console.log(`   ❌ Tickets non trouvés dans Supabase: ${report.summary.ticketsNotFoundInSupabase}`);
  console.log(`   👥 Rapporteurs mappés (profil trouvé): ${report.summary.reportersMapped}`);
  console.log(`   ⚠️  Rapporteurs non mappés (profil manquant): ${report.summary.reportersNotMapped}`);
  console.log(`   ✅ Tickets avec created_by correct: ${report.summary.ticketsWithCreatedBy}`);
  console.log(`   ⚠️  Tickets à mettre à jour: ${report.summary.ticketsWithoutCreatedBy}`);
  console.log('');
  
  if (report.tickets.notFound.length > 0) {
    console.log('═'.repeat(80));
    console.log(`❌ TICKETS NON TROUVÉS DANS SUPABASE (${report.tickets.notFound.length})`);
    console.log('═'.repeat(80));
    console.log('');
    report.tickets.notFound.slice(0, 10).forEach(ticket => {
      console.log(`   - ${ticket.jira_issue_key} (Rapporteur: ${ticket.reporter_id})`);
    });
    if (report.tickets.notFound.length > 10) {
      console.log(`   ... et ${report.tickets.notFound.length - 10} autres`);
    }
    console.log('');
  }
  
  if (report.reporters.notMapped.length > 0) {
    console.log('═'.repeat(80));
    console.log(`⚠️  RAPPORTEURS SANS PROFIL (${report.reporters.notMapped.length})`);
    console.log('═'.repeat(80));
    console.log('');
    report.reporters.notMapped.forEach(reporterId => {
      console.log(`   - ${reporterId}`);
    });
    console.log('');
  }
  
  if (report.tickets.withoutProfile.length > 0) {
    console.log('═'.repeat(80));
    console.log(`⚠️  TICKETS À METTRE À JOUR (${report.tickets.withoutProfile.length})`);
    console.log('═'.repeat(80));
    console.log('');
    
    const toUpdate = report.tickets.withoutProfile.filter(t => t.status === '⚠️  À mettre à jour');
    const missingProfile = report.tickets.withoutProfile.filter(t => t.status === '❌ Profil manquant');
    
    if (toUpdate.length > 0) {
      console.log(`📝 Tickets à mettre à jour (${toUpdate.length}):`);
      toUpdate.slice(0, 5).forEach(ticket => {
        console.log(`   - ${ticket.jira_issue_key}: ${ticket.title}`);
        console.log(`     Rapporteur: ${ticket.reporter_name} (${ticket.reporter_email})`);
        console.log(`     created_by actuel: ${ticket.current_created_by || 'NULL'} → ${ticket.expected_created_by}`);
        if (ticket.inconsistencies && ticket.inconsistencies.length > 0) {
          console.log(`     ⚠️  Incohérences détectées:`);
          ticket.inconsistencies.forEach(inc => {
            console.log(`        - ${inc.field}: Sheet="${inc.sheet_value}" vs Supabase="${inc.supabase_value}"`);
          });
        }
        if (ticket.sheet_data?.type_bugs) {
          console.log(`     Type bugs (Sheet): ${ticket.sheet_data.type_bugs}`);
        }
      });
      if (toUpdate.length > 5) {
        console.log(`   ... et ${toUpdate.length - 5} autres`);
      }
      console.log('');
    }
    
    // Afficher les statistiques d'incohérences
    const ticketsWithInconsistencies = toUpdate.filter(t => t.inconsistencies && t.inconsistencies.length > 0);
    if (ticketsWithInconsistencies.length > 0) {
      console.log('═'.repeat(80));
      console.log(`⚠️  TICKETS AVEC INCOHÉRENCES (${ticketsWithInconsistencies.length})`);
      console.log('═'.repeat(80));
      console.log('');
      
      const byField = new Map();
      ticketsWithInconsistencies.forEach(ticket => {
        ticket.inconsistencies.forEach(inc => {
          if (!byField.has(inc.field)) {
            byField.set(inc.field, []);
          }
          byField.get(inc.field).push(ticket.jira_issue_key);
        });
      });
      
      byField.forEach((tickets, field) => {
        console.log(`   ${field}: ${tickets.length} tickets`);
        console.log(`      Exemples: ${tickets.slice(0, 5).join(', ')}${tickets.length > 5 ? ` ... (+${tickets.length - 5})` : ''}`);
        console.log('');
      });
    }
    
    if (missingProfile.length > 0) {
      console.log(`❌ Tickets avec profil manquant (${missingProfile.length}):`);
      missingProfile.slice(0, 5).forEach(ticket => {
        console.log(`   - ${ticket.jira_issue_key}: ${ticket.title}`);
        console.log(`     Rapporteur ID: ${ticket.reporter_id} (profil à créer)`);
      });
      if (missingProfile.length > 5) {
        console.log(`   ... et ${missingProfile.length - 5} autres`);
      }
      console.log('');
    }
  }
  
  console.log('═'.repeat(80));
  console.log('✅ Rapport de validation terminé');
  console.log('═'.repeat(80));
  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // 1. Télécharger et parser le Google Sheet
    const { mapping } = await downloadAndParseGoogleSheet();
    
    // 2. Générer le rapport de validation
    const report = await generateValidationReport(mapping);
    
    // 3. Afficher le rapport
    displayValidationReport(report);
    
    // 4. Sauvegarder le rapport en JSON
    const reportPath = path.resolve(process.cwd(), 'docs/analysis/rapport-validation-createurs.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`💾 Rapport sauvegardé dans: ${reportPath}\n`);
    
    // 5. Résumé final
    console.log('═'.repeat(80));
    console.log('📋 PROCHAINES ÉTAPES');
    console.log('═'.repeat(80));
    console.log('');
    console.log('1. Vérifier le rapport de validation');
    console.log('2. Si tout est correct, exécuter le script de mise à jour');
    console.log('3. Le script mettra à jour tickets.created_by pour tous les tickets identifiés');
    console.log('');
    
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

