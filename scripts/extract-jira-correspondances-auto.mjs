#!/usr/bin/env node

/**
 * Script pour extraire automatiquement les correspondances OBCS depuis JIRA
 * 
 * Utilise le MCP JIRA pour récupérer les tickets OD et identifier automatiquement
 * le champ "Lien de ticket sortant (Duplicate)"
 * 
 * Ce script doit être exécuté avec le MCP JIRA actif dans Cursor
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
  console.log('🔍 EXTRACTION AUTOMATIQUE DES CORRESPONDANCES OBCS DEPUIS JIRA');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  console.log('⚠️  IMPORTANT:');
  console.log('   Ce script nécessite que vous utilisez le MCP JIRA directement dans Cursor.');
  console.log('   Je vais vous guider pour extraire les correspondances.\n');

  // 1. Récupérer tous les tickets OD depuis Supabase
  console.log('📥 Récupération des tickets OD depuis Supabase...');
  const { data: odTickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, title')
    .like('jira_issue_key', 'OD-%')
    .order('jira_issue_key', { ascending: true });

  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  console.log(`✅ ${odTickets.length} tickets OD trouvés\n`);

  // 2. Instructions pour utiliser le MCP JIRA
  console.log('📝 INSTRUCTIONS POUR UTILISER LE MCP JIRA:\n');
  console.log('   1. Dans Cursor, utilisez les outils MCP JIRA suivants:');
  console.log('      - mcp_jira_jira_search() : Rechercher les tickets OD');
  console.log('      - mcp_jira_jira_get_issue() : Récupérer un ticket avec tous ses champs\n');
  
  console.log('   2. Pour identifier le champ "Lien de ticket sortant (Duplicate)":');
  console.log('      - Récupérez un ticket OD exemple (ex: OD-2373)');
  console.log('      - Examinez tous les champs personnalisés (customfield_*)');
  console.log('      - Examinez les issue links (issuelinks)\n');

  console.log('   3. Une fois le champ identifié, je pourrai créer un script');
  console.log('      pour extraire toutes les correspondances automatiquement.\n');

  // 3. Créer un fichier avec la liste des tickets
  const ticketsList = odTickets.map(t => ({
    odKey: t.jira_issue_key,
    title: t.title || ''
  }));

  const outputPath = path.join(__dirname, '../docs/ticket/tickets-od-pour-extraction.json');
  writeFileSync(outputPath, JSON.stringify(ticketsList, null, 2), 'utf-8');
  console.log(`💾 Liste sauvegardée: ${outputPath}\n`);

  console.log('✅ Préparation terminée');
  console.log('\n💡 Pour continuer:');
  console.log('   Dites-moi comment identifier le champ "Lien de ticket sortant (Duplicate)"');
  console.log('   dans JIRA, ou laissez-moi récupérer un ticket exemple via MCP JIRA.');
}

extractCorrespondances().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});





