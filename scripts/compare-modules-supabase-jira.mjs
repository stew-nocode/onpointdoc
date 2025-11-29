#!/usr/bin/env node

/**
 * Script pour comparer les modules des 50 tickets les plus récents
 * entre Supabase et Jira (Google Sheet)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (error) {
  console.error('⚠️  Impossible de charger .env.local:', error.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_SHEET_ID = '1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs';
const GID = '939690095';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

async function getRecentTicketsFromSupabase(limit = 50) {
  console.log(`📦 Récupération des ${limit} tickets les plus récents depuis Supabase...\n`);
  
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      id,
      jira_issue_key,
      module_id,
      created_at,
      modules (
        id,
        name
      )
    `)
    .not('jira_issue_key', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw error;
  }
  
  console.log(`✅ ${tickets.length} tickets récupérés depuis Supabase\n`);
  
  return tickets.map(t => ({
    id: t.id,
    jiraKey: t.jira_issue_key,
    moduleId: t.module_id,
    moduleName: t.modules?.name || null,
    createdAt: t.created_at,
  }));
}

async function getModuleMappingsFromSheet() {
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  const csvContent = await response.text();
  
  // Parser en mode brut
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
  });
  
  if (rawRecords.length === 0) {
    throw new Error('Aucune donnée dans le CSV');
  }
  
  // Trouver les indices des colonnes
  const headers = rawRecords[0];
  const odIndex = headers.indexOf('OD');
  const moduleIndex = headers.indexOf('Champs personnalisés (Module)');
  
  if (odIndex === -1 || moduleIndex === -1) {
    throw new Error('Colonnes OD ou Module introuvables');
  }
  
  // Créer un mapping OD → Module
  const mapping = new Map();
  
  for (let i = 1; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    if (!row || row.length <= Math.max(odIndex, moduleIndex)) {
      continue;
    }
    
    const odKey = row[odIndex]?.trim();
    const moduleName = row[moduleIndex]?.trim();
    
    if (odKey && moduleName && moduleName.length > 0) {
      const normalizedOD = odKey.toUpperCase().startsWith('OD-')
        ? odKey.toUpperCase()
        : `OD-${odKey.toUpperCase().replace(/^OD-?/, '')}`;
      
      // Garder le premier trouvé (éviter les doublons)
      if (!mapping.has(normalizedOD)) {
        mapping.set(normalizedOD, moduleName);
      }
    }
  }
  
  console.log(`✅ ${mapping.size} correspondances OD → Module extraites du Google Sheet\n`);
  
  return mapping;
}

async function compareModules() {
  console.log('🔍 COMPARAISON DES MODULES SUPABASE ↔ JIRA\n');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 1. Récupérer les tickets récents depuis Supabase
    const supabaseTickets = await getRecentTicketsFromSupabase(50);
    
    // 2. Récupérer les mappings depuis le Google Sheet (Jira)
    const jiraMappings = await getModuleMappingsFromSheet();
    
    // 3. Comparer
    console.log('📊 COMPARAISON:\n');
    
    const stats = {
      total: supabaseTickets.length,
      match: 0,
      different: 0,
      missingInJira: 0,
      missingInSupabase: 0,
      noModuleInSupabase: 0,
      noModuleInJira: 0,
    };
    
    const differences = [];
    const missingInJira = [];
    const noModuleInSupabase = [];
    const noModuleInJira = [];
    const ticketsWithoutModule = [];
    
    for (const ticket of supabaseTickets) {
      const jiraModule = jiraMappings.get(ticket.jiraKey);
      
      // Cas 1: Pas de module dans Supabase
      if (!ticket.moduleName) {
        if (jiraModule) {
          noModuleInSupabase.push({
            ticket: ticket.jiraKey,
            supabase: null,
            jira: jiraModule,
          });
          stats.noModuleInSupabase++;
        } else {
          ticketsWithoutModule.push({
            ticket: ticket.jiraKey,
            supabase: null,
            jira: null,
          });
          stats.noModuleInJira++;
        }
        continue;
      }
      
      // Cas 2: Pas de module dans Jira
      if (!jiraModule) {
        missingInJira.push({
          ticket: ticket.jiraKey,
          supabase: ticket.moduleName,
          jira: null,
        });
        stats.missingInJira++;
        continue;
      }
      
      // Cas 3: Comparer les modules
      if (ticket.moduleName === jiraModule) {
        stats.match++;
      } else {
        differences.push({
          ticket: ticket.jiraKey,
          supabase: ticket.moduleName,
          jira: jiraModule,
        });
        stats.different++;
      }
    }
    
    // Afficher les résultats
    console.log('='.repeat(60));
    console.log('📊 RÉSULTATS DE LA COMPARAISON');
    console.log('='.repeat(60));
    console.log(`Total de tickets analysés: ${stats.total}`);
    console.log(`✅ Modules identiques: ${stats.match}`);
    console.log(`⚠️  Modules différents: ${stats.different}`);
    console.log(`❌ Pas de module dans Supabase (mais présent dans Jira): ${stats.noModuleInSupabase}`);
    console.log(`❌ Pas de module dans Jira: ${stats.missingInJira}`);
    console.log(`❌ Pas de module ni dans Supabase ni dans Jira: ${stats.noModuleInJira}`);
    
    // Afficher les différences
    if (differences.length > 0) {
      console.log(`\n⚠️  MODULES DIFFÉRENTS (${differences.length}):\n`);
      differences.slice(0, 20).forEach(diff => {
        console.log(`   ${diff.ticket}:`);
        console.log(`      Supabase: "${diff.supabase}"`);
        console.log(`      Jira:     "${diff.jira}"`);
        console.log('');
      });
      if (differences.length > 20) {
        console.log(`   ... et ${differences.length - 20} autres différences\n`);
      }
    }
    
    // Afficher les tickets sans module dans Supabase
    if (noModuleInSupabase.length > 0) {
      console.log(`\n❌ PAS DE MODULE DANS SUPABASE (${noModuleInSupabase.length}):\n`);
      noModuleInSupabase.slice(0, 10).forEach(item => {
        console.log(`   ${item.ticket} → Module dans Jira: "${item.jira}"`);
      });
      if (noModuleInSupabase.length > 10) {
        console.log(`   ... et ${noModuleInSupabase.length - 10} autres\n`);
      }
    }
    
    // Afficher les tickets absents du Google Sheet
    if (missingInJira.length > 0) {
      console.log(`\n⚠️  ABSENTS DU GOOGLE SHEET (${missingInJira.length}):\n`);
      missingInJira.slice(0, 10).forEach(item => {
        console.log(`   ${item.ticket} → Module dans Supabase: "${item.supabase}"`);
      });
      if (missingInJira.length > 10) {
        console.log(`   ... et ${missingInJira.length - 10} autres\n`);
      }
    }
    
    // Afficher les tickets sans module
    if (ticketsWithoutModule.length > 0) {
      console.log(`\n⚠️  SANS MODULE (${ticketsWithoutModule.length}):\n`);
      ticketsWithoutModule.forEach(item => {
        console.log(`   ${item.ticket}`);
      });
      console.log('');
    }
    
    // Résumé
    const matchPercentage = ((stats.match / stats.total) * 100).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log('📈 TAUX DE CONCORDANCE');
    console.log('='.repeat(60));
    console.log(`✅ ${matchPercentage}% des tickets ont des modules identiques`);
    
    if (stats.different > 0 || stats.noModuleInSupabase > 0) {
      console.log(`\n⚠️  Attention: ${stats.different + stats.noModuleInSupabase} tickets nécessitent une mise à jour`);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

compareModules();

