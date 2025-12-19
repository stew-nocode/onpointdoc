#!/usr/bin/env node

/**
 * Script pour nettoyer les doublons d'utilisateurs clients dans Supabase
 * 
 * Actions:
 * 1. Supprime tous les profils "À SUPPRIMER" (Edwige KOUASSI clients marqués)
 * 2. Fusionne les autres doublons en gardant le profil le plus complet
 * 
 * Usage:
 *   node scripts/clean-duplicate-users.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

/**
 * Trouve le profil à garder parmi plusieurs doublons
 */
function findBestProfile(profiles) {
  // Priorité : profil avec email ET entreprise > profil avec email > profil avec entreprise > premier profil
  return profiles.reduce((best, current) => {
    const bestScore = (best.email ? 2 : 0) + (best.company_id ? 1 : 0);
    const currentScore = (current.email ? 2 : 0) + (current.company_id ? 1 : 0);
    
    if (currentScore > bestScore) {
      return current;
    }
    return best;
  });
}

/**
 * Met à jour toutes les références d'un profil vers un autre
 */
async function mergeProfiles(sourceId, targetId) {
  const tablesToUpdate = [
    { table: 'tickets', column: 'contact_user_id', name: 'Tickets (contact)' },
    { table: 'tickets', column: 'created_by', name: 'Tickets (créateur)' },
    { table: 'tickets', column: 'assigned_to', name: 'Tickets (assigné)' },
    { table: 'ticket_comments', column: 'user_id', name: 'Commentaires' },
    { table: 'ticket_status_history', column: 'changed_by', name: 'Historique statuts' },
    { table: 'user_module_assignments', column: 'user_id', name: 'Affectations modules' },
    { table: 'activities', column: 'created_by', name: 'Activités (créateur)' },
    { table: 'activity_participants', column: 'user_id', name: 'Participants activités' },
    { table: 'tasks', column: 'assigned_to', name: 'Tâches (assigné)' },
    { table: 'tasks', column: 'created_by', name: 'Tâches (créateur)' },
  ];

  let totalUpdated = 0;

  for (const { table, column, name } of tablesToUpdate) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update({ [column]: targetId })
        .eq(column, sourceId)
        .select('id');

      if (error) {
        // Ignorer les erreurs si la colonne n'existe pas
        if (!error.message.includes('column') && !error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${name}: ${error.message}`);
        }
      } else {
        const count = data?.length || 0;
        if (count > 0) {
          totalUpdated += count;
        }
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement
    }
  }

  return totalUpdated;
}

/**
 * Supprime un profil
 */
async function deleteProfile(profileId) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('═'.repeat(80));
    console.log('🧹 NETTOYAGE DES DOUBLONS D\'UTILISATEURS');
    console.log('═'.repeat(80));
    console.log('');

    // 1. Récupérer tous les profils clients
    console.log('🔍 Récupération des profils clients...\n');
    const { data: clients, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_id, role')
      .eq('role', 'client')
      .order('full_name', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }

    console.log(`✅ ${clients.length} profils clients trouvés\n`);

    // 2. Détecter les doublons
    console.log('🔍 Détection des doublons...\n');
    const nameMap = new Map();
    const duplicates = [];

    clients.forEach(client => {
      if (!client.full_name) return;
      
      const normalizedName = client.full_name.trim().toUpperCase();
      
      if (nameMap.has(normalizedName)) {
        const existing = nameMap.get(normalizedName);
        if (!duplicates.find(d => d.name === normalizedName)) {
          duplicates.push({
            name: normalizedName,
            profiles: [existing, client]
          });
        } else {
          const dup = duplicates.find(d => d.name === normalizedName);
          dup.profiles.push(client);
        }
      } else {
        nameMap.set(normalizedName, client);
      }
    });

    console.log(`📊 ${duplicates.length} groupe(s) de doublons détecté(s)\n`);

    // 3. Séparer les "À SUPPRIMER" des autres doublons
    const toDelete = [];
    const toMerge = [];

    duplicates.forEach(dup => {
      if (dup.name === 'À SUPPRIMER') {
        toDelete.push(...dup.profiles);
      } else {
        toMerge.push(dup);
      }
    });

    console.log('═'.repeat(80));
    console.log('🗑️  SUPPRESSION DES PROFILS "À SUPPRIMER"');
    console.log('═'.repeat(80));
    console.log('');

    if (toDelete.length === 0) {
      console.log('✅ Aucun profil "À SUPPRIMER" à supprimer\n');
    } else {
      console.log(`📋 ${toDelete.length} profil(s) "À SUPPRIMER" à supprimer\n`);

      let deletedCount = 0;
      let errorCount = 0;

      for (const profile of toDelete) {
        try {
          await deleteProfile(profile.id);
          console.log(`   ✅ Supprimé: ${profile.id}`);
          deletedCount++;
        } catch (error) {
          console.error(`   ❌ Erreur pour ${profile.id}: ${error.message}`);
          errorCount++;
        }
      }

      console.log(`\n   📊 Résultat: ${deletedCount} supprimé(s), ${errorCount} erreur(s)\n`);
    }

    // 4. Fusionner les autres doublons
    console.log('═'.repeat(80));
    console.log('🔄 FUSION DES AUTRES DOUBLONS');
    console.log('═'.repeat(80));
    console.log('');

    if (toMerge.length === 0) {
      console.log('✅ Aucun doublon à fusionner\n');
    } else {
      console.log(`📋 ${toMerge.length} groupe(s) de doublons à fusionner\n`);

      let mergedCount = 0;
      let deletedCount = 0;
      let errorCount = 0;

      for (const dup of toMerge) {
        try {
          // Trouver le meilleur profil à garder
          const bestProfile = findBestProfile(dup.profiles);
          const profilesToDelete = dup.profiles.filter(p => p.id !== bestProfile.id);

          console.log(`\n   📋 "${dup.name}":`);
          console.log(`      ✅ À garder: ${bestProfile.id} (Email: ${bestProfile.email || 'N/A'}, Entreprise: ${bestProfile.company_id || 'N/A'})`);

          // Fusionner les autres profils
          for (const profile of profilesToDelete) {
            try {
              const updated = await mergeProfiles(profile.id, bestProfile.id);
              await deleteProfile(profile.id);
              console.log(`      🗑️  Fusionné et supprimé: ${profile.id} (${updated} référence(s) mise(s) à jour)`);
              deletedCount++;
              mergedCount++;
            } catch (error) {
              console.error(`      ❌ Erreur pour ${profile.id}: ${error.message}`);
              errorCount++;
            }
          }
        } catch (error) {
          console.error(`   ❌ Erreur pour "${dup.name}": ${error.message}`);
          errorCount++;
        }
      }

      console.log(`\n   📊 Résultat:`);
      console.log(`      ✅ ${mergedCount} fusionné(s)`);
      console.log(`      🗑️  ${deletedCount} supprimé(s)`);
      console.log(`      ❌ ${errorCount} erreur(s)\n`);
    }

    // 5. Vérification finale
    console.log('═'.repeat(80));
    console.log('🔍 VÉRIFICATION FINALE');
    console.log('═'.repeat(80));
    console.log('');

    const { data: finalClients, error: finalError } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_id')
      .eq('role', 'client')
      .order('full_name', { ascending: true });

    if (finalError) {
      throw new Error(`Erreur lors de la vérification: ${finalError.message}`);
    }

    // Vérifier s'il reste des doublons
    const finalNameMap = new Map();
    const remainingDuplicates = [];

    finalClients.forEach(client => {
      if (!client.full_name) return;
      const normalizedName = client.full_name.trim().toUpperCase();
      if (normalizedName === 'À SUPPRIMER') {
        remainingDuplicates.push(client);
      } else if (nameMap.has(normalizedName)) {
        const existing = nameMap.get(normalizedName);
        if (!remainingDuplicates.find(d => d.name === normalizedName)) {
          remainingDuplicates.push({
            name: normalizedName,
            profiles: [existing, client]
          });
        }
      } else {
        nameMap.set(normalizedName, client);
      }
    });

    console.log(`✅ Total de profils clients restants: ${finalClients.length}`);
    if (remainingDuplicates.length > 0) {
      console.log(`⚠️  ${remainingDuplicates.length} doublon(s) restant(s) (à vérifier manuellement)\n`);
    } else {
      console.log('✅ Aucun doublon restant\n');
    }

    console.log('═'.repeat(80));
    console.log('✅ Nettoyage terminé');
    console.log('═'.repeat(80));
    console.log('');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });





