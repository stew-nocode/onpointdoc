#!/usr/bin/env node

/**
 * Script pour vérifier la conformité des 8 tickets OBCS trouvés par titre
 * avec leurs correspondants OD dans Supabase
 * 
 * Compare tous les champs importants pour s'assurer qu'il s'agit bien des mêmes tickets
 * 
 * Usage:
 *   node scripts/verify-obcs-od-matches.mjs
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
const MATCHES_JSON_PATH = path.join(
  __dirname,
  '../docs/ticket/correspondances-par-titre.json'
);

/**
 * Normalise une valeur pour la comparaison
 */
function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

/**
 * Compare deux valeurs (tolérant pour la casse et les espaces)
 */
function valuesMatch(val1, val2) {
  return normalize(val1) === normalize(val2);
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

async function verifyMatches() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 VÉRIFICATION DE CONFORMITÉ DES 8 CORRESPONDANCES');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // 1. Charger les correspondances trouvées
  console.log('📖 Chargement des correspondances...');
  const matchesContent = readFileSync(MATCHES_JSON_PATH, 'utf-8');
  const matches = JSON.parse(matchesContent);
  console.log(`✅ ${matches.length} correspondances chargées\n`);

  // 2. Charger le CSV des tickets
  console.log('📖 Chargement du CSV des tickets...');
  const csvContent = readFileSync(TICKETS_CSV_PATH, 'utf-8');
  const csvRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  // Créer un index des tickets CSV par clé Jira
  const csvTicketsMap = new Map();
  for (const record of csvRecords) {
    const key = record['Clé de ticket']?.trim();
    if (key) {
      csvTicketsMap.set(key, record);
    }
  }
  console.log(`✅ ${csvRecords.length} tickets chargés depuis le CSV\n`);

  // 3. Pour chaque correspondance, comparer les champs
  console.log('🔍 Vérification de la conformité...\n');

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const obcsKey = match.obcsKey;
    const odKey = match.odTickets[0].jira_issue_key; // Prendre le premier match

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`${i + 1}. ${obcsKey} → ${odKey}`);
    console.log(`${'═'.repeat(80)}`);

    // Récupérer le ticket OBCS du CSV
    const obcsTicket = csvTicketsMap.get(obcsKey);
    if (!obcsTicket) {
      console.log(`❌ Ticket OBCS ${obcsKey} non trouvé dans le CSV`);
      continue;
    }

    // Récupérer le ticket OD de Supabase
    const { data: odTicket, error: odError } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        ticket_type,
        status,
        priority,
        canal,
        jira_issue_key,
        jira_issue_id,
        product_id,
        module_id,
        submodule_id,
        feature_id,
        company_id,
        contact_user_id,
        created_by,
        bug_type,
        resolved_at,
        created_at,
        updated_at,
        products:product_id(name),
        modules:module_id(name, id_module_jira),
        submodules:submodule_id(name, id_module_jira),
        features:feature_id(name, jira_feature_id),
        companies:company_id(name),
        contact_profile:contact_user_id(full_name, email),
        creator_profile:created_by(full_name, email)
      `)
      .eq('jira_issue_key', odKey)
      .single();

    if (odError || !odTicket) {
      console.log(`❌ Ticket OD ${odKey} non trouvé dans Supabase: ${odError?.message}`);
      continue;
    }

    // Comparer les champs clés
    const comparisons = [];

    // Titre
    const titleMatch = valuesMatch(obcsTicket['Résumé'], odTicket.title);
    comparisons.push({
      field: 'Titre',
      obcs: obcsTicket['Résumé'] || 'N/A',
      od: odTicket.title || 'N/A',
      match: titleMatch
    });

    // Description (tronquer pour l'affichage)
    const obcsDesc = (obcsTicket['Description'] || '').substring(0, 100);
    const odDesc = (odTicket.description || '').substring(0, 100);
    const descMatch = obcsTicket['Description'] && odTicket.description 
      ? normalize(obcsTicket['Description']).substring(0, 200) === normalize(odTicket.description).substring(0, 200)
      : true; // Si l'un des deux est vide, on considère comme match
    comparisons.push({
      field: 'Description',
      obcs: obcsDesc || 'N/A',
      od: odDesc || 'N/A',
      match: descMatch
    });

    // Type de ticket
    const obcsType = obcsTicket['Type_Ticket']?.trim() || 'BUG';
    const odType = odTicket.ticket_type || 'BUG';
    const typeMatch = valuesMatch(obcsType, odType === 'REQ' ? 'REQUÊTE' : odType);
    comparisons.push({
      field: 'Type',
      obcs: obcsType,
      od: odType,
      match: typeMatch
    });

    // Statut
    const statusMatch = valuesMatch(obcsTicket['Etat'], odTicket.status);
    comparisons.push({
      field: 'Statut',
      obcs: obcsTicket['Etat'] || 'N/A',
      od: odTicket.status || 'N/A',
      match: statusMatch
    });

    // Priorité
    const obcsPriority = obcsTicket['Priorité']?.trim() || '';
    const odPriority = odTicket.priority || '';
    const priorityMatch = valuesMatch(obcsPriority, odPriority);
    comparisons.push({
      field: 'Priorité',
      obcs: obcsPriority || 'N/A',
      od: odPriority || 'N/A',
      match: priorityMatch
    });

    // Entreprise
    const obcsCompany = obcsTicket['Entreprises']?.trim() || '';
    const odCompany = odTicket.companies?.name || 'N/A';
    const companyMatch = obcsCompany && odTicket.company_id
      ? valuesMatch(obcsCompany, odCompany)
      : true; // Si l'un est vide, on considère comme match
    comparisons.push({
      field: 'Entreprise',
      obcs: obcsCompany || 'N/A',
      od: odCompany,
      match: companyMatch
    });

    // Utilisateur contact
    const obcsUser = obcsTicket['Utilisateurs']?.trim() || '';
    const odUser = odTicket.contact_profile?.full_name || odTicket.contact_profile?.email || 'N/A';
    const userMatch = obcsUser && odTicket.contact_user_id
      ? valuesMatch(obcsUser, odUser)
      : true;
    comparisons.push({
      field: 'Utilisateur contact',
      obcs: obcsUser || 'N/A',
      od: odUser,
      match: userMatch
    });

    // Module
    const obcsModule = obcsTicket['Module']?.trim() || '';
    const odModule = odTicket.modules?.name || 'N/A';
    const moduleMatch = obcsModule && odTicket.module_id
      ? valuesMatch(obcsModule, odModule)
      : true;
    comparisons.push({
      field: 'Module',
      obcs: obcsModule || 'N/A',
      od: odModule,
      match: moduleMatch
    });

    // Date de création
    const obcsCreated = obcsTicket['Date de creation de Jira']?.trim() || '';
    const odCreated = formatDate(odTicket.created_at);
    const createdMatch = obcsCreated && odTicket.created_at
      ? valuesMatch(obcsCreated.split(' ')[0], odCreated) // Comparer seulement la date
      : true;
    comparisons.push({
      field: 'Date de création',
      obcs: obcsCreated || 'N/A',
      od: odCreated,
      match: createdMatch
    });

    // Type de bug
    const obcsBugType = obcsTicket['Type de bug']?.trim() || '';
    const odBugType = odTicket.bug_type || '';
    const bugTypeMatch = valuesMatch(obcsBugType, odBugType);
    comparisons.push({
      field: 'Type de bug',
      obcs: obcsBugType || 'N/A',
      od: odBugType || 'N/A',
      match: bugTypeMatch
    });

    // Afficher les comparaisons
    const allMatch = comparisons.every(c => c.match);
    const matchCount = comparisons.filter(c => c.match).length;
    const totalCount = comparisons.length;

    console.log(`\n📊 Conformité: ${matchCount}/${totalCount} champs conformes\n`);

    comparisons.forEach(comp => {
      const icon = comp.match ? '✅' : '❌';
      console.log(`${icon} ${comp.field}:`);
      console.log(`   OBCS: ${comp.obcs}`);
      if (!comp.match) {
        console.log(`   OD:   ${comp.od}`);
      }
      console.log('');
    });

    if (allMatch) {
      console.log('✅ Tous les champs sont conformes - Il s\'agit bien du même ticket\n');
    } else {
      console.log('⚠️  Certains champs diffèrent - Vérification manuelle recommandée\n');
    }
  }

  console.log('\n✅ Vérification terminée');
}

// Exécuter la vérification
verifyMatches().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





