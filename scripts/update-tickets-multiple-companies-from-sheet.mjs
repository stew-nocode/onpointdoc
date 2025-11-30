#!/usr/bin/env node

/**
 * Script pour associer les tickets à leurs entreprises respectives
 * depuis le Google Sheet filtré sur plusieurs entreprises
 * 
 * Actions :
 * 1. Extrait toutes les entreprises uniques du fichier filtré
 * 2. Vérifie quelles entreprises existent dans Supabase
 * 3. Pour chaque entreprise valide, associe ses tickets
 * 4. Ignore les tickets dont l'entreprise n'est pas dans Supabase
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
const ALL_COMPANIES_VALUE = 'ALL'; // Valeur à ignorer (déjà traitée)

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

async function downloadSheet() {
  console.log('📥 Téléchargement du Google Sheet filtré...');
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  return textDecoder.decode(arrayBuffer);
}

async function extractTicketsByCompany(csvContent) {
  console.log('📊 Analyse du CSV filtré...\n');
  
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
  
  // Grouper les tickets par entreprise
  const ticketsByCompany = new Map(); // companyName -> [odKeys]
  let emptyOD = 0;
  let invalidOD = 0;
  let ignoredALL = 0;
  let emptyCompany = 0;
  
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
    
    if (!companyValue || companyValue === '') {
      emptyCompany++;
      continue;
    }
    
    // Ignorer "ALL" (déjà traité)
    if (companyValue.toUpperCase() === ALL_COMPANIES_VALUE.toUpperCase()) {
      ignoredALL++;
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
    
    // Grouper par entreprise
    const companyName = companyValue;
    if (!ticketsByCompany.has(companyName)) {
      ticketsByCompany.set(companyName, []);
    }
    ticketsByCompany.get(companyName).push(normalizedOD);
  }
  
  console.log('📋 Statistiques:');
  console.log(`   - Entreprises trouvées: ${ticketsByCompany.size}`);
  console.log(`   - Tickets avec "ALL" ignorés: ${ignoredALL}`);
  console.log(`   - Tickets avec entreprise vide: ${emptyCompany}`);
  console.log(`   - Clés OD vides: ${emptyOD}`);
  console.log(`   - Clés OD invalides: ${invalidOD}\n`);
  
  // Afficher le nombre de tickets par entreprise
  console.log('🏢 Tickets par entreprise:');
  const sortedCompanies = Array.from(ticketsByCompany.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedCompanies.forEach(([company, tickets]) => {
    console.log(`   - "${company}": ${tickets.length} ticket(s)`);
  });
  console.log('');
  
  return ticketsByCompany;
}

async function findCompaniesInSupabase(companyNames) {
  console.log(`🔍 Recherche de ${companyNames.length} entreprise(s) dans Supabase...\n`);
  
  const companiesMap = new Map(); // companyName -> { id, name }
  const notFound = [];
  
  // Rechercher par lots pour éviter les requêtes trop longues
  const batchSize = 20;
  for (let i = 0; i < companyNames.length; i += batchSize) {
    const batch = companyNames.slice(i, i + batchSize);
    
    // Construire une requête avec OR pour chaque nom
    let query = supabase
      .from('companies')
      .select('id, name')
      .limit(100);
    
    // Filtrer avec OR pour chaque nom (insensible à la casse)
    const conditions = batch.map(name => `name.ilike."${name}"`).join(',');
    query = query.or(conditions);
    
    const { data, error } = await query;
    
    if (error) {
      console.warn(`   ⚠️  Erreur lors de la recherche du lot ${Math.floor(i / batchSize) + 1}:`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      // Créer un map pour matching insensible à la casse
      const dataMap = new Map(data.map(c => [c.name.toUpperCase(), c]));
      
      batch.forEach(companyName => {
        const upperName = companyName.toUpperCase();
        const found = dataMap.get(upperName);
        
        if (found) {
          companiesMap.set(companyName, found);
        } else {
          notFound.push(companyName);
        }
      });
    } else {
      // Aucun résultat pour ce lot
      batch.forEach(name => notFound.push(name));
    }
  }
  
  // Recherche alternative : chercher une par une pour meilleure précision
  for (const companyName of companyNames) {
    if (companiesMap.has(companyName)) continue;
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', companyName)
      .limit(5);
    
    if (error) continue;
    
    if (data && data.length > 0) {
      // Prendre le match exact ou le premier résultat
      const exactMatch = data.find(c => c.name.toUpperCase() === companyName.toUpperCase());
      companiesMap.set(companyName, exactMatch || data[0]);
    } else {
      notFound.push(companyName);
    }
  }
  
  // Dédupliquer les entreprises non trouvées
  const uniqueNotFound = [...new Set(notFound)];
  
  console.log(`   ✅ Entreprises trouvées: ${companiesMap.size}`);
  console.log(`   ❌ Entreprises non trouvées: ${uniqueNotFound.length}\n`);
  
  if (uniqueNotFound.length > 0 && uniqueNotFound.length <= 20) {
    console.warn('⚠️  Entreprises non trouvées dans Supabase:');
    uniqueNotFound.forEach(name => {
      const ticketCount = ticketsByCompany?.get(name)?.length || 0;
      console.warn(`   - "${name}" (${ticketCount} ticket(s))`);
    });
    console.warn('');
  } else if (uniqueNotFound.length > 20) {
    console.warn(`⚠️  ${uniqueNotFound.length} entreprises non trouvées (voir le rapport)\n`);
  }
  
  return { companiesMap, notFound };
}

async function findTicketsByJiraKeys(jiraKeys) {
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
  
  return { tickets, notFound };
}

async function associateTicketsToCompany(tickets, company) {
  if (isDryRun) {
    return { 
      linked: tickets.length, 
      updated: tickets.length,
      errors: [] 
    };
  }
  
  const ticketIds = tickets.map(t => t.id);
  let totalLinked = 0;
  let totalUpdated = 0;
  
  // Traiter par lots de 100
  const batchSize = 100;
  for (let i = 0; i < ticketIds.length; i += batchSize) {
    const batch = ticketIds.slice(i, i + batchSize);
    
    try {
      // 1. Créer les liens dans ticket_company_link
      const links = batch.map(ticketId => ({
        ticket_id: ticketId,
        company_id: company.id,
        is_primary: true,
        role: 'affected'
      }));
      
      const { error: linkError } = await supabase
        .from('ticket_company_link')
        .upsert(links, {
          onConflict: 'ticket_id,company_id',
          ignoreDuplicates: false
        });
      
      if (!linkError) {
        totalLinked += batch.length;
      }
      
      // 2. Mettre à jour company_id dans tickets
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ company_id: company.id })
        .in('id', batch);
      
      if (!updateError) {
        totalUpdated += batch.length;
      }
      
      if (i + batchSize < ticketIds.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      console.error(`   ❌ Erreur lot ${Math.floor(i / batchSize) + 1}:`, error.message);
    }
  }
  
  return { 
    linked: totalLinked, 
    updated: totalUpdated,
    errors: []
  };
}

async function processAllCompanies(ticketsByCompany) {
  console.log('\n🚀 Traitement des entreprises...\n');
  
  const companyNames = Array.from(ticketsByCompany.keys());
  const { companiesMap, notFound } = await findCompaniesInSupabase(companyNames);
  
  const results = [];
  let totalTicketsProcessed = 0;
  let totalTicketsLinked = 0;
  
  // Traiter chaque entreprise valide
  for (const [companyName, company] of companiesMap.entries()) {
    const odKeys = ticketsByCompany.get(companyName);
    
    if (!odKeys || odKeys.length === 0) {
      continue;
    }
    
    console.log(`\n📦 Traitement de "${companyName}" (${odKeys.length} ticket(s))...`);
    
    // Trouver les tickets dans Supabase
    const { tickets, notFound: ticketsNotFound } = await findTicketsByJiraKeys(odKeys);
    
    if (tickets.length === 0) {
      console.log(`   ⚠️  Aucun ticket trouvé pour "${companyName}"`);
      results.push({
        company: companyName,
        companyId: company.id,
        ticketsFound: 0,
        ticketsLinked: 0,
        ticketsNotFound: ticketsNotFound.length,
        status: 'no_tickets'
      });
      continue;
    }
    
    // Associer les tickets à l'entreprise
    const result = await associateTicketsToCompany(tickets, company);
    
    console.log(`   ✅ ${result.linked} ticket(s) associé(s)`);
    
    totalTicketsProcessed += tickets.length;
    totalTicketsLinked += result.linked;
    
    results.push({
      company: companyName,
      companyId: company.id,
      ticketsFound: tickets.length,
      ticketsLinked: result.linked,
      ticketsNotFound: ticketsNotFound.length,
      status: 'success'
    });
  }
  
  // Résumé des entreprises ignorées (dédupliquées)
  const uniqueNotFound = [...new Set(notFound)];
  const ignoredCompanies = uniqueNotFound.map(name => ({
    company: name,
    ticketCount: ticketsByCompany.get(name)?.length || 0
  }));
  
  return {
    results,
    ignoredCompanies,
    totalTicketsProcessed,
    totalTicketsLinked
  };
}

async function generateReport(summary, ticketsByCompany) {
  console.log('\n📄 Génération du rapport...');
  
  const reportLines = [
    `# Rapport : Association des tickets à leurs entreprises`,
    '',
    `**Date** : ${new Date().toISOString().split('T')[0]}`,
    `**Mode** : ${isDryRun ? 'DRY-RUN (simulation)' : 'PRODUCTION'}`,
    '',
    '## Résumé',
    '',
    `- **Entreprises trouvées dans le filtre** : ${ticketsByCompany.size}`,
    `- **Entreprises valides dans Supabase** : ${summary.results.length}`,
    `- **Entreprises ignorées (non trouvées)** : ${summary.ignoredCompanies.length}`,
    `- **Tickets traités** : ${summary.totalTicketsProcessed}`,
    `- **Tickets associés** : ${summary.totalTicketsLinked}`,
    '',
    '## Entreprises traitées',
    '',
    '| Entreprise | ID | Tickets trouvés | Tickets associés | Statut |',
    '|------------|----|------------------|------------------|--------|',
  ];
  
  summary.results.forEach(r => {
    const status = r.status === 'success' ? '✅' : '⚠️';
    reportLines.push(`| ${r.company} | ${r.companyId} | ${r.ticketsFound} | ${r.ticketsLinked} | ${status} |`);
  });
  
  if (summary.ignoredCompanies.length > 0) {
    reportLines.push('', '## Entreprises ignorées (non trouvées dans Supabase)', '');
    summary.ignoredCompanies
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .forEach(ic => {
        reportLines.push(`- **${ic.company}** : ${ic.ticketCount} ticket(s)`);
      });
  }
  
  const reportPath = path.join(__dirname, '..', 'docs', 'ticket', `rapport-tickets-multiple-companies-${Date.now()}.md`);
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

// Variable globale pour l'utiliser dans findCompaniesInSupabase
let ticketsByCompany;

async function main() {
  try {
    console.log('🚀 Démarrage de l\'association des tickets aux entreprises\n');
    console.log(`Mode: ${isDryRun ? '🧪 DRY-RUN (simulation)' : '⚡ PRODUCTION'}\n`);
    
    // 1. Télécharger le fichier
    const csvContent = await downloadSheet();
    
    // 2. Extraire les tickets groupés par entreprise
    ticketsByCompany = await extractTicketsByCompany(csvContent);
    
    if (ticketsByCompany.size === 0) {
      console.log('❌ Aucune entreprise trouvée dans le fichier. Arrêt.');
      process.exit(1);
    }
    
    // 3. Traiter toutes les entreprises
    const summary = await processAllCompanies(ticketsByCompany);
    
    // 4. Afficher le résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(60));
    console.log(`   Entreprises traitées: ${summary.results.length}`);
    console.log(`   Entreprises ignorées: ${summary.ignoredCompanies.length}`);
    console.log(`   Tickets traités: ${summary.totalTicketsProcessed}`);
    console.log(`   Tickets associés: ${summary.totalTicketsLinked}`);
    console.log('='.repeat(60) + '\n');
    
    // 5. Générer le rapport
    await generateReport(summary, ticketsByCompany);
    
    console.log('\n✅ Opération terminée avec succès !');
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

