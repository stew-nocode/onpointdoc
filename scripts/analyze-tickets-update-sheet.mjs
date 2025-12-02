/**
 * Script d'analyse du fichier Google Sheets pour la mise à jour des tickets
 * 
 * Analyse les colonnes :
 * - "Clé de ticket" (OBCS)
 * - "Entreprise" (déjà filtrée pour exclure "ALL")
 * - "Utilisateurs" (profil qui demande le ticket)
 * 
 * Objectif : Préparer la mise à jour par vagues selon entreprises et utilisateurs
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

const CSV_FILE = join(process.cwd(), 'docs/ticket/tickets-analyse.csv');
const CORRESPONDENCE_FILE = join(process.cwd(), 'docs/ticket/correspondance - Jira (3).csv');

/**
 * Charge la correspondance OBCS → OD depuis le fichier
 */
function loadCorrespondenceMap() {
  try {
    const content = readFileSync(CORRESPONDENCE_FILE, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    });

    const map = new Map();
    for (const record of records) {
      const odKey = record['Clé de ticket']?.trim();
      const obcsKey = record['Lien de ticket sortant (Duplicate)']?.trim();
      
      if (odKey && obcsKey && odKey.startsWith('OD-') && obcsKey.startsWith('OBCS-')) {
        map.set(obcsKey, odKey);
      }
    }

    console.log(`📋 Correspondances chargées : ${map.size} mappings OBCS → OD\n`);
    return map;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la correspondance:', error.message);
    return new Map();
  }
}

/**
 * Analyse le fichier CSV des tickets à mettre à jour
 */
function analyzeTicketsFile() {
  try {
    const content = readFileSync(CSV_FILE, 'utf-8');
    
    // Vérifier si c'est du HTML (page d'authentification)
    if (content.trim().startsWith('<!DOCTYPE html') || content.includes('<html')) {
      console.error('❌ Le fichier téléchargé est une page HTML d\'authentification.');
      console.error('   Veuillez télécharger manuellement le CSV depuis Google Sheets.');
      console.error('   URL: https://docs.google.com/spreadsheets/d/1c4PEgIGrhLBhzF3SYLNS-XsaPUl2tJk8awmbzBOj-dQ/export?format=csv&gid=0');
      return null;
    }

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: true
    });

    console.log(`📊 Analyse du fichier : ${records.length} lignes trouvées\n`);
    
    // Identifier les colonnes disponibles
    if (records.length > 0) {
      console.log('📋 Colonnes disponibles :');
      Object.keys(records[0]).forEach((col, i) => {
        console.log(`   ${i + 1}. "${col}"`);
      });
      console.log('');
    }

    return records;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Fichier non trouvé. Veuillez télécharger le CSV depuis Google Sheets.');
      console.error('   Placez-le dans : docs/ticket/tickets-analyse.csv');
      console.error('   URL: https://docs.google.com/spreadsheets/d/1c4PEgIGrhLBhzF3SYLNS-XsaPUl2tJk8awmbzBOj-dQ/export?format=csv&gid=0');
    } else {
      console.error('❌ Erreur lors de la lecture du fichier:', error.message);
    }
    return null;
  }
}

/**
 * Analyse la structure des données
 */
function analyzeDataStructure(records, correspondenceMap) {
  if (!records || records.length === 0) {
    return;
  }

  // Identifier les noms de colonnes possibles
  const possibleColumns = {
    ticketKey: ['Clé de ticket', 'Clé de ticketé', 'OBCS', 'Ticket Key', 'key'],
    company: ['Entreprise', 'Company', 'Entreprises', 'Compagnie'],
    user: ['Utilisateurs', 'User', 'Utilisateur', 'Profile', 'Demandeur', 'Rapporteur']
  };

  // Trouver les colonnes réelles
  const headers = Object.keys(records[0]);
  const ticketKeyCol = headers.find(h => 
    possibleColumns.ticketKey.some(p => h.toLowerCase().includes(p.toLowerCase()))
  );
  const companyCol = headers.find(h => 
    possibleColumns.company.some(p => h.toLowerCase().includes(p.toLowerCase()))
  );
  const userCol = headers.find(h => 
    possibleColumns.user.some(p => h.toLowerCase().includes(p.toLowerCase()))
  );

  console.log('🔍 Colonnes identifiées :');
  console.log(`   - Clé de ticket : ${ticketKeyCol || 'NON TROUVÉE'}`);
  console.log(`   - Entreprise : ${companyCol || 'NON TROUVÉE'}`);
  console.log(`   - Utilisateurs : ${userCol || 'NON TROUVÉE'}\n`);

  if (!ticketKeyCol || !companyCol || !userCol) {
    console.error('❌ Colonnes manquantes. Structure attendue :');
    console.error('   - Colonne "Clé de ticket" ou similaire');
    console.error('   - Colonne "Entreprise" ou similaire');
    console.error('   - Colonne "Utilisateurs" ou similaire\n');
    return null;
  }

  // Analyse des données
  const analysis = {
    total: records.length,
    withOBCS: 0,
    withOD: 0,
    withoutOD: 0,
    companies: new Map(),
    users: new Map(),
    ticketsByCompany: new Map(),
    ticketsByUser: new Map(),
    ticketsByCompanyAndUser: new Map()
  };

  for (const record of records) {
    const obcsKey = (record[ticketKeyCol] || '').trim();
    const company = (record[companyCol] || '').trim();
    const user = (record[userCol] || '').trim();

    if (!obcsKey || !obcsKey.startsWith('OBCS-')) {
      continue;
    }

    analysis.withOBCS++;

    // Vérifier la correspondance OD
    const odKey = correspondenceMap.get(obcsKey);
    if (odKey) {
      analysis.withOD++;
    } else {
      analysis.withoutOD++;
    }

    // Compter par entreprise
    if (company) {
      analysis.companies.set(company, (analysis.companies.get(company) || 0) + 1);
      
      if (!analysis.ticketsByCompany.has(company)) {
        analysis.ticketsByCompany.set(company, []);
      }
      analysis.ticketsByCompany.get(company).push({
        obcs: obcsKey,
        od: odKey || null,
        user: user || 'Non renseigné',
        company
      });
    }

    // Compter par utilisateur
    const userKey = user || 'Non renseigné';
    analysis.users.set(userKey, (analysis.users.get(userKey) || 0) + 1);

    if (!analysis.ticketsByUser.has(userKey)) {
      analysis.ticketsByUser.set(userKey, []);
    }
    analysis.ticketsByUser.get(userKey).push({
      obcs: obcsKey,
      od: odKey || null,
      company: company || 'Non renseigné',
      user: userKey
    });

    // Compter par entreprise + utilisateur
    const companyUserKey = `${company || 'Non renseigné'} | ${userKey}`;
    if (!analysis.ticketsByCompanyAndUser.has(companyUserKey)) {
      analysis.ticketsByCompanyAndUser.set(companyUserKey, []);
    }
    analysis.ticketsByCompanyAndUser.get(companyUserKey).push({
      obcs: obcsKey,
      od: odKey || null,
      company: company || 'Non renseigné',
      user: userKey
    });
  }

  return { analysis, columns: { ticketKeyCol, companyCol, userCol } };
}

