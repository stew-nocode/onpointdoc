#!/usr/bin/env node

/**
 * Script pour extraire les correspondances OBCS depuis JIRA via MCP
 * 
 * Ce script utilise les tickets OD que nous connaissons déjà depuis Supabase
 * et interroge JIRA pour chaque ticket pour trouver le champ "Lien de ticket sortant (Duplicate)"
 * 
 * Usage:
 *   node scripts/extract-correspondances-via-mcp-jira.mjs
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

async function extractCorrespondancesViaMCP() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔍 EXTRACTION DES CORRESPONDANCES OBCS DEPUIS JIRA VIA MCP');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('ℹ️  Ce script va récupérer tous les tickets OD depuis Supabase');
  console.log('   puis utiliser le MCP JIRA pour extraire le champ "Lien de ticket sortant (Duplicate)"\n');

  // 1. Récupérer tous les tickets OD depuis Supabase
  console.log('📥 Récupération des tickets OD depuis Supabase...');
  const { data: odTickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .like('jira_issue_key', 'OD-%')
    .order('jira_issue_key', { ascending: true });

  if (error) {
    console.error('❌ Erreur lors de la récupération:', error.message);
    process.exit(1);
  }

  console.log(`✅ ${odTickets.length} tickets OD trouvés dans Supabase\n`);

  console.log('⚠️  Pour extraire les correspondances depuis JIRA, vous devez:');
  console.log('   1. Utiliser le script extract-obcs-correspondances-from-jira.mjs');
  console.log('   2. Configurer JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN dans .env.local');
  console.log('   3. Ou utiliser directement le MCP JIRA dans Cursor avec les bons credentials\n');

  console.log('📝 Instructions:');
  console.log('   Le champ "Lien de ticket sortant (Duplicate)" dans JIRA peut être:');
  console.log('   - Un Issue Link de type "Duplicate" (outwardIssue)');
  console.log('   - Un champ personnalisé (customfield_XXXXX)');
  console.log('   - Un champ de type texte contenant la clé OBCS\n');

  console.log('💡 Pour identifier le champ exact:');
  console.log('   1. Ouvrez un ticket OD dans JIRA (ex: OD-2373)');
  console.log('   2. Vérifiez le champ "Lien de ticket sortant (Duplicate)"');
  console.log('   3. Utilisez l\'API JIRA pour récupérer tous les champs du ticket');
  console.log('   4. Cherchez le champ qui contient la clé OBCS correspondante\n');

  // Afficher quelques exemples de tickets OD
  console.log('📋 Exemples de tickets OD à vérifier dans JIRA:');
  odTickets.slice(0, 10).forEach((ticket, idx) => {
    console.log(`   ${idx + 1}. ${ticket.jira_issue_key}`);
  });
  if (odTickets.length > 10) {
    console.log(`   ... et ${odTickets.length - 10} autres`);
  }

  console.log('\n✅ Script terminé');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Configurez les credentials JIRA dans .env.local');
  console.log('   2. Exécutez: node scripts/extract-obcs-correspondances-from-jira.mjs');
}

extractCorrespondancesViaMCP().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





