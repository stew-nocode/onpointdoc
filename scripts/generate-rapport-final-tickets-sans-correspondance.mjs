#!/usr/bin/env node

/**
 * Script pour générer un rapport des tickets sans correspondance OD
 * organisé par agent avec clé ticket et titre
 * 
 * Utilise directement les clés OBCS de la liste consolidée et les répartit par agent
 * en utilisant le Google Sheet complet pour trouver les titres
 * 
 * Usage:
 *   node scripts/generate-rapport-final-tickets-sans-correspondance.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL du Google Sheet - Utiliser le Google Sheet complet (sans filtre)
const GOOGLE_SHEETS_ID = '1M3FraNFTqqanqEjaVA0r957KfNUuNARU6mZBERGpnq8';
const GID = '701656857';
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=${GID}`;

// Profils des agents
const AGENTS = {
  'EDWIGE KOUASSI': {
    profileId: 'ff6b3d35-c635-4258-a253-db3fac202302',
    variants: ['edwige', 'kouassi', 'edwige kouassi', 'ekouassi'],
    obcsFile: path.resolve(__dirname, '../liste-obcs-edwige.txt')
  },
  'EVA BASSE': {
    profileId: '62494f26-691b-4332-b831-07741d927779',
    variants: ['eva', 'basse', 'eva basse', 'ebasse'],
    obcsFile: path.resolve(__dirname, '../liste-obcs-eva.txt')
  },
  'GNAHORE AMOS': {
    profileId: null, // Sera trouvé automatiquement
    variants: ['gnahore', 'amos', 'gnahore amos', 'amos gnahore'],
    obcsFile: path.resolve(__dirname, '../liste-obcs-gnahore.txt')
  },
  'JOEL SIE': {
    profileId: null, // Sera trouvé automatiquement
    variants: ['joel', 'sie', 'joel sie', 'joël sie', 'joël'],
    obcsFile: path.resolve(__dirname, '../liste-obcs-joel.txt')
  },
  "N'GBRA MOYE BERNICE DORIS": {
    profileId: null, // Sera trouvé automatiquement
    variants: ["n'gbra", "ngbra", "moye", "bernice", "doris", "n'gbra moye", "bernice doris", "moye bernice"],
    obcsFile: path.resolve(__dirname, '../liste-obcs-bernice.txt')
  },
  'Vivien DAKPOGAN': {
    profileId: null, // Sera trouvé automatiquement
    variants: ['vivien', 'dakpogan', 'vivien dakpogan'],
    obcsFile: path.resolve(__dirname, '../liste-obcs-vivien.txt')
  }
};

/**
 * Télécharge le CSV depuis Google Sheets
 */
async function downloadGoogleSheetCSV() {
  console.log('📥 Téléchargement du fichier CSV depuis Google Sheets...');
  
  try {
    const response = await fetch(CSV_EXPORT_URL);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Le fichier CSV téléchargé est vide');
    }
    
    console.log(`✅ CSV téléchargé (${csvText.length} caractères)\n`);
    return csvText;
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error.message);
    throw error;
  }
}

/**
 * Charge les clés OBCS sans correspondance depuis le fichier consolidé
 */
