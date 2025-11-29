#!/usr/bin/env node

/**
 * Script pour extraire les correspondances OBCS depuis JIRA
 * 
 * Recherche tous les tickets OD dans JIRA et extrait le champ
 * "Lien de ticket sortant (Duplicate)" qui contient la clé OBCS correspondante
 * 
 * Usage:
 *   node scripts/extract-obcs-correspondances-from-jira.mjs
 * 
 * Note: Ce script utilise l'API JIRA via fetch car le MCP JIRA
 * peut avoir des limitations. Vous devrez configurer les credentials JIRA.
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

// Configuration JIRA (doit être dans .env.local ou .env)
// Utilise les mêmes noms de variables que le reste du code
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!jiraUrl || !jiraUsername || !jiraToken) {
  console.error('❌ Variables d\'environnement JIRA manquantes');
  console.error('   Requis: JIRA_URL (ou JIRA_BASE_URL), JIRA_USERNAME (ou JIRA_EMAIL), JIRA_TOKEN (ou JIRA_API_TOKEN)');
  console.error('\n📋 Variables trouvées dans .env:');
  console.error(`   JIRA_URL/JIRA_BASE_URL: ${jiraUrl ? '✅' : '❌'}`);
  console.error(`   JIRA_USERNAME/JIRA_EMAIL: ${jiraUsername ? '✅' : '❌'}`);
  console.error(`   JIRA_TOKEN/JIRA_API_TOKEN: ${jiraToken ? '✅' : '❌'}`);
  console.error('\n💡 Veuillez vérifier vos variables dans .env.local\n');
  process.exit(1);
}

// Nettoyer les valeurs (comme dans le code existant)
const JIRA_URL = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_EMAIL = jiraUsername.replace(/^["']|["']$/g, '').trim();
const JIRA_API_TOKEN = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();

console.log(`✅ Configuration JIRA trouvée: ${JIRA_URL}\n`);

/**
 * Effectue une requête à l'API JIRA
 */
async function jiraRequest(endpoint, options = {}) {
  const url = `${JIRA_URL.replace(/\/$/, '')}/rest/api/3${endpoint}`;
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`JIRA API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Recherche tous les tickets OD avec pagination
 * Utilise la nouvelle API /rest/api/3/search avec POST
 */
async function getAllODTickets() {
  console.log('📥 Recherche des tickets OD dans JIRA...\n');

  let startAt = 0;
  const maxResults = 100;
  let allTickets = [];
  let total = 0;

  do {
    try {
      // Utiliser POST avec body au lieu de GET avec query params
      const response = await jiraRequest('/search', {
        method: 'POST',
        body: JSON.stringify({
          jql: 'project = OD ORDER BY created ASC',
          startAt: startAt,
          maxResults: maxResults,
          fields: [
            'key',
            'summary',
            'issuelinks',
            'description'
          ]
        })
      });

      const tickets = response.issues || [];
      allTickets = allTickets.concat(tickets);
      total = response.total;
      startAt += maxResults;

      console.log(`   📊 ${allTickets.length}/${total} tickets récupérés...`);

      if (allTickets.length >= total) break;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération (startAt=${startAt}):`, error.message);
      
      // Essayer une approche alternative : rechercher les champs personnalisés
      console.log('\n⚠️  Tentative d\'une approche alternative...');
      return await getAllODTicketsAlternative();
    }
  } while (allTickets.length < total);

  return allTickets;
}

/**
 * Approche alternative : récupérer tous les champs personnalisés d'abord
 */
