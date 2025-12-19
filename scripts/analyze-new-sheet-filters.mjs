#!/usr/bin/env node

/**
 * Script pour analyser le fichier Google Sheet et identifier les filtres appliqués
 */

import { parse } from 'csv-parse/sync';

const GOOGLE_SHEET_ID = '1cwjY3Chw5Y2ce_zzBBHOg3R3n1NntmHpLbuxNU8_WOQ';
const GID = '0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

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

async function analyzeSheet(csvContent) {
  console.log('📊 Analyse du fichier...\n');
  
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  if (rawRecords.length === 0) {
    throw new Error('Aucune donnée dans le CSV');
  }
  
  console.log(`✅ ${rawRecords.length} lignes trouvées\n`);
  
  // Analyser les headers
  const headers = rawRecords[0];
  console.log('📋 Headers trouvés:');
  headers.forEach((h, i) => {
    if (h && h.trim()) {
      console.log(`   [${i}] "${h}"`);
    }
  });
  console.log('');
  
  // Trouver les colonnes importantes
  const ticketKeyIndex = headers.findIndex(h => 
    h && (h.includes('Clé') || h.includes('ticket') || h.includes('Key'))
  );
  const companyIndex = headers.findIndex(h => 
    h && (h.includes('Entreprise') || h.includes('Company') || h.includes('Client'))
  );
  const reporterIndex = headers.findIndex(h => 
    h && (h.includes('Rapporteur') || h.includes('Reporter') || h.includes('Créateur'))
  );
  const userIndex = headers.findIndex(h => 
    h && (h.includes('Utilisateur') || h.includes('User') || h.includes('Contact'))
  );
  
  console.log('🔍 Colonnes identifiées:');
  if (ticketKeyIndex !== -1) {
    console.log(`   ✅ Clé de ticket: index ${ticketKeyIndex} ("${headers[ticketKeyIndex]}")`);
  }
  if (companyIndex !== -1) {
    console.log(`   ✅ Entreprise: index ${companyIndex} ("${headers[companyIndex]}")`);
  }
  if (reporterIndex !== -1) {
    console.log(`   ✅ Rapporteur: index ${reporterIndex} ("${headers[reporterIndex]}")`);
  }
  if (userIndex !== -1) {
    console.log(`   ✅ Utilisateur: index ${userIndex} ("${headers[userIndex]}")`);
  }
  console.log('');
  
  // Analyser les données
  const tickets = [];
  const companies = new Set();
  const reporters = new Set();
  const users = new Set();
  let emptyRows = 0;
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    
    if (!row || row.every(cell => !cell || cell.trim() === '')) {
      emptyRows++;
      continue;
    }
    
    const ticketKey = ticketKeyIndex !== -1 ? row[ticketKeyIndex]?.trim() : null;
    const company = companyIndex !== -1 ? row[companyIndex]?.trim() : null;
    const reporter = reporterIndex !== -1 ? row[reporterIndex]?.trim() : null;
    const user = userIndex !== -1 ? row[userIndex]?.trim() : null;
    
    if (ticketKey) {
      tickets.push({
        key: ticketKey,
        company: company || null,
        reporter: reporter || null,
        user: user || null
      });
      
      if (company) companies.add(company);
      if (reporter) reporters.add(reporter);
      if (user) users.add(user);
    }
  }
  
  console.log('📊 Statistiques:');
  console.log(`   - Tickets trouvés: ${tickets.length}`);
  console.log(`   - Entreprises uniques: ${companies.size}`);
  console.log(`   - Rapporteurs uniques: ${reporters.size}`);
  console.log(`   - Utilisateurs uniques: ${users.size}`);
  console.log(`   - Lignes vides: ${emptyRows}\n`);
  
  // Analyser les valeurs uniques
  if (companies.size > 0) {
    console.log('🏢 Entreprises trouvées (par fréquence):');
    const companyCount = new Map();
    tickets.forEach(t => {
      if (t.company) {
        companyCount.set(t.company, (companyCount.get(t.company) || 0) + 1);
      }
    });
    
    Array.from(companyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([company, count]) => {
        console.log(`   - "${company}": ${count} ticket(s)`);
      });
    console.log('');
  }
  
  if (reporters.size > 0) {
    console.log('👤 Rapporteurs trouvés (par fréquence):');
    const reporterCount = new Map();
    tickets.forEach(t => {
      if (t.reporter) {
        reporterCount.set(t.reporter, (reporterCount.get(t.reporter) || 0) + 1);
      }
    });
    
    Array.from(reporterCount.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([reporter, count]) => {
        console.log(`   - "${reporter}": ${count} ticket(s)`);
      });
    console.log('');
  }
  
  // Vérifier si ce sont des clés OBCS ou OD
  const obcsTickets = tickets.filter(t => t.key && t.key.toUpperCase().startsWith('OBCS-'));
  const odTickets = tickets.filter(t => t.key && t.key.toUpperCase().startsWith('OD-'));
  
  console.log('🎫 Types de tickets:');
  console.log(`   - Tickets OBCS: ${obcsTickets.length}`);
  console.log(`   - Tickets OD: ${odTickets.length}`);
  console.log(`   - Autres: ${tickets.length - obcsTickets.length - odTickets.length}\n`);
  
  // Afficher quelques exemples
  console.log('📋 Exemples de tickets (5 premiers):');
  tickets.slice(0, 5).forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.key} - ${t.company || 'N/A'} - Rapporteur: ${t.reporter || 'N/A'}`);
  });
  
  return {
    tickets,
    companies: Array.from(companies),
    reporters: Array.from(reporters),
    users: Array.from(users),
    headers,
    ticketKeyIndex,
    companyIndex,
    reporterIndex,
    userIndex
  };
}

async function main() {
  try {
    const csvContent = await downloadSheet();
    const analysis = await analyzeSheet(csvContent);
    
    console.log('\n✅ Analyse terminée');
    console.log('\n💡 Interprétation:');
    console.log(`   Ce fichier contient ${analysis.tickets.length} tickets filtrés.`);
    console.log(`   Les filtres peuvent être appliqués sur:`);
    console.log(`   - Entreprises: ${analysis.companies.length} entreprises uniques`);
    console.log(`   - Rapporteurs: ${analysis.reporters.length} rapporteurs uniques`);
    console.log(`   - Ou d'autres critères non visibles dans l'export CSV\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

