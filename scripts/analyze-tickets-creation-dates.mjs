#!/usr/bin/env node

/**
 * Script pour analyser les dates de création des tickets
 * 
 * Vérifie:
 * 1. Si les tickets ont une date de création
 * 2. Si cette date correspond à la date Jira (si jira_issue_key existe)
 * 3. Combien de tickets n'ont pas de date de création
 * 4. Répartition par origine (jira vs supabase)
 * 
 * Usage:
 *   node scripts/analyze-tickets-creation-dates.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
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

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('📊 ANALYSE DES DATES DE CRÉATION DES TICKETS');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

/**
 * Analyse les dates de création des tickets
 */
async function analyzeTicketsCreationDates() {
  console.log('🔍 Récupération des tickets depuis Supabase...\n');

  // Récupérer tous les tickets avec leurs informations
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      id,
      jira_issue_key,
      created_at,
      updated_at,
      origin,
      title,
      ticket_type,
      status
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur lors de la récupération des tickets:', error.message);
    return;
  }

  if (!tickets || tickets.length === 0) {
    console.log('⚠️  Aucun ticket trouvé dans Supabase');
    return;
  }

  console.log(`✅ ${tickets.length} ticket(s) récupéré(s)\n`);

  // Analyser les tickets
  const analysis = {
    total: tickets.length,
    withCreatedAt: 0,
    withoutCreatedAt: 0,
    withJiraKey: 0,
    withoutJiraKey: 0,
    fromJira: 0,
    fromSupabase: 0,
    ticketsWithoutCreatedAt: [],
    ticketsWithJiraButNoCreatedAt: [],
    recentTickets: [],
  };

  tickets.forEach((ticket) => {
    // Vérifier si created_at existe
    if (ticket.created_at) {
      analysis.withCreatedAt++;
      
      // Garder les 50 plus récents pour analyse
      if (analysis.recentTickets.length < 50) {
        analysis.recentTickets.push({
          jira_key: ticket.jira_issue_key,
          created_at: ticket.created_at,
          origin: ticket.origin,
          title: ticket.title?.substring(0, 50) || 'N/A',
        });
      }
    } else {
      analysis.withoutCreatedAt++;
      analysis.ticketsWithoutCreatedAt.push({
        id: ticket.id,
        jira_key: ticket.jira_issue_key,
        origin: ticket.origin,
        title: ticket.title?.substring(0, 50) || 'N/A',
      });
    }

    // Vérifier jira_issue_key
    if (ticket.jira_issue_key) {
      analysis.withJiraKey++;
      
      // Vérifier si ticket Jira n'a pas de created_at
      if (!ticket.created_at) {
        analysis.ticketsWithJiraButNoCreatedAt.push({
          id: ticket.id,
          jira_key: ticket.jira_issue_key,
          origin: ticket.origin,
          title: ticket.title?.substring(0, 50) || 'N/A',
        });
      }
    } else {
      analysis.withoutJiraKey++;
    }

    // Vérifier l'origine
    if (ticket.origin === 'jira') {
      analysis.fromJira++;
    } else if (ticket.origin === 'supabase') {
      analysis.fromSupabase++;
    }
  });

  // Afficher les résultats
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSULTATS DE L\'ANALYSE');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  console.log(`📦 Total de tickets: ${analysis.total}`);
  console.log(`\n📅 Dates de création:`);
  console.log(`   ✅ Avec created_at: ${analysis.withCreatedAt} (${((analysis.withCreatedAt / analysis.total) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Sans created_at: ${analysis.withoutCreatedAt} (${((analysis.withoutCreatedAt / analysis.total) * 100).toFixed(1)}%)`);

  console.log(`\n🔗 Tickets Jira:`);
  console.log(`   ✅ Avec jira_issue_key: ${analysis.withJiraKey} (${((analysis.withJiraKey / analysis.total) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Sans jira_issue_key: ${analysis.withoutJiraKey} (${((analysis.withoutJiraKey / analysis.total) * 100).toFixed(1)}%)`);

  console.log(`\n📍 Origine:`);
  console.log(`   🔵 Depuis Jira: ${analysis.fromJira} (${((analysis.fromJira / analysis.total) * 100).toFixed(1)}%)`);
  console.log(`   🟢 Depuis Supabase: ${analysis.fromSupabase} (${((analysis.fromSupabase / analysis.total) * 100).toFixed(1)}%)`);

  // Afficher les tickets sans created_at
  if (analysis.ticketsWithoutCreatedAt.length > 0) {
    console.log(`\n⚠️  Tickets SANS date de création (${analysis.ticketsWithoutCreatedAt.length}):`);
    analysis.ticketsWithoutCreatedAt.slice(0, 10).forEach((ticket, index) => {
      console.log(`   ${index + 1}. ${ticket.jira_key || 'N/A'} - ${ticket.title} [${ticket.origin || 'N/A'}]`);
    });
    if (analysis.ticketsWithoutCreatedAt.length > 10) {
      console.log(`   ... et ${analysis.ticketsWithoutCreatedAt.length - 10} autre(s) ticket(s)`);
    }
  }

  // Afficher les tickets Jira sans created_at
  if (analysis.ticketsWithJiraButNoCreatedAt.length > 0) {
    console.log(`\n⚠️  Tickets JIRA SANS date de création (${analysis.ticketsWithJiraButNoCreatedAt.length}):`);
    console.log(`   Ces tickets proviennent de Jira mais n'ont pas de created_at dans Supabase.`);
    analysis.ticketsWithJiraButNoCreatedAt.slice(0, 10).forEach((ticket, index) => {
      console.log(`   ${index + 1}. ${ticket.jira_key} - ${ticket.title}`);
    });
    if (analysis.ticketsWithJiraButNoCreatedAt.length > 10) {
      console.log(`   ... et ${analysis.ticketsWithJiraButNoCreatedAt.length - 10} autre(s) ticket(s)`);
    }
  }

  // Afficher quelques exemples de tickets récents
  if (analysis.recentTickets.length > 0) {
    console.log(`\n📋 Exemples de tickets récents (${analysis.recentTickets.length} premiers):`);
    analysis.recentTickets.slice(0, 5).forEach((ticket, index) => {
      const date = new Date(ticket.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`   ${index + 1}. ${ticket.jira_key || 'N/A'} - ${date} [${ticket.origin || 'N/A'}] - ${ticket.title}`);
    });
  }

  // Recommandations
  console.log(`\n════════════════════════════════════════════════════════════════════════════════`);
  console.log('💡 RECOMMANDATIONS');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  if (analysis.ticketsWithoutCreatedAt > 0) {
    console.log(`⚠️  ${analysis.ticketsWithoutCreatedAt} ticket(s) n'ont pas de date de création.`);
    console.log(`   → Utiliser le script refresh-all-tickets-from-jira.mjs pour les synchroniser.`);
  }

  if (analysis.ticketsWithJiraButNoCreatedAt.length > 0) {
    console.log(`⚠️  ${analysis.ticketsWithJiraButNoCreatedAt.length} ticket(s) Jira n'ont pas de created_at.`);
    console.log(`   → Ces tickets doivent être rafraîchis depuis Jira pour récupérer leur date de création.`);
  }

  if (analysis.withoutCreatedAt === 0) {
    console.log(`✅ Tous les tickets ont une date de création !`);
  }

  console.log('\n');
}

// Exécuter l'analyse
analyzeTicketsCreationDates().catch((error) => {
  console.error('❌ Erreur lors de l\'analyse:', error);
  process.exit(1);
});

