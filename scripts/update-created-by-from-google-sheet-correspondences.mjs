#!/usr/bin/env node

/**
 * Script pour mettre à jour created_by dans Supabase
 * pour les tickets OD trouvés depuis le Google Sheet
 * 
 * Processus:
 * 1. Lit le fichier JSON avec les correspondances OBCS → OD
 * 2. Pour chaque correspondance, trouve le profil de l'agent
 * 3. Met à jour created_by pour le ticket OD dans Supabase
 * 
 * Usage:
 *   node scripts/update-created-by-from-google-sheet-correspondences.mjs [--dry-run]
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
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
  console.error('❌ Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

const DRY_RUN = process.argv.includes('--dry-run');

// Fichier JSON avec les correspondances
const CORRESPONDENCES_PATH = path.resolve(__dirname, '../docs/ticket/od-correspondences-found-from-sheet.json');

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔄 MISE À JOUR created_by POUR LES TICKETS OD TROUVÉS');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

if (DRY_RUN) {
  console.log('⚠️  MODE DRY-RUN : Aucune modification ne sera effectuée\n');
}

/**
 * Trouve le profile_id d'un agent par son nom
 */
async function findAgentProfileId(agentName) {
  // Noms normalisés pour la recherche
  const searchNames = [
    agentName,
    ...agentName.split(' ').filter(part => part.length > 2)
  ];
  
  for (const searchName of searchNames) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .ilike('full_name', `%${searchName}%`)
      .limit(10);
    
    if (error) {
      console.warn(`⚠️  Erreur lors de la recherche pour "${searchName}":`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      // Trouver la meilleure correspondance
      const exactMatch = data.find(p => p.full_name.toUpperCase() === agentName.toUpperCase());
      if (exactMatch) {
        return exactMatch.id;
      }
      
      // Retourner le premier résultat si un seul
      if (data.length === 1) {
        return data[0].id;
      }
      
      // Afficher les résultats pour choix
      console.log(`\n📋 Profils trouvés pour "${agentName}":`);
      data.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name} (${profile.email}) - ${profile.role} - ID: ${profile.id}`);
      });
      
      // Utiliser le premier résultat
      return data[0].id;
    }
  }
  
  return null;
}

/**
 * Met à jour created_by pour un ticket OD
 */
async function updateTicketCreatedBy(odKey, profileId, agentName, dryRun = false) {
  // Trouver le ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, jira_issue_key, created_by, title')
    .eq('jira_issue_key', odKey)
    .maybeSingle();
  
  if (ticketError) {
    console.error(`❌ Erreur lors de la recherche du ticket ${odKey}:`, ticketError.message);
    return { success: false, error: ticketError.message };
  }
  
  if (!ticket) {
    console.warn(`⚠️  Ticket ${odKey} introuvable dans Supabase`);
    return { success: false, error: 'Ticket introuvable' };
  }
  
  // Vérifier si déjà à jour
  if (ticket.created_by === profileId) {
    console.log(`✅ ${odKey} - Déjà à jour (created_by = ${agentName})`);
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
    console.log(`🔍 [DRY-RUN] ${odKey} - Mise à jour prévue:`);
    console.log(`   Actuel: ${currentUserName}`);
    console.log(`   Nouveau: ${agentName}`);
    return { success: true, dryRun: true };
  }
  
  // Mettre à jour
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ created_by: profileId })
    .eq('id', ticket.id);
  
  if (updateError) {
    console.error(`❌ Erreur lors de la mise à jour du ticket ${odKey}:`, updateError.message);
    return { success: false, error: updateError.message };
  }
  
  console.log(`✅ ${odKey} - Mis à jour (${currentUserName} → ${agentName})`);
  return { success: true, updated: true };
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // 1. Charger les correspondances depuis le JSON
    if (!existsSync(CORRESPONDENCES_PATH)) {
      throw new Error(`Fichier introuvable: ${CORRESPONDENCES_PATH}`);
    }
    
    console.log('📖 Chargement des correspondances depuis le fichier JSON...');
    const correspondencesContent = readFileSync(CORRESPONDENCES_PATH, 'utf-8');
    const correspondences = JSON.parse(correspondencesContent);
    
    if (!Array.isArray(correspondences) || correspondences.length === 0) {
      throw new Error('Aucune correspondance trouvée dans le fichier JSON');
    }
    
    console.log(`✅ ${correspondences.length} correspondances chargées\n`);
    
    // 2. Grouper par agent
    const byAgent = new Map();
    for (const corr of correspondences) {
      if (!byAgent.has(corr.agent)) {
        byAgent.set(corr.agent, []);
      }
      byAgent.get(corr.agent).push(corr);
    }
    
    console.log(`📊 ${byAgent.size} agent(s) concerné(s):\n`);
    for (const [agent, tickets] of byAgent.entries()) {
      console.log(`   • ${agent}: ${tickets.length} ticket(s)`);
    }
    console.log('');
    
    // 3. Pour chaque agent, trouver son profil et mettre à jour les tickets
    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const [agentName, tickets] of byAgent.entries()) {
      console.log(`\n🔍 Traitement de ${agentName} (${tickets.length} ticket(s))...`);
      
      // Trouver le profil de l'agent
      const profileId = await findAgentProfileId(agentName);
      
      if (!profileId) {
        console.error(`❌ Profil introuvable pour "${agentName}". Tickets ignorés.`);
        totalErrors += tickets.length;
        continue;
      }
      
      // Vérifier que le profil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', profileId)
        .single();
      
      if (profileError || !profile) {
        console.error(`❌ Erreur lors de la vérification du profil ${profileId}:`, profileError?.message);
        totalErrors += tickets.length;
        continue;
      }
      
      console.log(`✅ Profil trouvé: ${profile.full_name} (${profile.email}, ${profile.role})\n`);
      
      // Mettre à jour chaque ticket
      for (const corr of tickets) {
        const result = await updateTicketCreatedBy(corr.odKey, profileId, agentName, DRY_RUN);
        
        if (result.success) {
          if (result.skipped) {
            totalSkipped++;
          } else {
            totalSuccess++;
          }
        } else {
          totalErrors++;
        }
        
        // Petite pause pour éviter de surcharger la DB
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ FINAL');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    
    console.log(`✅ Mis à jour: ${totalSuccess}`);
    console.log(`⏭️  Déjà à jour: ${totalSkipped}`);
    console.log(`❌ Erreurs: ${totalErrors}`);
    console.log(`📝 Total: ${correspondences.length}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  Mode DRY-RUN - Aucune modification effectuée');
      console.log('   Relancez sans --dry-run pour appliquer les modifications');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

