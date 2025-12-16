/**
 * Script d'analyse du fichier client-users-all.csv - rest.csv
 * Analyse la structure et identifie les champs à mettre à jour
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_FILE = join(__dirname, '..', 'docs', 'ticket', 'client-users-all.csv - rest.csv');

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

// Reconstruire les lignes complètes (gérer les retours à la ligne dans les champs)
function reconstructCSVLines(content) {
  const lines = content.split('\n');
  const completeLines = [];
  let currentLine = '';
  let inQuotes = false;
  let quoteCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineQuoteCount = (line.match(/"/g) || []).length;
    quoteCount += lineQuoteCount;
    
    // Détecter le début d'un nouveau ticket (commence par OBCS- ou OD-)
    const isNewTicket = /^(OBCS-\d+|OD-\d+),/.test(line.trim());
    
    if (inQuotes) {
      // On est dans un champ multi-lignes (description)
      currentLine += '\n' + line;
      // Si nombre pair de guillemets, on sort des guillemets
      if (quoteCount % 2 === 0) {
        inQuotes = false;
        quoteCount = 0;
      }
    } else if (isNewTicket && currentLine) {
      // Nouveau ticket détecté, sauvegarder le précédent
      completeLines.push(currentLine);
      currentLine = line;
      // Vérifier si cette ligne commence dans des guillemets
      if (lineQuoteCount % 2 === 1) {
        inQuotes = true;
        quoteCount = lineQuoteCount;
      } else {
        quoteCount = 0;
      }
    } else {
      // Continuer à accumuler la ligne actuelle
      if (currentLine) {
        currentLine += '\n' + line;
      } else {
        currentLine = line;
      }
      // Vérifier si on entre dans des guillemets
      if (lineQuoteCount % 2 === 1) {
        inQuotes = true;
        quoteCount = lineQuoteCount;
      } else {
        quoteCount = 0;
      }
    }
  }

  if (currentLine) {
    completeLines.push(currentLine);
  }

  return completeLines;
}

// Lire le fichier
const content = readFileSync(CSV_FILE, 'utf-8');
const completeLines = reconstructCSVLines(content);

// Parser l'en-tête
const header = parseCSVLine(completeLines[0]);

console.log('📊 ANALYSE DU FICHIER CSV - REST\n');
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
  uniqueTicketITKeys: new Set(),
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
  ticketsWithTicketITKey: 0,
  ticketsWithTicketKey: 0,
  allCompaniesCount: 0
};

for (let i = 1; i < completeLines.length; i++) {
  const fields = parseCSVLine(completeLines[i]);
  const row = {};
  
  header.forEach((col, idx) => {
    row[col] = fields[idx] || '';
  });
  
  // Collecter les statistiques
  if (row['Clé de ticket']) {
    stats.uniqueTickets.add(row['Clé de ticket']);
    stats.ticketsWithTicketKey++;
  }
  if (row['Clé Ticket IT']) {
    stats.uniqueTicketITKeys.add(row['Clé Ticket IT']);
    stats.ticketsWithTicketITKey++;
  }
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

console.log(`✅ Tickets uniques (Clé de ticket OBCS-): ${stats.uniqueTickets.size}`);
console.log(`✅ Tickets uniques (Clé Ticket IT OD-): ${stats.uniqueTicketITKeys.size}`);
console.log(`📊 Tickets avec Clé de ticket: ${stats.ticketsWithTicketKey}`);
console.log(`📊 Tickets avec Clé Ticket IT: ${stats.ticketsWithTicketITKey}`);
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
console.log('⚡ PRIORITÉS:\n');
Array.from(stats.uniquePriorities).sort().forEach(prio => {
  console.log(`  - ${prio}`);
});

console.log('\n' + '='.repeat(80));
console.log('📞 CANAUX:\n');
Array.from(stats.uniqueCanals).sort().forEach(canal => {
  console.log(`  - ${canal}`);
});

// Analyser les clés de tickets
console.log('\n' + '='.repeat(80));
console.log('🔑 ANALYSE DES CLÉS DE TICKETS:\n');

const ticketsWithBothKeys = [];
const ticketsWithOnlyOBCS = [];
const ticketsWithOnlyOD = [];
const ticketsWithNoKey = [];

for (let i = 1; i < completeLines.length; i++) {
  const fields = parseCSVLine(completeLines[i]);
  const row = {};
  header.forEach((col, idx) => {
    row[col] = fields[idx] || '';
  });
  
  const ticketKey = row['Clé de ticket']?.trim() || '';
  const ticketITKey = row['Clé Ticket IT']?.trim() || '';
  
  if (ticketKey && ticketITKey) {
    ticketsWithBothKeys.push({ ticketKey, ticketITKey });
  } else if (ticketKey && !ticketITKey) {
    ticketsWithOnlyOBCS.push(ticketKey);
  } else if (!ticketKey && ticketITKey) {
    ticketsWithOnlyOD.push(ticketITKey);
  } else {
    ticketsWithNoKey.push(i);
  }
}

console.log(`Tickets avec les deux clés (OBCS- + OD-): ${ticketsWithBothKeys.length}`);
console.log(`Tickets avec uniquement Clé de ticket (OBCS-): ${ticketsWithOnlyOBCS.length}`);
console.log(`Tickets avec uniquement Clé Ticket IT (OD-): ${ticketsWithOnlyOD.length}`);
console.log(`Tickets sans clé: ${ticketsWithNoKey.length}`);

if (ticketsWithOnlyOBCS.length > 0) {
  console.log('\nExemples de tickets avec uniquement OBCS- (premiers 5):');
  ticketsWithOnlyOBCS.slice(0, 5).forEach(key => {
    console.log(`  - ${key}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('✅ Analyse terminée');
console.log('\n⚠️  IMPORTANT: Tous les tickets concernent TOUTES les entreprises');
console.log('   → affects_all_companies = true pour tous les tickets');






