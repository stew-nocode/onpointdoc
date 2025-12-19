#!/usr/bin/env node

/**
 * Script pour générer un rapport des tickets sans correspondance OD
 * organisé par agent avec clé ticket et titre
 * 
 * Usage:
 *   node scripts/generate-rapport-tickets-sans-correspondance.mjs
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
// Télécharger le Google Sheet complet pour avoir tous les tickets et leurs titres
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
 * Charge les clés OBCS sans correspondance depuis le fichier
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
 * Parse le CSV et extrait les tickets par agent
 */
function extractTicketsByAgent(csvText, obcsWithoutCorrespondance) {
  console.log('📋 Parsing du CSV et extraction des tickets par agent...\n');
  
  // ✅ Utiliser csv-parse pour un parsing robuste
  const records = parse(csvText, {
    columns: true, // Première ligne = headers
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true
  });
  
  if (records.length === 0) {
    throw new Error('Aucune donnée trouvée dans le CSV');
  }
  
  // Afficher les colonnes disponibles pour debug
  const firstRecord = records[0];
  console.log('📊 Colonnes disponibles:', Object.keys(firstRecord).slice(0, 10).join(', '), '...');
  console.log('');
  
  // Chercher les colonnes pertinentes
  const creatorColumn = Object.keys(firstRecord).find(col => 
    col.toLowerCase().includes('créé par') ||
    col.toLowerCase().includes('createur') ||
    col.toLowerCase().includes('rapporteur') ||
    col.toLowerCase().includes('reporter') ||
    (col.toLowerCase().includes('nom') && col.toLowerCase().includes('rapporteur'))
  );
  
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
  
  if (!creatorColumn) {
    throw new Error(`Colonne créateur non trouvée. Colonnes disponibles: ${Object.keys(firstRecord).join(', ')}`);
  }
  
  if (!obcsKeyColumn) {
    throw new Error(`Colonne clé OBCS non trouvée. Colonnes disponibles: ${Object.keys(firstRecord).join(', ')}`);
  }
  
  if (!titleColumn) {
    throw new Error(`Colonne titre non trouvée. Colonnes disponibles: ${Object.keys(firstRecord).join(', ')}`);
  }
  
  console.log(`✅ Colonne créateur: "${creatorColumn}"`);
  console.log(`✅ Colonne clé OBCS: "${obcsKeyColumn}"`);
  console.log(`✅ Colonne titre: "${titleColumn}"`);
  console.log('');
  
  // Organiser les tickets par agent
  const ticketsByAgent = {};
  const ticketsMap = new Map(); // Map pour stocker tous les tickets du Google Sheet par clé OBCS
  
  for (const agentName in AGENTS) {
    ticketsByAgent[agentName] = [];
  }
  
  // Étape 1 : Créer une map de tous les tickets du Google Sheet (même non filtrés)
  // pour pouvoir chercher les titres même si le créateur ne correspond pas
  for (const record of records) {
    const obcsKey = record[obcsKeyColumn]?.trim() || '';
    const title = record[titleColumn]?.trim() || '';
    const creator = record[creatorColumn]?.trim() || '';
    
    if (!obcsKey) continue;
    
    // Normaliser la clé OBCS
    const normalizedObcsKey = obcsKey.toUpperCase();
    
    // Stocker le ticket (le dernier trouvé si doublon, avec créateur et titre)
    if (!ticketsMap.has(normalizedObcsKey) || title) {
      ticketsMap.set(normalizedObcsKey, {
        obcsKey: normalizedObcsKey,
        title: title || 'Sans titre',
        creator: creator
      });
    }
  }
  
  // Étape 2 : Charger les listes OBCS originales par agent
  const obcsByAgent = {};
  
  // Charger les clés Edwige depuis le fichier original
  try {
    if (existsSync(AGENTS['EDWIGE KOUASSI'].obcsFile)) {
      const edwigeContent = readFileSync(AGENTS['EDWIGE KOUASSI'].obcsFile, 'utf-8');
      obcsByAgent['EDWIGE KOUASSI'] = edwigeContent
        .split('\n')
        .map(k => k.trim().toUpperCase())
        .filter(k => k && (k.startsWith('OBCS-') || k.startsWith('OBBCS-') || k.startsWith('OBCSS-')));
    }
  } catch (error) {
    console.warn(`⚠️  Impossible de charger le fichier Edwige: ${error.message}`);
  }
  
  // Charger les clés EVA depuis le fichier original
  try {
    if (existsSync(AGENTS['EVA BASSE'].obcsFile)) {
      const evaContent = readFileSync(AGENTS['EVA BASSE'].obcsFile, 'utf-8');
      obcsByAgent['EVA BASSE'] = evaContent
        .split('\n')
        .map(k => k.trim().toUpperCase())
        .filter(k => k && (k.startsWith('OBCS-') || k.startsWith('OBBCS-') || k.startsWith('OBCSS-')));
    }
  } catch (error) {
    console.warn(`⚠️  Impossible de charger le fichier EVA: ${error.message}`);
  }
  
  // Étape 3 : Pour chaque agent, récupérer les clés sans correspondance
  // et chercher leur titre dans le Google Sheet
  console.log('📋 Extraction des tickets sans correspondance par agent...\n');
  
  for (const [agentName, obcsKeys] of Object.entries(obcsByAgent)) {
    console.log(`   ${agentName}: ${obcsKeys.length} tickets au total`);
    
    // Filtrer pour ne garder que ceux sans correspondance
    const obcsWithoutCorrespondanceForAgent = obcsKeys.filter(key => 
      obcsWithoutCorrespondance.has(key)
    );
    
    console.log(`   ${agentName}: ${obcsWithoutCorrespondanceForAgent.length} tickets sans correspondance`);
    
    for (const obcsKey of obcsWithoutCorrespondanceForAgent) {
      // Chercher le ticket dans la map du Google Sheet
      const ticketFromSheet = ticketsMap.get(obcsKey);
      
      if (ticketFromSheet) {
        // Ticket trouvé dans le Google Sheet
        ticketsByAgent[agentName].push({
          obcsKey: obcsKey,
          title: ticketFromSheet.title
        });
      } else {
        // Ticket non trouvé dans le Google Sheet (pas dans le filtre)
        ticketsByAgent[agentName].push({
          obcsKey: obcsKey,
          title: 'Ticket non trouvé dans le Google Sheet (vérifier le filtre)'
        });
      }
    }
  }
  
  console.log('');
  
  // Supprimer les doublons par clé OBCS pour chaque agent
  for (const agentName in ticketsByAgent) {
    const seen = new Set();
    ticketsByAgent[agentName] = ticketsByAgent[agentName].filter(ticket => {
      if (seen.has(ticket.obcsKey)) {
        return false;
      }
      seen.add(ticket.obcsKey);
      return true;
    });
    
    // Trier par clé OBCS
    ticketsByAgent[agentName].sort((a, b) => {
      // Extraire le numéro pour trier numériquement
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
  
  for (const [agentName, tickets] of Object.entries(ticketsByAgent)) {
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
  rapport += `- **Agents concernés** : ${Object.values(ticketsByAgent).filter(t => t.length > 0).length}\n\n`;
  
  return rapport;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('📝 GÉNÉRATION DU RAPPORT DES TICKETS SANS CORRESPONDANCE\n');
  console.log(`📎 Google Sheet: ${CSV_EXPORT_URL}\n`);
  
  try {
    // 1. Charger les clés OBCS sans correspondance
    console.log('📋 Chargement des clés OBCS sans correspondance...');
    const obcsWithoutCorrespondance = loadOBSCSWithoutCorrespondance();
    console.log(`✅ ${obcsWithoutCorrespondance.size} clés OBCS sans correspondance chargées\n`);
    
    // 2. Télécharger le CSV
    const csvText = await downloadGoogleSheetCSV();
    
    // 3. Extraire les tickets par agent
    const ticketsByAgent = extractTicketsByAgent(csvText, obcsWithoutCorrespondance);
    
    // 4. Afficher un résumé
    console.log('📊 RÉSULTATS PAR AGENT:\n');
    for (const [agentName, tickets] of Object.entries(ticketsByAgent)) {
      console.log(`   ${agentName}: ${tickets.length} ticket(s)`);
    }
    console.log('');
    
    // 5. Générer le rapport
    console.log('📝 Génération du rapport markdown...');
    const rapport = generateRapport(ticketsByAgent);
    
    // 6. Sauvegarder le rapport
    const rapportPath = path.resolve(__dirname, '../docs/ticket/rapport-tickets-sans-correspondance.md');
    writeFileSync(rapportPath, rapport, 'utf-8');
    
    console.log(`✅ Rapport sauvegardé dans: ${rapportPath}`);
    console.log('');
    
    // 7. Afficher un aperçu
    const totalTickets = Object.values(ticketsByAgent).reduce((sum, tickets) => sum + tickets.length, 0);
    console.log('📊 RÉSUMÉ:');
    console.log(`   • Total de tickets: ${totalTickets}`);
    console.log(`   • Agents concernés: ${Object.values(ticketsByAgent).filter(t => t.length > 0).length}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

