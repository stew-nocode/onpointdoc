/**
 * Script d'analyse du fichier client-users-all.csv
 * Analyse la structure et identifie les champs à mettre à jour
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_FILE = join(__dirname, '..', 'docs', 'ticket', 'client-users-all.csv - All.csv');

// Lire le fichier
const content = readFileSync(CSV_FILE, 'utf-8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l);

// Parser l'en-tête
const header = lines[0].split(',').map(c => c.trim());

console.log('📊 ANALYSE DU FICHIER CSV\n');
console.log('='.repeat(80));
console.log(`Total de lignes: ${lines.length}`);
console.log(`\nColonnes identifiées (${header.length}):`);
header.forEach((col, idx) => {
  console.log(`  ${idx + 1}. ${col}`);
});

// Analyser quelques lignes de données
console.log('\n' + '='.repeat(80));
console.log('📋 EXEMPLES DE DONNÉES (premières 5 lignes):\n');

const dataRows = [];
for (let i = 1; i < Math.min(6, lines.length); i++) {
  // Parser la ligne (attention aux virgules dans les champs)
  const row = {};
  let currentField = '';
  let inQuotes = false;
  let fieldIndex = 0;
  
  for (let j = 0; j < lines[i].length; j++) {
    const char = lines[i][j];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row[header[fieldIndex]] = currentField.trim();
      currentField = '';
      fieldIndex++;
    } else {
      currentField += char;
    }
  }
  
  // Dernier champ
  if (fieldIndex < header.length) {
    row[header[fieldIndex]] = currentField.trim();
  }
  
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
}

// Statistiques
console.log('\n' + '='.repeat(80));
console.log('📈 STATISTIQUES:\n');

// Compter les modules "Global"
let globalModuleCount = 0;
let globalSubmoduleCount = 0;
let allCompaniesCount = 0;
let uniqueTickets = new Set();
let uniqueReporters = new Set();
let uniqueUsers = new Set();
let uniqueCompanies = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  let currentField = '';
  let inQuotes = false;
  let fieldIndex = 0;
  const row = {};
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      if (fieldIndex < header.length) {
        row[header[fieldIndex]] = currentField.trim();
      }
      currentField = '';
      fieldIndex++;
    } else {
      currentField += char;
    }
  }
  
  if (fieldIndex < header.length) {
    row[header[fieldIndex]] = currentField.trim();
  }
  
  // Statistiques
  if (row['Clé de ticket']) uniqueTickets.add(row['Clé de ticket']);
  if (row['Rapporteur']) uniqueReporters.add(row['Rapporteur']);
  if (row['Utilisateurs']) uniqueUsers.add(row['Utilisateurs']);
  if (row['Entreprises']) uniqueCompanies.add(row['Entreprises']);
  
  if (row['Module'] === 'Global') globalModuleCount++;
  if (row['Sous-Module(s)'] === 'Global') globalSubmoduleCount++;
  if (row['Entreprises'] === 'ALL') allCompaniesCount++;
}

console.log(`Tickets uniques: ${uniqueTickets.size}`);
console.log(`Rapporteurs uniques: ${uniqueReporters.size}`);
console.log(`Utilisateurs uniques: ${uniqueUsers.size}`);
console.log(`Entreprises uniques: ${uniqueCompanies.size}`);
console.log(`\nTickets avec Module = "Global": ${globalModuleCount}`);
console.log(`Tickets avec Sous-Module = "Global": ${globalSubmoduleCount}`);
console.log(`Tickets avec Entreprises = "ALL": ${allCompaniesCount}`);

// Lister les entreprises uniques
console.log('\n' + '='.repeat(80));
console.log('🏢 ENTREPRISES UNIQUES:\n');
Array.from(uniqueCompanies).sort().forEach(comp => {
  console.log(`  - ${comp}`);
});

// Lister les modules uniques
console.log('\n' + '='.repeat(80));
console.log('📦 MODULES UNIQUES:\n');
const uniqueModules = new Set();
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  let currentField = '';
  let inQuotes = false;
  let fieldIndex = 0;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      if (fieldIndex === header.indexOf('Module')) {
        uniqueModules.add(currentField.trim());
      }
      currentField = '';
      fieldIndex++;
    } else {
      currentField += char;
    }
  }
}
Array.from(uniqueModules).sort().forEach(mod => {
  console.log(`  - ${mod}`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Analyse terminée');

