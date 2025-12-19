#!/usr/bin/env node

/**
 * Script pour mettre à jour created_by des tickets créés par EVA BASSE
 * 
 * Processus:
 * 1. Parse le fichier CSV de correspondance OBCS ↔ OD
 * 2. Pour chaque clé OBCS dans la liste fournie, trouve la clé OD correspondante
 * 3. Met à jour tickets.created_by avec le profil d'EVA BASSE
 * 
 * Usage:
 *   node scripts/update-eva-tickets-created-by.mjs --obcs OBCS-11493,OBCS-11491,OBCS-11483
 *   ou
 *   node scripts/update-eva-tickets-created-by.mjs --file liste-obcs-eva.txt
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

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
  console.error('❌ Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

// ✅ ID du profil d'EVA BASSE (agent support)
const EVA_PROFILE_ID = '62494f26-691b-4332-b831-07741d927779';

/**
 * Parse le fichier CSV de correspondance
 * @returns Map<OBCS_Key, OD_Key>
 */
function parseCorrespondanceCSV() {
  const csvPath = path.resolve(__dirname, '../docs/ticket/correspondance - Jira (3).csv');
  
  if (!existsSync(csvPath)) {
    throw new Error(`Fichier CSV introuvable: ${csvPath}`);
  }

  const csvContent = readFileSync(csvPath, 'utf-8');
  
  // ✅ Utiliser csv-parse pour un parsing robuste
  const records = parse(csvContent, {
    columns: true, // Première ligne = headers
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true
  });
  
  // Mapping OBCS → OD
  const mapping = new Map();
  
  for (const record of records) {
    // Format: Résumé, Clé de ticket (OD), Lien de ticket sortant (OBCS)
    const odKey = record['Clé de ticket']?.trim();
    const obcsKey = record['Lien de ticket sortant (Duplicate)']?.trim();
    
    // Si on a une clé OBCS, créer le mapping
    if (obcsKey && obcsKey.startsWith('OBCS-') && odKey && odKey.startsWith('OD-')) {
      mapping.set(obcsKey, odKey);
    }
  }
  
  return mapping;
}

/**
 * Extrait les clés OBCS depuis les arguments ou un fichier
 */
function getOBCSKeys() {
  const args = process.argv.slice(2);
  
  // Option --obcs
  const obcsIndex = args.indexOf('--obcs');
  if (obcsIndex !== -1 && args[obcsIndex + 1]) {
    return args[obcsIndex + 1].split(',').map(k => k.trim()).filter(Boolean);
  }
  
  // Option --file
  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const filePath = path.resolve(process.cwd(), args[fileIndex + 1]);
    if (!existsSync(filePath)) {
      throw new Error(`Fichier introuvable: ${filePath}`);
    }
    const content = readFileSync(filePath, 'utf-8');
    return content.split('\n').map(k => k.trim()).filter(k => k && k.startsWith('OBCS-'));
  }
  
  // Si pas d'arguments, demander à l'utilisateur
  console.error('❌ Aucune clé OBCS fournie');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/update-eva-tickets-created-by.mjs --obcs OBCS-11493,OBCS-11491,OBCS-11483');
  console.error('  ou');
  console.error('  node scripts/update-eva-tickets-created-by.mjs --file liste-obcs-eva.txt');
  process.exit(1);
}

/**
 * Met à jour created_by pour un ticket
 */