/**
 * Affiche les statistiques
 */
function displayStatistics(analysis, columns) {
  if (!analysis) return;

  console.log('📊 STATISTIQUES GLOBALES\n');
  console.log(`   Total de lignes analysées : ${analysis.total}`);
  console.log(`   Tickets avec clé OBCS valide : ${analysis.withOBCS}`);
  console.log(`   Tickets avec correspondance OD trouvée : ${analysis.withOD}`);
  console.log(`   Tickets sans correspondance OD : ${analysis.withoutOD}\n`);

  console.log('🏢 RÉPARTITION PAR ENTREPRISE\n');
  const sortedCompanies = Array.from(analysis.companies.entries())
    .sort((a, b) => b[1] - a[1]);
  
  sortedCompanies.slice(0, 20).forEach(([company, count]) => {
    console.log(`   ${company.padEnd(40)} : ${count} ticket(s)`);
  });
  
  if (sortedCompanies.length > 20) {
    console.log(`   ... et ${sortedCompanies.length - 20} autre(s) entreprise(s)`);
  }
  console.log(`   Total : ${sortedCompanies.length} entreprises\n`);

  console.log('👥 RÉPARTITION PAR UTILISATEUR\n');
  const sortedUsers = Array.from(analysis.users.entries())
    .sort((a, b) => b[1] - a[1]);
  
  sortedUsers.slice(0, 20).forEach(([user, count]) => {
    console.log(`   ${user.padEnd(40)} : ${count} ticket(s)`);
  });
  
  if (sortedUsers.length > 20) {
    console.log(`   ... et ${sortedUsers.length - 20} autre(s) utilisateur(s)`);
  }
  console.log(`   Total : ${sortedUsers.length} utilisateurs\n`);

  // Top 20 combinaisons entreprise + utilisateur
  console.log('🔗 TOP 20 : ENTREPRISE + UTILISATEUR\n');
  const sortedCombinations = Array.from(analysis.ticketsByCompanyAndUser.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedCombinations.slice(0, 20).forEach(([combo, tickets]) => {
    const [company, user] = combo.split(' | ');
    const withOD = tickets.filter(t => t.od).length;
    console.log(`   ${company.padEnd(30)} | ${user.padEnd(30)} : ${tickets.length} ticket(s) (${withOD} avec OD)`);
  });

  if (sortedCombinations.length > 20) {
    console.log(`   ... et ${sortedCombinations.length - 20} autre(s) combinaison(s)`);
  }
  console.log(`   Total : ${sortedCombinations.length} combinaisons uniques\n`);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 ANALYSE DU FICHIER DE MISE À JOUR DES TICKETS\n');
  console.log('=' .repeat(60));
  console.log('');

  // Charger la correspondance OBCS → OD
  const correspondenceMap = loadCorrespondenceMap();

  // Analyser le fichier
  const records = analyzeTicketsFile();
  if (!records) {
    process.exit(1);
  }

  // Analyser la structure
  const result = analyzeDataStructure(records, correspondenceMap);
  if (!result) {
    process.exit(1);
  }

  // Afficher les statistiques
  displayStatistics(result.analysis, result.columns);

  console.log('=' .repeat(60));
  console.log('\n✅ Analyse terminée\n');
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

