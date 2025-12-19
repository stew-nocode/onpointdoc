/**
 * Script d'analyse final du fichier client-users-all.csv
 * Tous les tickets concernent toutes les entreprises (affects_all_companies = true)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_FILE = join(__dirname, '..', 'docs', 'ticket', 'client-users-all.csv - All.csv');

// Fonction pour parser CSV avec gestion des guillemets et retours à la ligne
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  fields.push(currentField.trim());
  return fields;
}

// Lire le fichier
const content = readFileSync(CSV_FILE, 'utf-8');
const lines = content.split('\n');

// Reconstruire les lignes complètes (gérer les retours à la ligne dans les champs)
const completeLines = [];
let currentLine = '';
let inQuotes = false;

for (const line of lines) {
  const quoteCount = (line.match(/"/g) || []).length;
  
  if (inQuotes) {
    currentLine += '\n' + line;
    if (quoteCount % 2 === 0) {
      inQuotes = false;
    }
  } else {
    if (currentLine) {
      completeLines.push(currentLine);
    }
    currentLine = line;
    if (quoteCount % 2 === 1) {
      inQuotes = true;
    }
  }
}

if (currentLine) {
  completeLines.push(currentLine);
}

// Parser l'en-tête
const header = parseCSVLine(completeLines[0]);

console.log('📊 ANALYSE DU FICHIER CSV (TOUS LES TICKETS = PORTÉE GLOBALE)\n');
console.log('='.repeat(80));
console.log(`Total de lignes complètes: ${completeLines.length - 1} tickets`);
console.log(`\nColonnes identifiées (${header.length}):`);
header.forEach((col, idx) => {
  console.log(`  ${idx + 1}. ${col}`);
});

// Analyser les données
console.log('\n' + '='.repeat(80));
console.log('📋 EXEMPLES DE DONNÉES (premières 5 lignes):\n');

const dataRows = [];
for (let i = 1; i < Math.min(6, completeLines.length); i++) {
  const fields = parseCSVLine(completeLines[i]);
  const row = {};
  
  header.forEach((col, idx) => {
    row[col] = fields[idx] || '';
  });
  
  dataRows.push(row);
  
  console.log(`\nTicket ${i}:`);
  console.log(`  Clé de ticket: ${row['Clé de ticket'] || 'N/A'}`);
  console.log(`  Clé Ticket IT: ${row['Clé Ticket IT'] || 'N/A'}`);
  console.log(`  Résumé: ${(row['Résumé'] || '').substring(0, 60)}...`);
  console.log(`  Rapporteur: ${row['Rapporteur'] || 'N/A'}`);
  console.log(`  Utilisateurs: ${row['Utilisateurs'] || 'N/A'}`);
  console.log(`  Entreprises: ${row['Entreprises'] || 'N/A'} (⚠️ TOUS = portée globale)`);
  console.log(`  Module: ${row['Module'] || 'N/A'}`);
  console.log(`  Sous-Module(s): ${row['Sous-Module(s)'] || 'N/A'}`);
  console.log(`  Type_Ticket: ${row['Type_Ticket'] || 'N/A'}`);
  console.log(`  Etat: ${row['Etat'] || 'N/A'}`);
  console.log(`  Priorité: ${row['Priorité'] || 'N/A'}`);
  console.log(`  Fonctionnalité: ${row['Fonctionnalité'] || 'N/A'}`);
}

// Statistiques complètes
console.log('\n' + '='.repeat(80));
console.log('📈 STATISTIQUES COMPLÈTES:\n');

const stats = {
  uniqueTickets: new Set(),
  uniqueReporters: new Set(),
  uniqueUsers: new Set(),
  uniqueModules: new Set(),
  uniqueSubmodules: new Set(),
  uniqueTicketTypes: new Set(),
  uniqueStates: new Set(),
  uniquePriorities: new Set(),
  uniqueCanals: new Set(),
  globalModuleCount: 0,
  globalSubmoduleCount: 0,
  globalFeatureCount: 0,
  ticketsWithUsers: 0,
  ticketsWithReporters: 0,
  allCompaniesCount: 0
};

for (let i = 1; i < completeLines.length; i++) {
  const fields = parseCSVLine(completeLines[i]);
  const row = {};
  
  header.forEach((col, idx) => {
    row[col] = fields[idx] || '';
  });
  
  // Collecter les statistiques
  if (row['Clé de ticket']) stats.uniqueTickets.add(row['Clé de ticket']);
  if (row['Rapporteur']) {
    stats.uniqueReporters.add(row['Rapporteur']);
    stats.ticketsWithReporters++;
  }
  if (row['Utilisateurs']) {
    stats.uniqueUsers.add(row['Utilisateurs']);
    stats.ticketsWithUsers++;
  }
  if (row['Module']) {
    stats.uniqueModules.add(row['Module']);
    if (row['Module'] === 'Global') stats.globalModuleCount++;
  }
  if (row['Sous-Module(s)']) {
    stats.uniqueSubmodules.add(row['Sous-Module(s)']);
    if (row['Sous-Module(s)'] === 'Global') stats.globalSubmoduleCount++;
  }
  if (row['Type_Ticket']) stats.uniqueTicketTypes.add(row['Type_Ticket']);
  if (row['Etat']) stats.uniqueStates.add(row['Etat']);
  if (row['Priorité']) stats.uniquePriorities.add(row['Priorité']);
  if (row['Canal']) stats.uniqueCanals.add(row['Canal']);
  if (row['Fonctionnalité'] === 'Global') stats.globalFeatureCount++;
  if (row['Entreprises'] === 'ALL') stats.allCompaniesCount++;
}

console.log(`✅ Tickets uniques: ${stats.uniqueTickets.size}`);
console.log(`👤 Rapporteurs uniques: ${stats.uniqueReporters.size} (${stats.ticketsWithReporters} tickets avec rapporteur)`);
console.log(`👥 Utilisateurs clients uniques: ${stats.uniqueUsers.size} (${stats.ticketsWithUsers} tickets avec utilisateur)`);
console.log(`📦 Modules uniques: ${stats.uniqueModules.size}`);
console.log(`📋 Sous-modules uniques: ${stats.uniqueSubmodules.size}`);
console.log(`🎫 Types de tickets uniques: ${stats.uniqueTicketTypes.size}`);
console.log(`📊 États uniques: ${stats.uniqueStates.size}`);
console.log(`⚡ Priorités uniques: ${stats.uniquePriorities.size}`);
console.log(`📞 Canaux uniques: ${stats.uniqueCanals.size}`);
console.log(`\n🔍 Tickets avec Module = "Global": ${stats.globalModuleCount}`);
console.log(`🔍 Tickets avec Sous-Module = "Global": ${stats.globalSubmoduleCount}`);
console.log(`🔍 Tickets avec Fonctionnalité = "Global": ${stats.globalFeatureCount}`);
console.log(`🌍 Tickets avec Entreprises = "ALL": ${stats.allCompaniesCount} (tous concernent toutes les entreprises)`);

// Détails
console.log('\n' + '='.repeat(80));
console.log('👤 RAPPORTEURS UNIQUES:\n');
Array.from(stats.uniqueReporters).sort().forEach(rep => {
  console.log(`  - ${rep}`);
});

console.log('\n' + '='.repeat(80));
console.log('👥 UTILISATEURS CLIENTS UNIQUES:\n');
Array.from(stats.uniqueUsers).sort().forEach(user => {
  console.log(`  - ${user}`);
});

console.log('\n' + '='.repeat(80));
console.log('📦 MODULES UNIQUES:\n');
Array.from(stats.uniqueModules).sort().forEach(mod => {
  console.log(`  - ${mod}`);
});

console.log('\n' + '='.repeat(80));
console.log('📋 SOUS-MODULES UNIQUES:\n');
Array.from(stats.uniqueSubmodules).sort().forEach(submod => {
  console.log(`  - ${submod}`);
});

console.log('\n' + '='.repeat(80));
console.log('🎫 TYPES DE TICKETS:\n');
Array.from(stats.uniqueTicketTypes).sort().forEach(type => {
  console.log(`  - ${type}`);
});

console.log('\n' + '='.repeat(80));
console.log('📊 ÉTATS:\n');
Array.from(stats.uniqueStates).sort().forEach(state => {
  console.log(`  - ${state}`);
});

console.log('\n' + '='.repeat(80));
console.log('⚡ PRIORITÉS:\n');
Array.from(stats.uniquePriorities).sort().forEach(prio => {
  console.log(`  - ${prio}`);
});

console.log('\n' + '='.repeat(80));
console.log('📞 CANAUX:\n');
Array.from(stats.uniqueCanals).sort().forEach(canal => {
  console.log(`  - ${canal}`);
});

// Analyser les dates
console.log('\n' + '='.repeat(80));
console.log('📅 ANALYSE DES DATES (exemples):\n');

let dateExamples = {
  creation: new Set(),
  update: new Set(),
  resolution: new Set()
};

for (let i = 1; i < Math.min(10, completeLines.length); i++) {
  const fields = parseCSVLine(completeLines[i]);
  const row = {};
  header.forEach((col, idx) => {
    row[col] = fields[idx] || '';
  });
  
  if (row['Date de creation de Jira']) {
    dateExamples.creation.add(row['Date de creation de Jira']);
  }
  if (row['Date de mise à jour Jira']) {
    dateExamples.update.add(row['Date de mise à jour Jira']);
  }
  if (row['Date de résolution']) {
    dateExamples.resolution.add(row['Date de résolution']);
  }
}

console.log('Formats de dates de création:');
Array.from(dateExamples.creation).slice(0, 3).forEach(d => {
  console.log(`  - "${d}"`);
});

console.log('\nFormats de dates de mise à jour:');
Array.from(dateExamples.update).slice(0, 3).forEach(d => {
  console.log(`  - "${d}"`);
});

console.log('\nFormats de dates de résolution:');
Array.from(dateExamples.resolution).slice(0, 3).forEach(d => {
  console.log(`  - "${d}"`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Analyse terminée');
console.log('\n⚠️  IMPORTANT: Tous les tickets concernent TOUTES les entreprises');
console.log('   → affects_all_companies = true pour tous les tickets');