function loadOBSCSWithoutCorrespondance() {
  const filePath = path.resolve(__dirname, '../liste-obcs-tous-sans-correspondance.txt');
  
  if (!existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`);
  }
  
  const content = readFileSync(filePath, 'utf-8');
  const obcsKeys = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && (line.startsWith('OBCS-') || line.startsWith('OBBCS-') || line.startsWith('OBCSS-')))
    .map(line => line.toUpperCase()); // Normaliser en majuscules
  
  return new Set(obcsKeys);
}

/**
 * Charge les clés OBCS d'un agent depuis son fichier
 */
function loadAgentOBSCS(agentName) {
  const agentInfo = AGENTS[agentName];
  if (!agentInfo || !existsSync(agentInfo.obcsFile)) {
    return [];
  }
  
  const content = readFileSync(agentInfo.obcsFile, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim().toUpperCase())
    .filter(line => line && (line.startsWith('OBCS-') || line.startsWith('OBBCS-') || line.startsWith('OBCSS-')));
}

/**
 * Parse le CSV et crée une map de tous les tickets par clé OBCS
 */
function createTicketsMap(csvText) {
  console.log('📋 Parsing du CSV et création de la map des tickets...\n');
  
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true
  });
  
  if (records.length === 0) {
    throw new Error('Aucune donnée trouvée dans le CSV');
  }
  
  const firstRecord = records[0];
  console.log('📊 Colonnes disponibles:', Object.keys(firstRecord).slice(0, 10).join(', '), '...');
  console.log('');
  
  // Chercher les colonnes pertinentes
  const obcsKeyColumn = Object.keys(firstRecord).find(col => 
    col.toLowerCase().includes('clé de ticket') ||
    col.toLowerCase().includes('ticket key') ||
    (col.toLowerCase().includes('clé') && col.toLowerCase().includes('ticket'))
  );
  
  const titleColumn = Object.keys(firstRecord).find(col => 
    col.toLowerCase().includes('résumé') ||
    col.toLowerCase().includes('titre') ||
    col.toLowerCase().includes('title') ||
    col.toLowerCase().includes('summary')
  );
  
  const creatorColumn = Object.keys(firstRecord).find(col => 
    col.toLowerCase().includes('créé par') ||
    col.toLowerCase().includes('createur') ||
    col.toLowerCase().includes('rapporteur') ||
    col.toLowerCase().includes('reporter') ||
    (col.toLowerCase().includes('nom') && col.toLowerCase().includes('rapporteur'))
  );
  
  if (!obcsKeyColumn) {
    throw new Error(`Colonne clé OBCS non trouvée. Colonnes disponibles: ${Object.keys(firstRecord).join(', ')}`);
  }
  
  if (!titleColumn) {
    throw new Error(`Colonne titre non trouvée. Colonnes disponibles: ${Object.keys(firstRecord).join(', ')}`);
  }
  
  console.log(`✅ Colonne clé OBCS: "${obcsKeyColumn}"`);
  console.log(`✅ Colonne titre: "${titleColumn}"`);
  if (creatorColumn) {
    console.log(`✅ Colonne créateur: "${creatorColumn}"`);
  }
  console.log('');
  
  // Créer une map de tous les tickets par clé OBCS
  const ticketsMap = new Map();
  
  for (const record of records) {
    const obcsKey = record[obcsKeyColumn]?.trim() || '';
    const title = record[titleColumn]?.trim() || '';
    const creator = record[creatorColumn]?.trim() || '';
    
    if (!obcsKey) continue;
    
    const normalizedObcsKey = obcsKey.toUpperCase();
    
    // Stocker le ticket (garder le premier trouvé si doublon)
    if (!ticketsMap.has(normalizedObcsKey)) {
      ticketsMap.set(normalizedObcsKey, {
        obcsKey: normalizedObcsKey,
        title: title || 'Sans titre',
        creator: creator || ''
      });
    }
  }
  
  console.log(`✅ ${ticketsMap.size} tickets uniques trouvés dans le Google Sheet\n`);
  
  return ticketsMap;
}

/**
 * Répartit les tickets sans correspondance par agent
 * PRIORITÉ: Identifier par créateur dans le Google Sheet, puis par liste de fichiers
 */
function distributeTicketsByAgent(obcsWithoutCorrespondance, ticketsMap) {
  console.log('📋 Répartition des tickets par agent...\n');
  
  const ticketsByAgent = {};
  for (const agentName in AGENTS) {
    ticketsByAgent[agentName] = [];
  }
  
  // Charger les listes complètes de chaque agent (pour référence)
  const obcsByAgent = {};
  for (const agentName in AGENTS) {
    obcsByAgent[agentName] = loadAgentOBSCS(agentName);
    console.log(`   ${agentName}: ${obcsByAgent[agentName].length} tickets dans liste fichier`);
  }
  
  console.log('');
  
  // Créer un Set pour chaque agent avec leurs clés OBCS (pour référence secondaire)
  const obcsSetByAgent = {};
  for (const agentName in obcsByAgent) {
    obcsSetByAgent[agentName] = new Set(obcsByAgent[agentName]);
  }
  
  // STRATÉGIE: Prioriser les fichiers de liste comme source de vérité
  // Puis identifier par créateur dans Google Sheet
  // Les tickets restants vont dans la section de l'agent principal du filtre (EVA BASSE)
  
  // ÉTAPE 1: Identifier tous les agents par leur liste de fichiers (PRIORITÉ ABSOLUE)
  for (const obcsKey of obcsWithoutCorrespondance) {
    for (const [agentName, obcsSet] of Object.entries(obcsSetByAgent)) {
      if (obcsSet.has(obcsKey)) {
        // Ticket trouvé dans la liste fichier de cet agent
        const ticketFromSheet = ticketsMap.get(obcsKey);
        ticketsByAgent[agentName].push({
          obcsKey: obcsKey,
          title: ticketFromSheet ? ticketFromSheet.title : 'Ticket non trouvé dans le Google Sheet filtré'
        });
        break; // Ticket assigné, passer au suivant
      }
    }
  }
  
  // ÉTAPE 2: Pour les tickets non assignés, identifier par créateur dans Google Sheet
  for (const obcsKey of obcsWithoutCorrespondance) {
    // Vérifier si déjà assigné par liste fichier
    let alreadyAssigned = false;
    for (const agentName in ticketsByAgent) {
      if (ticketsByAgent[agentName].some(t => t.obcsKey === obcsKey)) {
        alreadyAssigned = true;
        break;
      }
    }
    
    if (!alreadyAssigned) {
      const ticketFromSheet = ticketsMap.get(obcsKey);
      
      if (ticketFromSheet && ticketFromSheet.creator) {
        const creatorLower = ticketFromSheet.creator.toLowerCase();
        
        // Chercher quel agent correspond au créateur
        for (const [agentName, agentInfo] of Object.entries(AGENTS)) {
          const isAgent = agentInfo.variants.some(variant => creatorLower.includes(variant));
          
          if (isAgent) {
            ticketsByAgent[agentName].push({
              obcsKey: obcsKey,
              title: ticketFromSheet.title
            });
            alreadyAssigned = true;
            break;
          }
        }
      }
      
      // ÉTAPE 3: Si toujours non assigné, attribuer à EVA BASSE (filtre principal du Google Sheet)
      if (!alreadyAssigned) {
        const ticketFromSheet = ticketsMap.get(obcsKey);
        ticketsByAgent['EVA BASSE'].push({
          obcsKey: obcsKey,
          title: ticketFromSheet ? ticketFromSheet.title : 'Ticket non trouvé dans le Google Sheet filtré'
        });
      }
    }
  }
  
  console.log('');
  
  // Trier par clé OBCS pour chaque agent
  for (const agentName in ticketsByAgent) {
    ticketsByAgent[agentName].sort((a, b) => {
      const numA = parseInt(a.obcsKey.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.obcsKey.replace(/[^0-9]/g, '')) || 0;
      return numB - numA; // Décroissant (plus récent en premier)
    });
  }
  
  return ticketsByAgent;
}

/**
 * Génère le rapport avec la structure demandée
 * Format: Nom agent, puis chaque ligne avec "clé ticket - titre"
 */
function generateRapport(ticketsByAgent) {
  let rapport = '# Rapport des tickets sans correspondance OD\n\n';
  rapport += '**Date de génération** : ' + new Date().toLocaleDateString('fr-FR') + '\n\n';
  rapport += 'Ces tickets n\'ont pas encore de clé OD correspondante dans le fichier `correspondance - Jira (3).csv`.\n\n';
  rapport += '---\n\n';
  
  let totalTickets = 0;
  
  // Afficher d'abord les agents définis, puis les autres
  const agentOrder = Object.keys(AGENTS).concat(['AUTRES']);
  
  for (const agentName of agentOrder) {
    const tickets = ticketsByAgent[agentName] || [];
    
    if (tickets.length === 0) {
      continue;
    }
    
    totalTickets += tickets.length;
    
    // Structure demandée: Nom agent puis chaque ligne avec "clé ticket - titre"
    rapport += `## ${agentName}\n\n`;
    
    for (const ticket of tickets) {
      // Nettoyer le titre (supprimer retours à la ligne, espaces multiples)
      const cleanTitle = ticket.title
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      rapport += `${ticket.obcsKey} - ${cleanTitle}\n`;
    }
    
    rapport += '\n---\n\n';
  }
  
  rapport += `## 📊 Résumé\n\n`;
  rapport += `- **Total de tickets** : ${totalTickets}\n`;
  rapport += `- **Agents concernés** : ${Object.values(ticketsByAgent).filter(t => t && t.length > 0).length}\n\n`;
  
  return rapport;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('📝 GÉNÉRATION DU RAPPORT FINAL DES TICKETS SANS CORRESPONDANCE\n');
  console.log(`📎 Google Sheet: ${CSV_EXPORT_URL}\n`);
  
  try {
    // 1. Charger les clés OBCS sans correspondance
    console.log('📋 Chargement des clés OBCS sans correspondance...');
    const obcsWithoutCorrespondance = loadOBSCSWithoutCorrespondance();
    console.log(`✅ ${obcsWithoutCorrespondance.size} clés OBCS sans correspondance chargées\n`);
    
    // 2. Télécharger le CSV
    const csvText = await downloadGoogleSheetCSV();
    
    // 3. Créer la map des tickets depuis le Google Sheet
    const ticketsMap = createTicketsMap(csvText);
    
    // 4. Répartir les tickets par agent
    const ticketsByAgent = distributeTicketsByAgent(obcsWithoutCorrespondance, ticketsMap);
    
    // 5. Afficher un résumé
    console.log('📊 RÉSULTATS PAR AGENT:\n');
    for (const [agentName, tickets] of Object.entries(ticketsByAgent)) {
      if (tickets && tickets.length > 0) {
        console.log(`   ${agentName}: ${tickets.length} ticket(s)`);
      }
    }
    console.log('');
    
    // 6. Générer le rapport
    console.log('📝 Génération du rapport markdown...');
    const rapport = generateRapport(ticketsByAgent);
    
    // 7. Sauvegarder le rapport
    const rapportPath = path.resolve(__dirname, '../docs/ticket/rapport-tickets-sans-correspondance.md');
    writeFileSync(rapportPath, rapport, 'utf-8');
    
    console.log(`✅ Rapport sauvegardé dans: ${rapportPath}`);
    console.log('');
    
    // 8. Afficher un aperçu
    const totalTickets = Object.values(ticketsByAgent).reduce((sum, tickets) => sum + (tickets?.length || 0), 0);
    console.log('📊 RÉSUMÉ:');
    console.log(`   • Total de tickets: ${totalTickets}`);
    console.log(`   • Agents concernés: ${Object.values(ticketsByAgent).filter(t => t && t.length > 0).length}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

