#!/usr/bin/env node

/**
 * Script pour trouver les correspondances OD pour les clés OBCS sans correspondance
 * en interrogeant directement Jira (projet OD)
 * 
 * Processus:
 * 1. Lit la liste des 62 clés OBCS sans correspondance
 * 2. Récupère tous les tickets OD depuis Jira (ou cherche par JQL)
 * 3. Pour chaque ticket OD, extrait le champ "Lien de ticket sortant (Duplicate)"
 * 4. Crée un mapping OBCS → OD
 * 5. Met à jour created_by dans Supabase pour les tickets correspondants
 * 
 * Usage:
 *   node scripts/find-od-correspondences-from-jira.mjs [--dry-run]
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  '';

// Configuration JIRA
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

if (!jiraUrl || !jiraUsername || !jiraToken) {
  console.error('❌ Variables JIRA manquantes');
  process.exit(1);
}

const JIRA_URL = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_EMAIL = jiraUsername.replace(/^["']|["']$/g, '').trim();
const JIRA_API_TOKEN = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

const DRY_RUN = process.argv.includes('--dry-run');

// Chemins des fichiers
const OBCS_SANS_CORRESPONDANCE_PATH = path.resolve(__dirname, '../liste-obcs-tous-sans-correspondance.txt');
const RAPPORT_PATH = path.resolve(__dirname, '../docs/ticket/rapport-tickets-sans-correspondance.md');

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔍 RECHERCHE DES CORRESPONDANCES OD DEPUIS JIRA');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

if (DRY_RUN) {
  console.log('⚠️  MODE DRY-RUN : Aucune modification ne sera effectuée\n');
}

/**
 * Charge la liste des clés OBCS sans correspondance
 */
function loadOBCSWithoutCorrespondence() {
  if (!existsSync(OBCS_SANS_CORRESPONDANCE_PATH)) {
    throw new Error(`Fichier introuvable: ${OBCS_SANS_CORRESPONDANCE_PATH}`);
  }
  
  const content = readFileSync(OBCS_SANS_CORRESPONDANCE_PATH, 'utf-8');
  const obcsKeys = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && (line.startsWith('OBCS-') || line.startsWith('OBBCS-') || line.startsWith('OBCSS-')))
    .map(key => key.toUpperCase());
  
  return new Set(obcsKeys);
}

/**
 * Parse le rapport pour obtenir l'agent associé à chaque OBCS
 */
function parseRapportForAgents() {
  if (!existsSync(RAPPORT_PATH)) {
    return new Map();
  }
  
  const content = readFileSync(RAPPORT_PATH, 'utf-8');
  const lines = content.split('\n');
  const agentMap = new Map(); // OBCS key → agent name
  
  let currentAgent = null;
  
  for (const line of lines) {
    // Détecter une section d'agent (## Agent Name)
    const agentMatch = line.match(/^##\s+(.+)$/);
    if (agentMatch) {
      currentAgent = agentMatch[1].trim();
      continue;
    }
    
    // Détecter une ligne de ticket (OBCS-XXXX - Title)
    if (currentAgent && line.trim() && !line.startsWith('#')) {
      const ticketMatch = line.match(/^(OBCS-?\d+|OBBCS-?\d+|OBCSS-?\d+)\s*-/i);
      if (ticketMatch) {
        const obcsKey = ticketMatch[1].toUpperCase();
        agentMap.set(obcsKey, currentAgent);
      }
    }
  }
  
  return agentMap;
}

/**
 * Récupère un ticket depuis Jira avec tous ses champs
 */
async function getTicketFromJira(ticketKey) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=*all&expand=names`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      if (response.status === 429) {
        console.log(`   ⏳ Rate limit atteint pour ${ticketKey}, attente de 10 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        const retryResponse = await fetch(
          `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=*all&expand=names`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );
        if (!retryResponse.ok) {
          return null;
        }
        return await retryResponse.json();
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`   ❌ Erreur pour ${ticketKey}:`, error.message);
    return null;
  }
}

/**
 * Recherche les tickets OD depuis Supabase et vérifie leurs Issue Links vers les clés OBCS
 * C'est plus efficace que de parcourir tous les tickets OD dans Jira
 */
