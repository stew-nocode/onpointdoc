#!/usr/bin/env node

/**
 * Script pour fusionner les doublons de Marius KOFFI
 * 
 * Garde le profil avec l'email (Marius KOFFI - mkoffi@onpoinafrica.com)
 * et fusionne les autres (MARIUS, MONSIEUR KOFFI MARIUS)
 * 
 * Usage:
 *   node scripts/merge-marius-koffi-duplicates.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
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

async function mergeMariusKoffiDuplicates() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('🔧 FUSION DES DOUBLONS MARIUS KOFFI');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // 1. Identifier les profils à fusionner
  console.log('🔍 Recherche des profils MARIUS KOFFI...');
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, full_name, email, company_id, role, created_at')
    .eq('role', 'client')
    .in('id', [
      'a39a35b6-ab47-4d62-b2ef-19d385971b49', // Marius KOFFI (avec email) - À GARDER
      'f95be315-9ed7-4d33-864b-da5de7fae02d', // MARIUS (sans email) - À FUSIONNER
      '2cbaec33-9ee5-4ab1-9d56-01ee9b92b7d0'  // MONSIEUR KOFFI MARIUS (sans email) - À FUSIONNER
    ]);

  if (fetchError) {
    console.error('❌ Erreur lors de la récupération des profils:', fetchError.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Aucun profil trouvé');
    return;
  }

  // Identifier le profil à garder (celui avec l'email)
  const profileToKeep = profiles.find(p => p.email && p.email.trim() !== '');
  const profilesToMerge = profiles.filter(p => p.id !== profileToKeep?.id);

  if (!profileToKeep) {
    console.error('❌ Aucun profil avec email trouvé pour garder');
    process.exit(1);
  }

  console.log(`✅ Profil à garder: ${profileToKeep.full_name} (${profileToKeep.email})`);
  console.log(`📋 Profils à fusionner: ${profilesToMerge.length}`);
  profilesToMerge.forEach(p => {
    console.log(`   - ${p.full_name} (${p.email || 'pas d\'email'})`);
  });
  console.log('');

  // 2. Compter les références dans les tickets
  console.log('🔍 Vérification des références dans les tickets...');
  const duplicateIds = profilesToMerge.map(p => p.id);
  
  const { count: ticketsCount, error: ticketsError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('contact_user_id', duplicateIds);

  if (ticketsError) {
    console.error('❌ Erreur lors de la vérification des tickets:', ticketsError.message);
    process.exit(1);
  }

  console.log(`   📊 ${ticketsCount || 0} ticket(s) référencent les profils à fusionner\n`);

  // 3. Mettre à jour les références dans les tickets
  if (ticketsCount > 0) {
    console.log('🔄 Mise à jour des références dans les tickets...');
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ contact_user_id: profileToKeep.id })
      .in('contact_user_id', duplicateIds);

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour des tickets:', updateError.message);
      process.exit(1);
    }

    console.log(`   ✅ ${ticketsCount} ticket(s) mis à jour\n`);
  }

  // 4. Vérifier d'autres références possibles (ticket_comments, etc.)
  console.log('🔍 Vérification des autres références...');
  
  // Vérifier ticket_comments
  const { count: commentsCount } = await supabase
    .from('ticket_comments')
    .select('*', { count: 'exact', head: true })
    .in('user_id', duplicateIds);

  if (commentsCount > 0) {
    console.log(`   📊 ${commentsCount} commentaire(s) à mettre à jour`);
    const { error: commentsError } = await supabase
      .from('ticket_comments')
      .update({ user_id: profileToKeep.id })
      .in('user_id', duplicateIds);

    if (commentsError) {
      console.error('❌ Erreur lors de la mise à jour des commentaires:', commentsError.message);
    } else {
      console.log(`   ✅ ${commentsCount} commentaire(s) mis à jour`);
    }
  }

  // Vérifier ticket_status_history
  const { count: statusHistoryCount } = await supabase
    .from('ticket_status_history')
    .select('*', { count: 'exact', head: true })
    .in('changed_by', duplicateIds);

  if (statusHistoryCount > 0) {
    console.log(`   📊 ${statusHistoryCount} historique(s) de statut à mettre à jour`);
    const { error: statusError } = await supabase
      .from('ticket_status_history')
      .update({ changed_by: profileToKeep.id })
      .in('changed_by', duplicateIds);

    if (statusError) {
      console.error('❌ Erreur lors de la mise à jour de l\'historique:', statusError.message);
    } else {
      console.log(`   ✅ ${statusHistoryCount} historique(s) mis à jour`);
    }
  }

  console.log('');

  // 5. Supprimer les profils doublons
  console.log('🗑️  Suppression des profils doublons...');
  for (const profile of profilesToMerge) {
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id);

    if (deleteError) {
      console.error(`❌ Erreur lors de la suppression de ${profile.full_name}:`, deleteError.message);
    } else {
      console.log(`   ✅ Profil supprimé: ${profile.full_name}`);
    }
  }

  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log(`   ✅ Profil conservé: ${profileToKeep.full_name} (${profileToKeep.email})`);
  console.log(`   🔄 Profils fusionnés: ${profilesToMerge.length}`);
  console.log(`   📊 Tickets mis à jour: ${ticketsCount || 0}`);
  console.log(`   📊 Commentaires mis à jour: ${commentsCount || 0}`);
  console.log(`   📊 Historiques mis à jour: ${statusHistoryCount || 0}`);
  console.log('');

  console.log('✅ Fusion terminée');
}

// Exécuter la fusion
mergeMariusKoffiDuplicates().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});