async function updateTicketCreatedBy(jiraIssueKey, dryRun = false) {
  // Trouver le ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, jira_issue_key, created_by, title')
    .eq('jira_issue_key', jiraIssueKey)
    .maybeSingle();
  
  if (ticketError) {
    console.error(`❌ Erreur lors de la recherche du ticket ${jiraIssueKey}:`, ticketError.message);
    return { success: false, error: ticketError.message };
  }
  
  if (!ticket) {
    console.warn(`⚠️  Ticket ${jiraIssueKey} introuvable dans Supabase`);
    return { success: false, error: 'Ticket introuvable' };
  }
  
  // Vérifier si déjà à jour
  if (ticket.created_by === EVA_PROFILE_ID) {
    console.log(`✅ ${jiraIssueKey} - Déjà à jour (created_by = EVA BASSE)`);
    return { success: true, skipped: true };
  }
  
  // Afficher les informations
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', ticket.created_by)
    .maybeSingle();
  
  const currentUserName = currentUser?.full_name || ticket.created_by || 'Inconnu';
  
  if (dryRun) {
    console.log(`🔍 [DRY-RUN] ${jiraIssueKey} - Mise à jour prévue:`);
    console.log(`   Actuel: ${currentUserName}`);
    console.log(`   Nouveau: EVA BASSE`);
    return { success: true, dryRun: true };
  }
  
  // Mettre à jour
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ created_by: EVA_PROFILE_ID })
    .eq('id', ticket.id);
  
  if (updateError) {
    console.error(`❌ Erreur lors de la mise à jour du ticket ${jiraIssueKey}:`, updateError.message);
    return { success: false, error: updateError.message };
  }
  
  console.log(`✅ ${jiraIssueKey} - Mis à jour (${currentUserName} → EVA BASSE)`);
  return { success: true, updated: true };
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🔍 Mise à jour des tickets created_by pour EVA BASSE\n');
  
  if (dryRun) {
    console.log('⚠️  MODE DRY-RUN activé - Aucune modification ne sera effectuée\n');
  }
  
  // 1. Parser le CSV de correspondance
  console.log('📖 Parsing du fichier CSV de correspondance...');
  const correspondanceMap = parseCorrespondanceCSV();
  console.log(`✅ ${correspondanceMap.size} correspondances trouvées\n`);
  
  // 2. Récupérer les clés OBCS
  console.log('📋 Récupération des clés OBCS...');
  const obcsKeys = getOBCSKeys();
  console.log(`✅ ${obcsKeys.length} clés OBCS à traiter:`, obcsKeys.slice(0, 5).join(', '), obcsKeys.length > 5 ? '...' : '');
  console.log('');
  
  // 3. Trouver les clés OD correspondantes
  const odKeys = [];
  const notFound = [];
  
  for (const obcsKey of obcsKeys) {
    const odKey = correspondanceMap.get(obcsKey);
    if (odKey) {
      odKeys.push({ obcsKey, odKey });
    } else {
      notFound.push(obcsKey);
    }
  }
  
  if (notFound.length > 0) {
    console.warn(`⚠️  ${notFound.length} clés OBCS sans correspondance OD:`, notFound.slice(0, 5).join(', '), notFound.length > 5 ? '...' : '');
    console.log('');
  }
  
  if (odKeys.length === 0) {
    console.error('❌ Aucune clé OD trouvée. Arrêt.');
    process.exit(1);
  }
  
  console.log(`✅ ${odKeys.length} clés OD trouvées:\n`);
  odKeys.slice(0, 10).forEach(({ obcsKey, odKey }) => {
    console.log(`   ${obcsKey} → ${odKey}`);
  });
  if (odKeys.length > 10) {
    console.log(`   ... et ${odKeys.length - 10} autres`);
  }
  console.log('');
  
  // 4. Vérifier le profil d'EVA
  console.log('🔍 Vérification du profil d\'EVA BASSE...');
  const { data: evaProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', EVA_PROFILE_ID)
    .single();
  
  if (profileError || !evaProfile) {
    console.error(`❌ Profil d'EVA BASSE introuvable:`, profileError?.message);
    process.exit(1);
  }
  
  console.log(`✅ Profil trouvé: ${evaProfile.full_name} (${evaProfile.email}, ${evaProfile.role})`);
  console.log('');
  
  // 5. Mettre à jour les tickets
  console.log('🔄 Mise à jour des tickets...\n');
  
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const { obcsKey, odKey } of odKeys) {
    const result = await updateTicketCreatedBy(odKey, dryRun);
    
    if (result.success) {
      if (result.skipped) {
        skippedCount++;
      } else {
        successCount++;
      }
    } else {
      errorCount++;
    }
    
    // Petite pause pour éviter de surcharger la DB
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('');
  console.log('📊 RÉSUMÉ:');
  console.log(`   ✅ Mis à jour: ${successCount}`);
  console.log(`   ⏭️  Déjà à jour: ${skippedCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);
  console.log(`   📝 Total: ${odKeys.length}`);
  
  if (notFound.length > 0) {
    console.log(`   ⚠️  Sans correspondance: ${notFound.length}`);
  }
  
  if (dryRun) {
    console.log('');
    console.log('⚠️  Mode DRY-RUN - Aucune modification effectuée');
    console.log('   Relancez sans --dry-run pour appliquer les modifications');
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