async function findODTicketsByOBCSInJira(obcsKeys) {
  console.log('📥 Récupération des tickets OD depuis Supabase...\n');
  
  // Récupérer tous les tickets OD depuis Supabase
  const { data: odTickets, error: supabaseError } = await supabase
    .from('tickets')
    .select('id, jira_issue_key')
    .like('jira_issue_key', 'OD-%')
    .order('jira_issue_key', { ascending: true });
  
  if (supabaseError) {
    throw new Error(`Erreur Supabase: ${supabaseError.message}`);
  }
  
  console.log(`✅ ${odTickets.length} tickets OD trouvés dans Supabase\n`);
  console.log('🔍 Vérification des Issue Links "Duplicate" pour chaque ticket OD...\n');
  console.log('⚠️  Cette étape peut prendre du temps car elle nécessite de vérifier chaque ticket dans Jira...\n');
  
  const correspondences = new Map(); // obcsKey → { odKey, jiraTicket }
  const obcsKeysSet = new Set(obcsKeys);
  let processed = 0;
  
  for (const odTicket of odTickets) {
    const odKey = odTicket.jira_issue_key;
    processed++;
    
    try {
      // Récupérer le ticket depuis Jira pour vérifier ses Issue Links
      const jiraTicket = await getTicketFromJira(odKey);
      
      if (!jiraTicket) {
        if (processed % 100 === 0) {
          console.log(`   📊 ${processed}/${odTickets.length} tickets vérifiés... (${correspondences.size} correspondances trouvées)`);
        }
        continue;
      }
      
      const issueLinks = jiraTicket.fields?.issuelinks || [];
      
      // Vérifier si ce ticket OD a un lien "Duplicate" vers une de nos clés OBCS
      for (const link of issueLinks) {
        if (link.type?.name === 'Duplicate' && link.outwardIssue?.key) {
          const obcsKey = link.outwardIssue.key.toUpperCase();
          if (obcsKeysSet.has(obcsKey)) {
            // Trouvé ! Ce ticket OD correspond à un OBCS sans correspondance
            correspondences.set(obcsKey, {
              odKey: odKey,
              obcsKey: obcsKey,
              jiraTicket: jiraTicket
            });
            console.log(`   ✅ Trouvé: ${odKey} → ${obcsKey}`);
          }
        }
      }
      
      if (processed % 50 === 0) {
        console.log(`   📊 ${processed}/${odTickets.length} tickets vérifiés... (${correspondences.size} correspondances trouvées)`);
      }
      
      // Pause pour éviter le rate limiting
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      console.error(`   ❌ Erreur pour ${odKey}:`, error.message);
    }
  }
  
  console.log(`\n✅ Recherche terminée: ${correspondences.size} correspondances trouvées sur ${obcsKeys.size} recherchées\n`);
  return correspondences;
}

/**
 * Extrait les clés OBCS d'un ticket OD depuis le champ "Lien de ticket sortant (Duplicate)"
 */
