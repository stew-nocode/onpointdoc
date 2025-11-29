#!/usr/bin/env node

/**
 * Script pour extraire les correspondances OBCS depuis JIRA via MCP JIRA
 * 
 * Utilise les tickets OD depuis Supabase et interroge JIRA pour chaque ticket
 * pour extraire le champ "Lien de ticket sortant (Duplicate)"
 * 
 * Usage:
 *   node scripts/extract-correspondances-mcp-jira.mjs
 * 
 * Note: Ce script doit être exécuté depuis Cursor avec le MCP JIRA actif
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

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
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

async function extractCorrespondances() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 EXTRACTION DES CORRESPONDANCES OBCS DEPUIS JIRA');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('ℹ️  Ce script va:');
  console.log('   1. Récupérer tous les tickets OD depuis Supabase');
  console.log('   2. Utiliser le MCP JIRA pour extraire le champ "Lien de ticket sortant (Duplicate)"');
  console.log('   3. Créer un fichier CSV avec les correspondances OBCS → OD\n');

  // 1. Récupérer tous les tickets OD depuis Supabase
  console.log('📥 Récupération des tickets OD depuis Supabase...');
  const { data: odTickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, title')
    .like('jira_issue_key', 'OD-%')
    .order('jira_issue_key', { ascending: true });

  if (error) {
    console.error('❌ Erreur lors de la récupération:', error.message);
    process.exit(1);
  }

  console.log(`✅ ${odTickets.length} tickets OD trouvés dans Supabase\n`);

  console.log('⚠️  IMPORTANT:');
  console.log('   Ce script nécessite que le MCP JIRA soit actif dans Cursor.');
  console.log('   Les correspondances seront extraites en utilisant les outils MCP JIRA.\n');

  console.log('📋 Liste des tickets OD à vérifier dans JIRA:');
  console.log(`   (${odTickets.length} tickets au total)\n`);

  // Afficher les premiers tickets
  odTickets.slice(0, 5).forEach((ticket) => {
    console.log(`   - ${ticket.jira_issue_key}: ${(ticket.title || '').substring(0, 60)}...`);
  });
  
  if (odTickets.length > 5) {
    console.log(`   ... et ${odTickets.length - 5} autres tickets\n`);
  }

  console.log('\n💡 Instructions pour utiliser le MCP JIRA:');
  console.log('   1. Le MCP JIRA doit être configuré et actif');
  console.log('   2. Pour chaque ticket OD, recherchez le champ "Lien de ticket sortant (Duplicate)"');
  console.log('   3. Ce champ peut être:');
  console.log('      - Un Issue Link de type "Duplicate" (outwardIssue)');
  console.log('      - Un champ personnalisé (customfield_XXXXX)');
  console.log('      - Dans les issuelinks avec type.name = "Duplicate"\n');

  console.log('📝 Le script suivant utilisera le MCP JIRA pour:');
  console.log('   - Récupérer chaque ticket OD via jira_get_issue()');
  console.log('   - Examiner tous les champs pour trouver la clé OBCS');
  console.log('   - Créer un mapping complet OBCS → OD\n');

  // Créer un fichier avec la liste des tickets à traiter
  const ticketsList = odTickets.map(t => ({
    odKey: t.jira_issue_key,
    title: t.title || ''
  }));

  const listPath = path.join(__dirname, '../docs/ticket/liste-tickets-od-pour-correspondances.json');
  writeFileSync(listPath, JSON.stringify(ticketsList, null, 2), 'utf-8');
  console.log(`💾 Liste des tickets OD sauvegardée dans: ${listPath}\n`);

  console.log('✅ Préparation terminée');
  console.log('\n📝 Prochaine étape:');
  console.log('   Utiliser le MCP JIRA pour extraire les correspondances depuis JIRA');
}

extractCorrespondances().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