async function getAllODTicketsAlternative() {
  console.log('📥 Approche alternative : recherche avec tous les champs...\n');

  // D'abord, récupérer un ticket exemple pour voir les champs disponibles
  try {
    const exampleTicket = await jiraRequest('/search', {
      method: 'POST',
      body: JSON.stringify({
        jql: 'project = OD',
        maxResults: 1,
        fields: ['*all']
      })
    });
    
    if (exampleTicket.issues && exampleTicket.issues.length > 0) {
      const fields = exampleTicket.issues[0].fields;
      console.log('📋 Champs disponibles dans un ticket OD:');
      console.log('   Keys:', Object.keys(fields).filter(k => k.startsWith('customfield')).slice(0, 10).join(', '));
      
      // Chercher le champ qui contient "Duplicate" ou "sortant"
      const duplicateFields = Object.keys(fields).filter(k => 
        k.includes('duplicate') || 
        k.includes('sortant') ||
        k.includes('outward')
      );
      
      if (duplicateFields.length > 0) {
        console.log(`\n✅ Champs potentiels trouvés: ${duplicateFields.join(', ')}\n`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération d\'exemple:', error.message);
  }

  // Pour l'instant, retourner un tableau vide - on va récupérer les tickets un par un via get_issue
  return [];
  
  // Pour l'instant, retourner un tableau vide - cette fonction alternative n'est plus utilisée
  // Les tickets seront récupérés via getAllODTickets() qui utilise POST
  return [];
}

/**
 * Extrait les correspondances OBCS depuis un ticket OD
 */
function extractCorrespondancesFromTicket(jiraTicket) {
  const correspondances = [];
  const odKey = jiraTicket.key;
  const fields = jiraTicket.fields || {};

  // Méthode 1: Vérifier les issue links (outwardIssue) - c'est ici que sont les correspondances "Duplicate"
  const issueLinks = fields.issuelinks || [];
  for (const link of issueLinks) {
    if (link.outwardIssue && link.outwardIssue.key) {
      const outwardKey = link.outwardIssue.key;
      // Les correspondances OBCS sont dans les liens de type "Duplicate"
      if (outwardKey.startsWith('OBCS-') && link.type?.name === 'Duplicate') {
        correspondances.push({
          odKey: odKey,
          obcsKey: outwardKey,
          linkType: link.type?.name,
          source: 'issuelinks-duplicate'
        });
      }
    }
    // Vérifier aussi les inwardIssue au cas où
    if (link.inwardIssue && link.inwardIssue.key) {
      const inwardKey = link.inwardIssue.key;
      if (inwardKey.startsWith('OBCS-') && link.type?.name === 'Duplicate') {
        correspondances.push({
          odKey: odKey,
          obcsKey: inwardKey,
          linkType: link.type?.name,
          source: 'issuelinks-duplicate-inward'
        });
      }
    }
  }

  // Méthode 2: Chercher dans tous les champs personnalisés pour "OBCS-"
  for (const [fieldKey, fieldValue] of Object.entries(fields)) {
    if (fieldKey.startsWith('customfield_')) {
      const valueStr = String(fieldValue || '').trim();
      if (valueStr.match(/^OBCS-\d+$/)) {
        correspondances.push({
          odKey: odKey,
          obcsKey: valueStr,
          source: `customfield:${fieldKey}`
        });
      }
      
      // Si le champ contient un objet avec une clé
      if (fieldValue && typeof fieldValue === 'object') {
        const objStr = JSON.stringify(fieldValue);
        const obcsMatch = objStr.match(/OBCS-\d+/);
        if (obcsMatch) {
          correspondances.push({
            odKey: odKey,
            obcsKey: obcsMatch[0],
            source: `customfield:${fieldKey}`
          });
        }
      }
    }
  }

  return correspondances;
}

async function extractFromJira() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 EXTRACTION DES CORRESPONDANCES OBCS DEPUIS JIRA');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Récupérer les tickets OD depuis Supabase (plus fiable que l'API search)
    console.log('📥 Récupération des tickets OD depuis Supabase...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables Supabase manquantes');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    const { data: odTickets, error: supabaseError } = await supabase
      .from('tickets')
      .select('jira_issue_key')
      .like('jira_issue_key', 'OD-%')
      .order('jira_issue_key', { ascending: true });

    if (supabaseError) {
      console.error('❌ Erreur Supabase:', supabaseError.message);
      return;
    }

    console.log(`✅ ${odTickets.length} tickets OD trouvés dans Supabase\n`);

    if (odTickets.length === 0) {
      console.log('⚠️  Aucun ticket OD trouvé dans Supabase.');
      return;
    }

    // 2. Récupérer chaque ticket depuis JIRA pour extraire les correspondances
    console.log('📥 Récupération des tickets depuis JIRA (cela peut prendre du temps)...\n');
    const correspondances = [];
    let processed = 0;

    for (const ticket of odTickets) {
      const odKey = ticket.jira_issue_key;
      processed++;

      try {
        // Récupérer le ticket depuis JIRA avec tous les champs
        const jiraTicket = await jiraRequest(`/issue/${odKey}?fields=*all&expand=names`);
        
        // Extraire les correspondances de ce ticket
        const extracted = extractCorrespondancesFromTicket(jiraTicket);
        correspondances.push(...extracted);

        if (processed % 50 === 0) {
          console.log(`   📊 ${processed}/${odTickets.length} tickets traités... (${correspondances.length} correspondances trouvées)`);
        }
      } catch (error) {
        if (error.message.includes('404')) {
          console.warn(`⚠️  Ticket ${odKey} non trouvé dans JIRA`);
        } else {
          console.error(`❌ Erreur pour ${odKey}:`, error.message);
        }
      }
    }

    console.log(`\n✅ ${correspondances.length} correspondances trouvées\n`);

    // 3. Grouper par source pour analyse
    const bySource = {};
    for (const corr of correspondances) {
      if (!bySource[corr.source]) {
        bySource[corr.source] = [];
      }
      bySource[corr.source].push(corr);
    }

    console.log('📊 Répartition par source:');
    for (const [source, items] of Object.entries(bySource)) {
      console.log(`   ${source}: ${items.length}`);
    }
    console.log('');

    // 4. Afficher quelques exemples
    if (correspondances.length > 0) {
      console.log('════════════════════════════════════════════════════════════════════════════════');
      console.log('📋 EXEMPLES DE CORRESPONDANCES');
      console.log('════════════════════════════════════════════════════════════════════════════════\n');
      
      correspondances.slice(0, 10).forEach((corr, idx) => {
        console.log(`${idx + 1}. ${corr.obcsKey} → ${corr.odKey} (${corr.source})`);
      });
      
      if (correspondances.length > 10) {
        console.log(`\n   ... et ${correspondances.length - 10} autres correspondances`);
      }
      console.log('');
    }

    // 5. Sauvegarder dans un fichier CSV compatible avec le format existant
    console.log('💾 Préparation du fichier CSV...');
    
    // Récupérer les titres des tickets depuis Supabase pour le CSV
    const csvRows = ['Résumé,Clé de ticket,Lien de ticket sortant (Duplicate)'];
    for (const corr of correspondances) {
      const { data: ticket } = await supabase
        .from('tickets')
        .select('title')
        .eq('jira_issue_key', corr.odKey)
        .single();
      
      const summary = ticket?.title || '';
      csvRows.push(`"${summary.replace(/"/g, '""')}",${corr.odKey},${corr.obcsKey}`);
    }

    const outputPath = path.join(__dirname, '../docs/ticket/correspondances-jira-extraites.csv');
    writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
    console.log(`💾 Correspondances sauvegardées dans: ${outputPath}\n`);

    // 6. Sauvegarder aussi en JSON pour référence
    const jsonPath = path.join(__dirname, '../docs/ticket/correspondances-jira-extraites.json');
    writeFileSync(jsonPath, JSON.stringify(correspondances, null, 2), 'utf-8');
    console.log(`💾 JSON sauvegardé dans: ${jsonPath}\n`);

    console.log('✅ Extraction terminée');
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    console.error('\n💡 Vérifiez:');
    console.error('   1. Que JIRA_URL est correct (ex: https://votre-entreprise.atlassian.net)');
    console.error('   2. Que JIRA_EMAIL et JIRA_API_TOKEN sont configurés dans .env.local');
    console.error('   3. Que vous avez accès au projet OD dans JIRA');
    process.exit(1);
  }
}

// Exécuter l'extraction
extractFromJira();

