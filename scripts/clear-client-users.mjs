#!/usr/bin/env node

/**
 * Script pour vider tous les utilisateurs clients de Supabase
 * 
 * Actions:
 * 1. Sauvegarde les utilisateurs clients actuels (pour référence)
 * 2. Supprime tous les profils avec role='client'
 * 3. Préserve les utilisateurs internes (agents, managers, etc.)
 * 4. Préserve la table jira_sync (correspondance tickets OD ↔ OBCS)
 * 
 * Usage:
 *   node scripts/clear-client-users.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';

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
 * Fonction principale
 */
async function main() {
  try {
    console.log('═'.repeat(80));
    console.log('🧹 VIDAGE DES UTILISATEURS CLIENTS');
    console.log('═'.repeat(80));
    console.log('');

    // 1. Récupérer tous les utilisateurs clients
    console.log('🔍 Récupération des utilisateurs clients...\n');
    const { data: clients, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_id, role, created_at')
      .eq('role', 'client')
      .order('full_name', { ascending: true });

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération: ${fetchError.message}`);
    }

    const clientsCount = clients?.length || 0;
    console.log(`✅ ${clientsCount} utilisateur(s) client(s) trouvé(s)\n`);

    if (clientsCount === 0) {
      console.log('ℹ️  Aucun utilisateur client à supprimer\n');
      return;
    }

    // 2. Sauvegarder les utilisateurs clients
    console.log('💾 Sauvegarde des utilisateurs clients...\n');
    const backupDir = path.resolve(process.cwd(), 'docs/backups');
    mkdirSync(backupDir, { recursive: true });
    
    const backupPath = path.resolve(
      backupDir,
      `clients-backup-${new Date().toISOString().split('T')[0]}.json`
    );

    const backup = {
      date: new Date().toISOString(),
      total: clientsCount,
      clients: clients.map(c => ({
        id: c.id,
        full_name: c.full_name,
        email: c.email,
        company_id: c.company_id,
        created_at: c.created_at
      }))
    };

    writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
    console.log(`   ✅ Sauvegarde créée: ${backupPath}\n`);

    // 3. Vérifier les utilisateurs internes
    console.log('🔍 Vérification des utilisateurs internes...\n');
    const { data: internalUsers, error: internalError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department')
      .neq('role', 'client')
      .order('full_name', { ascending: true });

    if (internalError) {
      throw new Error(`Erreur lors de la vérification: ${internalError.message}`);
    }

    const internalCount = internalUsers?.length || 0;
    console.log(`✅ ${internalCount} utilisateur(s) interne(s) préservé(s)\n`);

    // 4. Vérifier la table jira_sync
    console.log('🔍 Vérification de la table jira_sync...\n');
    const { data: jiraSync, error: jiraSyncError } = await supabase
      .from('jira_sync')
      .select('ticket_id, jira_issue_key, origin')
      .limit(5);

    if (jiraSyncError) {
      console.log(`   ⚠️  Erreur lors de la vérification: ${jiraSyncError.message}`);
      console.log('   ℹ️  La table jira_sync sera préservée (pas de suppression)\n');
    } else {
      const { count } = await supabase
        .from('jira_sync')
        .select('*', { count: 'exact', head: true });
      console.log(`   ✅ Table jira_sync trouvée: ${count || 0} enregistrement(s)`);
      console.log('   ✅ La table jira_sync sera préservée\n');
    }

    // 5. Confirmation et suppression
    console.log('═'.repeat(80));
    console.log('⚠️  CONFIRMATION DE SUPPRESSION');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`📊 Résumé:`);
    console.log(`   - ${clientsCount} utilisateur(s) client(s) à supprimer`);
    console.log(`   - ${internalCount} utilisateur(s) interne(s) à préserver`);
    console.log(`   - Table jira_sync à préserver`);
    console.log('');
    console.log('⚠️  ATTENTION: Cette action est irréversible !');
    console.log('   Les tickets garderont leurs contact_user_id mais les profils n\'existeront plus.\n');

    // 5. Mettre à NULL les références dans les tickets
    console.log('🔄 Mise à jour des références dans les tickets...\n');
    
    const clientIds = clients.map(c => c.id);
    
    // Mettre à NULL assigned_to pour les clients
    const { count: assignedCount, error: assignedError } = await supabase
      .from('tickets')
      .update({ assigned_to: null })
      .in('assigned_to', clientIds)
      .select('id', { count: 'exact', head: true });

    if (assignedError) {
      console.log(`   ⚠️  Erreur lors de la mise à jour assigned_to: ${assignedError.message}`);
    } else {
      console.log(`   ✅ ${assignedCount || 0} ticket(s) mis à jour (assigned_to → NULL)`);
    }

    // Mettre à NULL created_by pour les clients
    const { count: createdCount, error: createdError } = await supabase
      .from('tickets')
      .update({ created_by: null })
      .in('created_by', clientIds)
      .select('id', { count: 'exact', head: true });

    if (createdError) {
      console.log(`   ⚠️  Erreur lors de la mise à jour created_by: ${createdError.message}`);
    } else {
      console.log(`   ✅ ${createdCount || 0} ticket(s) mis à jour (created_by → NULL)`);
    }

    console.log('');

    // 6. Supprimer tous les utilisateurs clients
    console.log('🗑️  Suppression des utilisateurs clients...\n');

    let deletedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Supprimer par batch pour éviter les timeouts
    const batchSize = 50;
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);
      const batchIds = batch.map(c => c.id);

      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .in('id', batchIds);

      if (deleteError) {
        console.error(`   ❌ Erreur lors de la suppression du batch ${Math.floor(i / batchSize) + 1}: ${deleteError.message}`);
        errorCount += batch.length;
        errors.push({ batch: Math.floor(i / batchSize) + 1, error: deleteError.message });
      } else {
        deletedCount += batch.length;
        console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} utilisateur(s) supprimé(s)`);
      }
    }

    console.log('');
    console.log('═'.repeat(80));
    console.log('📊 RÉSULTAT');
    console.log('═'.repeat(80));
    console.log(`   ✅ ${deletedCount} supprimé(s)`);
    console.log(`   ❌ ${errorCount} erreur(s)`);
    console.log('');

    if (errors.length > 0) {
      console.log('❌ Erreurs détaillées:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Batch ${err.batch}: ${err.error}`);
      });
      console.log('');
    }

    // 6. Vérification finale
    console.log('═'.repeat(80));
    console.log('🔍 VÉRIFICATION FINALE');
    console.log('═'.repeat(80));
    console.log('');

    const { data: remainingClients, error: finalError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'client')
      .limit(10);

    if (finalError) {
      throw new Error(`Erreur lors de la vérification: ${finalError.message}`);
    }

    const remainingCount = remainingClients?.length || 0;
    if (remainingCount === 0) {
      console.log('✅ Aucun utilisateur client restant\n');
    } else {
      console.log(`⚠️  ${remainingCount} utilisateur(s) client(s) restant(s) (premiers résultats):`);
      remainingClients.forEach((c, idx) => {
        console.log(`   ${idx + 1}. ${c.full_name} (${c.id})`);
      });
      console.log('');
    }

    // Vérifier les utilisateurs internes
    const { data: finalInternal, error: finalInternalError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department')
      .neq('role', 'client')
      .limit(10);

    if (finalInternalError) {
      console.log(`⚠️  Erreur lors de la vérification des utilisateurs internes: ${finalInternalError.message}\n`);
    } else {
      const finalInternalCount = finalInternal?.length || 0;
      console.log(`✅ ${finalInternalCount} utilisateur(s) interne(s) préservé(s) (premiers résultats):`);
      finalInternal.forEach((u, idx) => {
        console.log(`   ${idx + 1}. ${u.full_name} (${u.role}, ${u.department || 'N/A'})`);
      });
      console.log('');
    }

    // Vérifier jira_sync
    const { count: finalJiraSyncCount } = await supabase
      .from('jira_sync')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Table jira_sync préservée: ${finalJiraSyncCount || 0} enregistrement(s)\n`);

    console.log('═'.repeat(80));
    console.log('✅ Nettoyage terminé');
    console.log('═'.repeat(80));
    console.log('');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Importer les utilisateurs depuis le Google Sheet');
    console.log('   2. Les tickets existants auront des contact_user_id orphelins');
    console.log('   3. Vous pourrez réattacher les tickets lors de l\'import si les noms correspondent\n');

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

