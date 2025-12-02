#!/usr/bin/env node

/**
 * Script pour analyser la répartition des tickets par année
 * 
 * Analyse:
 * - Période couverte (année la plus ancienne → année la plus récente)
 * - Nombre de tickets par année
 * - Nombre de tickets par mois
 * - Répartition par origine (jira vs supabase)
 * 
 * Usage:
 *   node scripts/analyze-tickets-year-distribution.mjs
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
console.log('📅 ANALYSE DE LA RÉPARTITION DES TICKETS PAR ANNÉE');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

/**
 * Analyse la répartition des tickets par année
 */
async function analyzeTicketsYearDistribution() {
  console.log('🔍 Récupération des tickets depuis Supabase...\n');

  // Récupérer tous les tickets avec leurs dates de création
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      id,
      jira_issue_key,
      created_at,
      origin,
      ticket_type
    `)
    .not('created_at', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erreur lors de la récupération des tickets:', error.message);
    return;
  }

  if (!tickets || tickets.length === 0) {
    console.log('⚠️  Aucun ticket trouvé dans Supabase');
    return;
  }

  console.log(`✅ ${tickets.length} ticket(s) récupéré(s)\n`);

  // Analyser la répartition par année et mois
  const yearDistribution = new Map();
  const monthDistribution = new Map();
  const originDistribution = { jira: {}, supabase: {} };
  
  let oldestDate = null;
  let newestDate = null;

  tickets.forEach((ticket) => {
    if (!ticket.created_at) return;

    const date = new Date(ticket.created_at);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const yearKey = String(year);

    // Mettre à jour les dates limites
    if (!oldestDate || date < oldestDate) {
      oldestDate = date;
    }
    if (!newestDate || date > newestDate) {
      newestDate = date;
    }

    // Distribution par année
    if (!yearDistribution.has(yearKey)) {
      yearDistribution.set(yearKey, {
        year: year,
        total: 0,
        byType: { BUG: 0, REQ: 0, ASSISTANCE: 0 },
        byOrigin: { jira: 0, supabase: 0 }
      });
    }
    const yearData = yearDistribution.get(yearKey);
    yearData.total++;
    
    // Par type
    if (ticket.ticket_type === 'BUG' || ticket.ticket_type === 'REQ' || ticket.ticket_type === 'ASSISTANCE') {
      yearData.byType[ticket.ticket_type] = (yearData.byType[ticket.ticket_type] || 0) + 1;
    }
    
    // Par origine
    if (ticket.origin === 'jira') {
      yearData.byOrigin.jira++;
      if (!originDistribution.jira[yearKey]) {
        originDistribution.jira[yearKey] = 0;
      }
      originDistribution.jira[yearKey]++;
    } else if (ticket.origin === 'supabase') {
      yearData.byOrigin.supabase++;
      if (!originDistribution.supabase[yearKey]) {
        originDistribution.supabase[yearKey] = 0;
      }
      originDistribution.supabase[yearKey]++;
    }

    // Distribution par mois
    if (!monthDistribution.has(monthKey)) {
      monthDistribution.set(monthKey, 0);
    }
    monthDistribution.set(monthKey, monthDistribution.get(monthKey) + 1);
  });

  // Calculer le nombre d'années
  const yearsCovered = oldestDate && newestDate 
    ? newestDate.getFullYear() - oldestDate.getFullYear() + 1
    : 0;

  const totalDays = oldestDate && newestDate
    ? Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24))
    : 0;

  const totalMonths = oldestDate && newestDate
    ? Math.ceil(totalDays / 30)
    : 0;

  // Afficher les résultats
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSULTATS DE L\'ANALYSE');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  console.log(`📦 Total de tickets: ${tickets.length}`);
  console.log(`\n📅 Période couverte:`);
  if (oldestDate && newestDate) {
    const oldestStr = oldestDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const newestStr = newestDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    console.log(`   📍 Ticket le plus ancien: ${oldestStr}`);
    console.log(`   📍 Ticket le plus récent: ${newestStr}`);
    console.log(`   📊 Nombre d'années: ${yearsCovered} année(s)`);
    console.log(`   📊 Nombre de mois: ${totalMonths} mois (environ ${(totalMonths / 12).toFixed(1)} années)`);
    console.log(`   📊 Nombre de jours: ${totalDays} jours`);
  } else {
    console.log(`   ⚠️  Impossible de déterminer la période`);
  }

  // Afficher la répartition par année
  console.log(`\n📊 RÉPARTITION PAR ANNÉE:\n`);
  
  const sortedYears = Array.from(yearDistribution.entries())
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  sortedYears.forEach(([yearKey, data]) => {
    const percentage = ((data.total / tickets.length) * 100).toFixed(1);
    console.log(`📅 ${yearKey}: ${data.total} ticket(s) (${percentage}%)`);
    console.log(`   - Type: BUG=${data.byType.BUG}, REQ=${data.byType.REQ}, ASSISTANCE=${data.byType.ASSISTANCE}`);
    console.log(`   - Origine: Jira=${data.byOrigin.jira}, Supabase=${data.byOrigin.supabase}`);
  });

  // Afficher les 12 mois les plus récents
  console.log(`\n📊 RÉPARTITION PAR MOIS (12 derniers mois):\n`);
  
  const sortedMonths = Array.from(monthDistribution.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  sortedMonths.forEach(([monthKey, count]) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthName = monthNames[parseInt(month) - 1];
    const percentage = ((count / tickets.length) * 100).toFixed(1);
    console.log(`   ${monthName} ${year}: ${count} ticket(s) (${percentage}%)`);
  });

  // Statistiques supplémentaires
  console.log(`\n📊 STATISTIQUES SUPPLÉMENTAIRES:\n`);
  
  const avgPerYear = tickets.length / yearsCovered;
  const avgPerMonth = tickets.length / totalMonths;
  
  console.log(`   📈 Moyenne par année: ${avgPerYear.toFixed(1)} ticket(s)/an`);
  console.log(`   📈 Moyenne par mois: ${avgPerMonth.toFixed(1)} ticket(s)/mois`);
  
  // Année avec le plus de tickets
  const yearWithMostTickets = sortedYears.reduce((max, current) => {
    return current[1].total > max[1].total ? current : max;
  }, sortedYears[0]);
  
  console.log(`   🏆 Année avec le plus de tickets: ${yearWithMostTickets[0]} (${yearWithMostTickets[1].total} tickets)`);

  // Année la plus récente
  const mostRecentYear = sortedYears[sortedYears.length - 1];
  console.log(`   🆕 Année la plus récente: ${mostRecentYear[0]} (${mostRecentYear[1].total} tickets)`);

  // Année la plus ancienne
  const oldestYear = sortedYears[0];
  console.log(`   📜 Année la plus ancienne: ${oldestYear[0]} (${oldestYear[1].total} tickets)`);

  console.log('\n');
}

// Exécuter l'analyse
analyzeTicketsYearDistribution().catch((error) => {
  console.error('❌ Erreur lors de l\'analyse:', error);
  process.exit(1);
});

