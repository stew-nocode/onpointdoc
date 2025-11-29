#!/usr/bin/env node

/**
 * Script pour rattacher les tickets de "Joël SIE" à l'agent "JOEL SIE"
 * 
 * Ce script :
 * 1. Lit le CSV des tickets
 * 2. Identifie les tickets avec "Joël SIE" comme rapporteur
 * 3. Met à jour ces tickets pour les rattacher à l'agent "JOEL SIE"
 * 
 * Usage:
 *   node scripts/fix-joel-sie-tickets.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local en priorité si présent
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

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

// Chemins des fichiers
const TICKETS_CSV_PATH = path.join(
  __dirname,
  '../docs/ticket/premier liste de ticket - Tous les tickets Bug et requêtes support mis à jour - Tous les tickets Bug et requêtes support mis à jour-Grid view (1).csv (1).csv'
);
const CORRESPONDANCE_CSV_PATH = path.join(
  __dirname,
  '../docs/ticket/correspondance - Jira (3).csv'
);

/**
 * Charge et parse le fichier de correspondance OBCS → OD
 */
function loadCorrespondanceMapping() {
  console.log('📖 Chargement du fichier de correspondance OBCS → OD...');
  
  try {
    const content = readFileSync(CORRESPONDANCE_CSV_PATH, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const mapping = new Map();
    for (const record of records) {
      const obcsKey = record['Lien de ticket sortant (Duplicate)']?.trim();
      const odKey = record['Clé de ticket']?.trim();
      
      if (obcsKey && odKey && obcsKey.startsWith('OBCS-')) {
        mapping.set(obcsKey, odKey);
      }
    }

    console.log(`✅ ${mapping.size} correspondances OBCS → OD chargées\n`);
    return mapping;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la correspondance:', error.message);
    return new Map();
  }
}

/**
 * Mappe une clé OBCS vers OD si nécessaire
 */
function mapJiraKey(jiraKey, correspondanceMap) {
  if (!jiraKey) return null;
  
  const trimmed = jiraKey.trim();
  
  // Si c'est déjà une clé OD, la retourner telle quelle
  if (trimmed.startsWith('OD-')) {
    return trimmed;
  }
  
  // Si c'est une clé OBCS, chercher la correspondance
  if (trimmed.startsWith('OBCS-')) {
    const odKey = correspondanceMap.get(trimmed);
    if (odKey) {
      return odKey;
    }
    return null;
  }
  
  return trimmed;
}

/**
 * Normalise un nom pour la comparaison (enlève accents, met en majuscules)
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

async function fixJoelSieTickets() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔧 CORRECTION DES TICKETS DE JOËL SIE');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // 1. Trouver l'agent JOEL SIE
  console.log('🔍 Recherche de l\'agent JOEL SIE...');
  const { data: joelSieAgent, error: agentError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .ilike('full_name', '%JOEL%SIE%')
    .eq('role', 'agent')
    .limit(1)
    .maybeSingle();

  if (agentError || !joelSieAgent) {
    console.error('❌ Agent JOEL SIE non trouvé:', agentError?.message);
    process.exit(1);
  }

  console.log(`✅ Agent trouvé: ${joelSieAgent.full_name} (${joelSieAgent.email || 'pas d\'email'})\n`);

  // 2. Charger le mapping de correspondance
  const correspondanceMap = loadCorrespondanceMapping();

  // 3. Charger le CSV des tickets
  console.log('📖 Chargement du CSV des tickets...');
  const csvContent = readFileSync(TICKETS_CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  console.log(`✅ ${records.length} tickets trouvés dans le CSV\n`);

  // 4. Identifier les tickets avec "Joël SIE" comme rapporteur
  const ticketsToFix = [];
  const normalizedJoelSie = normalizeName('Joël SIE');

  for (const row of records) {
    const reporterName = row['Rapporteur']?.trim();
    if (!reporterName) continue;

    const normalizedReporter = normalizeName(reporterName);
    if (normalizedReporter === normalizedJoelSie) {
      const csvJiraKey = row['Clé de ticket']?.trim();
      if (csvJiraKey) {
        const jiraIssueKey = mapJiraKey(csvJiraKey, correspondanceMap);
        if (jiraIssueKey) {
          ticketsToFix.push({
            jiraIssueKey,
            csvJiraKey,
            title: row['Résumé']?.trim() || 'Sans titre'
          });
        }
      }
    }
  }

  console.log(`📋 ${ticketsToFix.length} tickets trouvés avec "Joël SIE" comme rapporteur\n`);

  if (ticketsToFix.length === 0) {
    console.log('✅ Aucun ticket à corriger');
    return;
  }

  // 5. Mettre à jour les tickets
  console.log('🔄 Mise à jour des tickets...\n');
  let updated = 0;
  let notFound = 0;
  const errors = [];

  for (const ticket of ticketsToFix) {
    try {
      // Chercher le ticket dans Supabase
      const { data: existingTicket, error: searchError } = await supabase
        .from('tickets')
        .select('id, jira_issue_key, title, created_by')
        .eq('jira_issue_key', ticket.jiraIssueKey)
        .limit(1)
        .maybeSingle();

      if (searchError) {
        errors.push({ ticket: ticket.jiraIssueKey, error: searchError.message });
        continue;
      }

      if (!existingTicket) {
        console.log(`⚠️  Ticket ${ticket.jiraIssueKey} non trouvé dans Supabase`);
        notFound++;
        continue;
      }

      // Vérifier si déjà rattaché au bon agent
      if (existingTicket.created_by === joelSieAgent.id) {
        console.log(`✓ Ticket ${ticket.jiraIssueKey} déjà rattaché à JOEL SIE`);
        continue;
      }

      // Mettre à jour le ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ created_by: joelSieAgent.id })
        .eq('id', existingTicket.id);

      if (updateError) {
        errors.push({ ticket: ticket.jiraIssueKey, error: updateError.message });
        console.error(`❌ Erreur lors de la mise à jour de ${ticket.jiraIssueKey}:`, updateError.message);
      } else {
        updated++;
        console.log(`✅ Ticket ${ticket.jiraIssueKey} rattaché à JOEL SIE`);
      }
    } catch (error) {
      errors.push({ ticket: ticket.jiraIssueKey, error: error.message });
      console.error(`❌ Erreur lors du traitement de ${ticket.jiraIssueKey}:`, error.message);
    }
  }

  // 6. Résumé
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log(`   ✅ Tickets mis à jour: ${updated}`);
  console.log(`   ⚠️  Tickets non trouvés: ${notFound}`);
  console.log(`   ❌ Erreurs: ${errors.length}\n`);

  if (errors.length > 0) {
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('❌ ERREURS');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.ticket}: ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... et ${errors.length - 10} autres erreurs`);
    }
    console.log('');
  }

  console.log('✅ Correction terminée');
}

// Exécuter la correction
fixJoelSieTickets().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