function extractOBCSFromODTicket(jiraTicket) {
  const fields = jiraTicket.fields || {};
  const obcsKeys = [];
  
  // Méthode 1: Chercher dans les Issue Links (outwardIssue de type Duplicate)
  const issueLinks = fields.issuelinks || [];
  for (const link of issueLinks) {
    if (link.type?.name === 'Duplicate' && link.outwardIssue?.key) {
      const key = link.outwardIssue.key.toUpperCase();
      if (key.startsWith('OBCS-') || key.startsWith('OBBCS-') || key.startsWith('OBCSS-')) {
        obcsKeys.push(key);
      }
    }
  }
  
  // Méthode 2: Chercher dans tous les champs personnalisés (pour trouver le champ "Lien de ticket sortant (Duplicate)")
  // On cherche dans tous les champs qui pourraient contenir une clé OBCS
  for (const [fieldKey, fieldValue] of Object.entries(fields)) {
    if (!fieldValue) continue;
    
    // Si c'est une chaîne qui contient OBCS-
    if (typeof fieldValue === 'string') {
      const obcsMatch = fieldValue.match(/(?:OBCS|OBBCS|OBCSS)-?\d+/gi);
      if (obcsMatch) {
        obcsMatch.forEach(key => {
          const normalizedKey = key.toUpperCase();
          if (!obcsKeys.includes(normalizedKey)) {
            obcsKeys.push(normalizedKey);
          }
        });
      }
    }
    
    // Si c'est un objet, chercher récursivement
    if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
      const objStr = JSON.stringify(fieldValue);
      const obcsMatch = objStr.match(/(?:OBCS|OBBCS|OBCSS)-?\d+/gi);
      if (obcsMatch) {
        obcsMatch.forEach(key => {
          const normalizedKey = key.toUpperCase();
          if (!obcsKeys.includes(normalizedKey)) {
            obcsKeys.push(normalizedKey);
          }
        });
      }
    }
    
    // Si c'est un tableau
    if (Array.isArray(fieldValue)) {
      fieldValue.forEach(item => {
        if (typeof item === 'string') {
          const obcsMatch = item.match(/(?:OBCS|OBBCS|OBCSS)-?\d+/gi);
          if (obcsMatch) {
            obcsMatch.forEach(key => {
              const normalizedKey = key.toUpperCase();
              if (!obcsKeys.includes(normalizedKey)) {
                obcsKeys.push(normalizedKey);
              }
            });
          }
        } else if (typeof item === 'object' && item !== null) {
          const itemStr = JSON.stringify(item);
          const obcsMatch = itemStr.match(/(?:OBCS|OBBCS|OBCSS)-?\d+/gi);
          if (obcsMatch) {
            obcsMatch.forEach(key => {
              const normalizedKey = key.toUpperCase();
              if (!obcsKeys.includes(normalizedKey)) {
                obcsKeys.push(normalizedKey);
              }
            });
          }
        }
      });
    }
  }
  
  return obcsKeys;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // 1. Charger la liste des OBCS sans correspondance
    console.log('📖 Chargement de la liste des OBCS sans correspondance...');
    const obcsWithoutCorrespondence = loadOBCSWithoutCorrespondence();
    console.log(`✅ ${obcsWithoutCorrespondence.size} clés OBCS à rechercher\n`);
    
    // 2. Charger le mapping agent → OBCS depuis le rapport
    console.log('📖 Chargement du mapping agent → OBCS depuis le rapport...');
    const agentMap = parseRapportForAgents();
    console.log(`✅ ${agentMap.size} tickets mappés à des agents\n`);
    
    // 3. Rechercher directement dans Jira les tickets OD correspondants
    const correspondencesFound = await findODTicketsByOBCSInJira(obcsWithoutCorrespondence);
    
    if (correspondencesFound.size === 0) {
      console.log('⚠️  Aucune correspondance trouvée dans Jira.\n');
      return;
    }
    
    // 4. Enrichir avec les informations d'agent
    const correspondences = new Map();
    for (const [obcsKey, data] of correspondencesFound.entries()) {
      const agent = agentMap.get(obcsKey) || 'INCONNU';
      correspondences.set(obcsKey, {
        ...data,
        agent: agent
      });
    }
    
    console.log(`\n✅ ${correspondences.size} correspondances trouvées sur ${obcsWithoutCorrespondence.size} recherchées\n`);
    
    if (correspondences.size === 0) {
      console.log('⚠️  Aucune correspondance trouvée. Les tickets OD correspondants peuvent ne pas exister dans Jira.\n');
      return;
    }
    
    // 5. Sauvegarder le mapping
    const mappingPath = path.resolve(__dirname, '../docs/ticket/od-correspondences-found.json');
    const mappingArray = Array.from(correspondences.entries()).map(([obcsKey, data]) => ({
      obcsKey,
      odKey: data.odKey,
      agent: data.agent
    }));
    writeFileSync(mappingPath, JSON.stringify(mappingArray, null, 2), 'utf-8');
    console.log(`💾 Mapping sauvegardé dans: ${mappingPath}\n`);
    
    // 6. Afficher le résumé
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ DES CORRESPONDANCES TROUVÉES');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    const byAgent = new Map();
    for (const [obcsKey, data] of correspondences.entries()) {
      if (!byAgent.has(data.agent)) {
        byAgent.set(data.agent, []);
      }
      byAgent.get(data.agent).push({ obcsKey, odKey: data.odKey });
    }
    
    for (const [agent, tickets] of byAgent.entries()) {
      console.log(`\n${agent} (${tickets.length} ticket(s)):`);
      tickets.slice(0, 10).forEach(({ obcsKey, odKey }) => {
        console.log(`   ${obcsKey} → ${odKey}`);
      });
      if (tickets.length > 10) {
        console.log(`   ... et ${tickets.length - 10} autres`);
      }
    }
    
    console.log('\n');
    console.log('📝 Pour mettre à jour created_by dans Supabase, utilisez les scripts update-*-tickets-created-by.mjs');
    console.log('   avec les nouvelles correspondances OD trouvées.\n');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

