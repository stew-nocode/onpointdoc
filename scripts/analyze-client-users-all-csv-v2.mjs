/**
 * Script d'analyse amélioré du fichier client-users-all.csv
 * Gère correctement les champs multi-lignes et les guillemets
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
        // Double guillemet = guillemet échappé
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Fin du champ
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Dernier champ
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
  // Compter les guillemets dans la ligne
  const quoteCount = (line.match(/"/g) || []).length;
  
  if (inQuotes) {
    // On est dans un champ multi-ligne, continuer à accumuler
    currentLine += '\n' + line;
    // Si nombre pair de guillemets, on sort des guillemets
    if (quoteCount % 2 === 0) {
      inQuotes = false;
    }
  } else {
    // Nouvelle ligne normale
    if (currentLine) {
      completeLines.push(currentLine);
    }
    currentLine = line;
    // Si nombre impair de guillemets, on entre dans un champ multi-ligne
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

console.log('📊 ANALYSE DU FICHIER CSV\n');
console.log('='.repeat(80));
console.log(`Total de lignes complètes: ${completeLines.length}`);
console.log(`\nColonnes identifiées (${header.length}):`);
header.forEach((col, idx) => {
  console.log(`  ${idx + 1}. ${col}`);
});

// Analyser les données
console.log('\n' + '='.repeat(80));
console.log('📋 EXEMPLES DE DONNÉES (premières 3 lignes):\n');

const dataRows = [];
for (let i = 1; i < Math.min(4, completeLines.length); i++) {
  const fields = parseCSVLine(completeLines[i]);
  const row = {};
  
  header.forEach((col, idx) => {
    row[col] = fields[idx] || '';
  });
  
  dataRows.push(row);
  
  console.log(`\nLigne ${i}:`);
  console.log(`  Clé de ticket: ${row['Clé de ticket'] || 'N/A'}`);
  console.log(`  Clé Ticket IT: ${row['Clé Ticket IT'] || 'N/A'}`);
  console.log(`  Rapporteur: ${row['Rapporteur'] || 'N/A'}`);
  console.log(`  Utilisateurs: ${row['Utilisateurs'] || 'N/A'}`);
  console.log(`  Entreprises: ${row['Entreprises'] || 'N/A'}`);
  console.log(`  Module: ${row['Module'] || 'N/A'}`);
  console.log(`  Sous-Module(s): ${row['Sous-Module(s)'] || 'N/A'}`);
  console.log(`  Type_Ticket: ${row['Type_Ticket'] || 'N/A'}`);
  console.log(`  Etat: ${row['Etat'] || 'N/A'}`);
  console.log(`  Fonctionnalité: ${row['Fonctionnalité'] || 'N/A'}`);
}

// Statistiques complètes
console.log('\n' + '='.repeat(80));
console.log('📈 STATISTIQUES COMPLÈTES:\n');

const stats = {
  uniqueTickets: new Set(),
  uniqueReporters: new Set(),
  uniqueUsers: new Set(),
  uniqueCompanies: new Set(),
  uniqueModules: new Set(),
  uniqueSubmodules: new Set(),
  uniqueTicketTypes: new Set(),
  uniqueStates: new Set(),
  globalModuleCount: 0,
  globalSubmoduleCount: 0,
  allCompaniesCount: 0,
  ticketsWithUsers: 0,
  ticketsWithCompanies: 0
};

for (let i = 1; i < completeLines.length; i++) {
  const fields = parseCSVLine(completeLines[i]);
  const row = {};
  
  header.forEach((col, idx) => {
    row[col] = fields[idx] || '';
  });
  
  // Collecter les statistiques
  if (row['Clé de ticket']) stats.uniqueTickets.add(row['Clé de ticket']);
  if (row['Rapporteur']) stats.uniqueReporters.add(row['Rapporteur']);
  if (row['Utilisateurs']) {
    stats.uniqueUsers.add(row['Utilisateurs']);
    stats.ticketsWithUsers++;
  }
  if (row['Entreprises']) {
    stats.uniqueCompanies.add(row['Entreprises']);
    if (row['Entreprises'] !== 'ALL') stats.ticketsWithCompanies++;
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
  if (row['Entreprises'] === 'ALL') stats.allCompaniesCount++;
}

console.log(`Tickets uniques: ${stats.uniqueTickets.size}`);
console.log(`Rapporteurs uniques: ${stats.uniqueReporters.size}`);
console.log(`Utilisateurs uniques: ${stats.uniqueUsers.size}`);
console.log(`Entreprises uniques: ${stats.uniqueCompanies.size}`);
console.log(`Modules uniques: ${stats.uniqueModules.size}`);
console.log(`Sous-modules uniques: ${stats.uniqueSubmodules.size}`);
console.log(`Types de tickets uniques: ${stats.uniqueTicketTypes.size}`);
console.log(`États uniques: ${stats.uniqueStates.size}`);
console.log(`\nTickets avec Module = "Global": ${stats.globalModuleCount}`);
console.log(`Tickets avec Sous-Module = "Global": ${stats.globalSubmoduleCount}`);
console.log(`Tickets avec Entreprises = "ALL": ${stats.allCompaniesCount}`);
console.log(`Tickets avec utilisateur renseigné: ${stats.ticketsWithUsers}`);
console.log(`Tickets avec entreprise spécifique (non-ALL): ${stats.ticketsWithCompanies}`);

// Détails
console.log('\n' + '='.repeat(80));
console.log('🏢 ENTREPRISES UNIQUES:\n');
Array.from(stats.uniqueCompanies).sort().forEach(comp => {
  console.log(`  - ${comp}`);
});

console.log('\n' + '='.repeat(80));
console.log('📦 MODULES UNIQUES:\n');
Array.from(stats.uniqueModules).sort().forEach(mod => {
  console.log(`  - ${mod}`);
});

console.log('\n' + '='.repeat(80));
console.log('📋 SOUS-MODULES UNIQUES (premiers 20):\n');
Array.from(stats.uniqueSubmodules).sort().slice(0, 20).forEach(submod => {
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
console.log('✅ Analyse terminée');

