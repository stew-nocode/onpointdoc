#!/usr/bin/env node

/**
 * Script pour associer les tickets filtrés sur une entreprise spécifique
 * depuis le Google Sheet à cette entreprise dans Supabase
 * 
 * Actions :
 * 1. Filtre les tickets avec l'entreprise spécifiée dans "Champs personnalisés (Client(s))"
 * 2. Trouve l'entreprise dans Supabase par son nom
 * 3. Associe les tickets à cette entreprise via ticket_company_link
 * 4. Met à jour company_id dans tickets (pour compatibilité)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (error) {
  console.error('⚠️  Impossible de charger .env.local:', error.message);
}

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

const OD_COLUMN = 'OD';
const CLIENTS_COLUMN = 'Champs personnalisés (Client(s))';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const companyName = args.find(arg => !arg.startsWith('--')) || '2AAZ';

console.log(`\n🎯 Entreprise cible: "${companyName}"\n`);

async function downloadSheet() {
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  return textDecoder.decode(arrayBuffer);
}

async function extractTicketsForCompany(csvContent, targetCompany) {
  console.log(`📊 Analyse du CSV pour l'entreprise "${targetCompany}"...\n`);
  
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  if (rawRecords.length === 0) {
    throw new Error('Aucune donnée dans le CSV');
  }
  
  console.log(`✅ ${rawRecords.length} lignes trouvées`);
  
  // Trouver les colonnes
  const headers = rawRecords[0];
  const odIndex = headers.indexOf(OD_COLUMN);
  const clientsIndex = headers.indexOf(CLIENTS_COLUMN);
  
  if (odIndex === -1) {
    throw new Error('Colonne OD introuvable');
  }
  
  if (clientsIndex === -1) {
    throw new Error('Colonne "Champs personnalisés (Client(s))" introuvable');
  }
  
  console.log(`✅ Colonne OD: index ${odIndex}`);
  console.log(`✅ Colonne Clients: index ${clientsIndex}\n`);
  
  // Extraire les clés OD pour l'entreprise cible
  const odKeys = [];
  let emptyOD = 0;
  let invalidOD = 0;
  let filteredOut = 0;
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.length <= Math.max(odIndex, clientsIndex)) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    const companyValue = row[clientsIndex]?.trim();
    
    if (!odKey) {
      emptyOD++;
      continue;
    }
    
    // Filtrer uniquement sur l'entreprise cible
    if (!companyValue || companyValue.toUpperCase() !== targetCompany.toUpperCase()) {
      filteredOut++;
      continue;
    }
    
    // Normaliser la clé OD
    const normalizedOD = odKey.toUpperCase().startsWith('OD-') 
      ? odKey.toUpperCase() 
      : `OD-${odKey.toUpperCase()}`;
    
    if (!/^OD-\d+$/.test(normalizedOD)) {
      invalidOD++;
      continue;
    }
    
    odKeys.push(normalizedOD);
  }
  
  console.log('📋 Statistiques:');
  console.log(`   - Clés OD pour "${targetCompany}": ${odKeys.length}`);
  console.log(`   - Tickets exclus (autres entreprises): ${filteredOut}`);
  console.log(`   - Clés OD vides: ${emptyOD}`);
  console.log(`   - Clés OD invalides: ${invalidOD}\n`);
  
  return odKeys;
}

async function findCompanyInSupabase(companyName) {
  console.log(`🔍 Recherche de l'entreprise "${companyName}" dans Supabase...`);
  
  // Chercher par nom exact (insensible à la casse)
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', companyName)
    .limit(5);
  
  if (error) {
    throw new Error(`Erreur lors de la recherche de l'entreprise: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    console.error(`\n❌ Aucune entreprise trouvée avec le nom "${companyName}"`);
    console.error(`\n💡 Entreprises similaires possibles:`);
    
    // Chercher des entreprises similaires
    const { data: similar } = await supabase
      .from('companies')
      .select('id, name')
      .limit(50);
    
    if (similar && similar.length > 0) {
      similar.forEach(c => {
        if (c.name.toUpperCase().includes(companyName.substring(0, 3).toUpperCase()) || 
            companyName.toUpperCase().includes(c.name.substring(0, 3).toUpperCase())) {
          console.error(`   - "${c.name}" (ID: ${c.id})`);
        }
      });
    }
    
    throw new Error(`Entreprise "${companyName}" introuvable`);
  }
  
  // Si plusieurs résultats, prendre le plus proche
  const exactMatch = data.find(c => c.name.toUpperCase() === companyName.toUpperCase());
  const company = exactMatch || data[0];
  
  console.log(`   ✅ Entreprise trouvée: "${company.name}" (ID: ${company.id})\n`);
  
  if (data.length > 1) {
    console.warn(`   ⚠️  Plusieurs entreprises trouvées, utilisation de: "${company.name}"`);
    console.warn(`   Autres résultats:`, data.filter(c => c.id !== company.id).map(c => `"${c.name}"`).join(', '));
    console.warn('');
  }
  
  return company;
}

async function findTicketsByJiraKeys(jiraKeys) {
  console.log(`🔍 Recherche de ${jiraKeys.length} ticket(s) dans Supabase...`);
  
  const tickets = [];
  const notFound = [];
  
  // Traiter par lots de 100
  const batchSize = 100;
  for (let i = 0; i < jiraKeys.length; i += batchSize) {
    const batch = jiraKeys.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, company_id, affects_all_companies')
      .in('jira_issue_key', batch);
    
    if (error) {
      console.error(`❌ Erreur lors de la recherche du lot ${Math.floor(i / batchSize) + 1}:`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      tickets.push(...data);
    }
    
    const foundKeys = new Set(data?.map(t => t.jira_issue_key) || []);
    const missingInBatch = batch.filter(key => !foundKeys.has(key));
    notFound.push(...missingInBatch);
  }
  
  console.log(`   ✅ Tickets trouvés: ${tickets.length}`);
  console.log(`   ❌ Tickets non trouvés: ${notFound.length}\n`);
  
  if (notFound.length > 0 && notFound.length <= 10) {
    console.warn(`⚠️  Tickets non trouvés:`);
    notFound.forEach(key => console.warn(`   - ${key}`));
    console.warn('');
  }
  
  return { tickets, notFound };
}

async function associateTicketsToCompany(tickets, company) {
  console.log(`🔗 Association de ${tickets.length} ticket(s) à l'entreprise "${company.name}"...\n`);
  
  if (isDryRun) {
    console.log('🧪 Mode DRY-RUN : aucune modification ne sera effectuée');
    return { 
      linked: tickets.length, 
      updated: tickets.length,
      errors: [] 
    };
  }
  
  const ticketIds = tickets.map(t => t.id);
  let totalLinked = 0;
  let totalUpdated = 0;
  const errors = [];
  
  // Traiter par lots de 100
  const batchSize = 100;
  for (let i = 0; i < ticketIds.length; i += batchSize) {
    const batch = ticketIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(ticketIds.length / batchSize);
    
    console.log(`   📦 Lot ${batchNumber}/${totalBatches} (${batch.length} ticket(s))...`);
    
    try {
      // 1. Créer les liens dans ticket_company_link (avec is_primary=true pour les tickets concernés)
      const links = batch.map(ticketId => ({
        ticket_id: ticketId,
        company_id: company.id,
        is_primary: true,
        role: 'affected'
      }));
      
      // Utiliser upsert pour éviter les doublons
      const { error: linkError } = await supabase
        .from('ticket_company_link')
        .upsert(links, {
          onConflict: 'ticket_id,company_id',
          ignoreDuplicates: false
        });
      
      if (linkError) {
        console.error(`   ❌ Erreur lors de la création des liens (lot ${batchNumber}):`, linkError.message);
        errors.push({
          batch: batchNumber,
          error: linkError.message,
          type: 'link'
        });
      } else {
        totalLinked += batch.length;
        console.log(`   ✅ Liens créés pour le lot ${batchNumber}`);
      }
      
      // 2. Mettre à jour company_id dans tickets (pour compatibilité)
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ company_id: company.id })
        .in('id', batch);
      
      if (updateError) {
        console.warn(`   ⚠️  Erreur lors de la mise à jour company_id (lot ${batchNumber}):`, updateError.message);
        errors.push({
          batch: batchNumber,
          error: updateError.message,
          type: 'update'
        });
      } else {
        totalUpdated += batch.length;
        console.log(`   ✅ company_id mis à jour pour le lot ${batchNumber}`);
      }
      
      // Petite pause entre les lots
      if (i + batchSize < ticketIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`   ❌ Erreur inattendue lot ${batchNumber}:`, error.message);
      errors.push({
        batch: batchNumber,
        error: error.message,
        type: 'unexpected'
      });
    }
  }
  
  console.log(`\n📊 Résultat global:`);
  console.log(`   - Liens créés: ${totalLinked}/${tickets.length}`);
  console.log(`   - company_id mis à jour: ${totalUpdated}/${tickets.length}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length} lot(s) en erreur`);
  }
  
  return { 
    linked: totalLinked, 
    updated: totalUpdated,
    errors
  };
}

async function generateReport(tickets, notFound, company, result, odKeys) {
  console.log('\n📄 Génération du rapport...');
  
  const reportLines = [
    `# Rapport : Association des tickets à l'entreprise "${company.name}"`,
    '',
    `**Date** : ${new Date().toISOString().split('T')[0]}`,
    `**Entreprise** : ${company.name} (ID: ${company.id})`,
    `**Mode** : ${isDryRun ? 'DRY-RUN (simulation)' : 'PRODUCTION'}`,
    '',
    '## Résumé',
    '',
    `- **Tickets dans le fichier pour "${company.name}"** : ${odKeys.length}`,
    `- **Tickets trouvés dans Supabase** : ${tickets.length}`,
    `- **Tickets non trouvés** : ${notFound.length}`,
    `- **Liens créés dans ticket_company_link** : ${result.linked}`,
    `- **company_id mis à jour** : ${result.updated}`,
    '',
    '## Tickets associés',
    '',
    '| Clé JIRA | ID Ticket | company_id |',
    '|----------|-----------|------------|',
  ];
  
  if (tickets.length > 0) {
    tickets.slice(0, 100).forEach(t => {
      reportLines.push(`| ${t.jira_issue_key} | ${t.id} | ${company.id} |`);
    });
    if (tickets.length > 100) {
      reportLines.push(`| ... et ${tickets.length - 100} autre(s) | | |`);
    }
  } else {
    reportLines.push('| (Aucun) | | |');
  }
  
  if (notFound.length > 0) {
    reportLines.push('', '## Tickets non trouvés dans Supabase', '');
    notFound.slice(0, 50).forEach(key => {
      reportLines.push(`- ${key}`);
    });
    if (notFound.length > 50) {
      reportLines.push(`\n... et ${notFound.length - 50} autre(s)`);
    }
  }
  
  const reportPath = path.join(__dirname, '..', 'docs', 'ticket', `rapport-tickets-${company.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.md`);
  const reportDir = path.dirname(reportPath);
  
  try {
    const fs = await import('fs');
    if (!fs.default.existsSync(reportDir)) {
      fs.default.mkdirSync(reportDir, { recursive: true });
    }
    fs.default.writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
    console.log(`✅ Rapport créé: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️  Impossible de créer le rapport:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage de l\'association des tickets à l\'entreprise\n');
    console.log(`Mode: ${isDryRun ? '🧪 DRY-RUN (simulation)' : '⚡ PRODUCTION'}\n`);
    
    // 1. Télécharger le fichier
    const csvContent = await downloadSheet();
    
    // 2. Extraire les tickets pour l'entreprise cible
    const odKeys = await extractTicketsForCompany(csvContent, companyName);
    
    if (odKeys.length === 0) {
      console.log(`❌ Aucun ticket trouvé pour l'entreprise "${companyName}". Arrêt.`);
      process.exit(1);
    }
    
    // 3. Trouver l'entreprise dans Supabase
    const company = await findCompanyInSupabase(companyName);
    
    // 4. Trouver les tickets dans Supabase
    const { tickets, notFound } = await findTicketsByJiraKeys(odKeys);
    
    if (tickets.length === 0) {
      console.log('\n❌ Aucun ticket trouvé dans Supabase. Arrêt.');
      process.exit(1);
    }
    
    // 5. Associer les tickets à l'entreprise
    const result = await associateTicketsToCompany(tickets, company);
    
    console.log(`\n✅ Opération terminée !`);
    console.log(`   - Tickets associés: ${result.linked}/${tickets.length}`);
    
    // 6. Générer le rapport
    await generateReport(tickets, notFound, company, result, odKeys);
    
    console.log('\n✅ Opération terminée avec succès !');
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

