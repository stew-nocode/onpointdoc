#!/usr/bin/env node

/**
 * Script pour fusionner ONPOINT avec ONPOINT AFRICA GROUP
 * 
 * Actions:
 * 1. Récupère les IDs des deux entreprises
 * 2. Met à jour toutes les références de ONPOINT vers ONPOINT AFRICA GROUP
 * 3. Supprime l'entreprise ONPOINT
 * 
 * Usage:
 *   node scripts/merge-onpoint-companies.mjs
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

async function mergeOnpointCompanies() {
  console.log('═'.repeat(80));
  console.log('🔄 FUSION DES ENTREPRISES ONPOINT');
  console.log('═'.repeat(80));
  console.log('');

  // 1. Récupérer les deux entreprises
  console.log('🔍 Récupération des entreprises...\n');

  const { data: onpoint, error: onpointError } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .eq('name', 'ONPOINT')
    .single();

  if (onpointError && onpointError.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la récupération de ONPOINT: ${onpointError.message}`);
  }

  const { data: onpointAfricaGroup, error: onpointAfricaGroupError } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .eq('name', 'ONPOINT AFRICA GROUP')
    .single();

  if (onpointAfricaGroupError) {
    throw new Error(`Erreur lors de la récupération de ONPOINT AFRICA GROUP: ${onpointAfricaGroupError.message}`);
  }

  if (!onpoint) {
    console.log('ℹ️  ONPOINT n\'existe pas dans Supabase, rien à fusionner\n');
    return;
  }

  console.log(`✅ ONPOINT trouvé (ID: ${onpoint.id})`);
  console.log(`✅ ONPOINT AFRICA GROUP trouvé (ID: ${onpointAfricaGroup.id})\n`);

  // 2. Compter les références avant la fusion
  console.log('📊 Comptage des références...\n');

  const tablesToUpdate = [
    { table: 'tickets', column: 'company_id', name: 'Tickets' },
    { table: 'profiles', column: 'company_id', name: 'Profils' },
    { table: 'activities', column: 'company_id', name: 'Activités' },
    { table: 'tasks', column: 'company_id', name: 'Tâches' },
  ];

  const counts = {};
  for (const { table, column, name } of tablesToUpdate) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(column, onpoint.id);

    if (error) {
      console.log(`   ⚠️  ${name}: Erreur lors du comptage (${error.message})`);
      counts[table] = 0;
    } else {
      counts[table] = count || 0;
      console.log(`   📋 ${name}: ${count || 0} référence(s)`);
    }
  }

  const totalReferences = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log(`\n   📊 Total: ${totalReferences} référence(s) à mettre à jour\n`);

  if (totalReferences === 0) {
    console.log('ℹ️  Aucune référence trouvée, suppression directe de ONPOINT\n');
  } else {
    // 3. Mettre à jour les références
    console.log('🔄 Mise à jour des références...\n');

    let updatedCount = 0;
    let errorCount = 0;

    for (const { table, column, name } of tablesToUpdate) {
      if (counts[table] === 0) continue;

      const { data, error } = await supabase
        .from(table)
        .update({ [column]: onpointAfricaGroup.id })
        .eq(column, onpoint.id)
        .select('id');

      if (error) {
        console.error(`   ❌ Erreur pour ${name}: ${error.message}`);
        errorCount++;
      } else {
        const count = data?.length || 0;
        console.log(`   ✅ ${name}: ${count} référence(s) mise(s) à jour`);
        updatedCount += count;
      }
    }

    console.log(`\n   📊 Résultat: ${updatedCount} mise(s) à jour, ${errorCount} erreur(s)\n`);
  }

  // 4. Supprimer l'entreprise ONPOINT
  console.log('🗑️  Suppression de l\'entreprise ONPOINT...\n');

  const { error: deleteError } = await supabase
    .from('companies')
    .delete()
    .eq('id', onpoint.id);

  if (deleteError) {
    throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
  }

  console.log('   ✅ ONPOINT supprimée\n');

  // 5. Vérification finale
  console.log('═'.repeat(80));
  console.log('🔍 VÉRIFICATION FINALE');
  console.log('═'.repeat(80));
  console.log('');

  const { data: finalCompanies, error: finalError } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .in('name', ['ONPOINT', 'ONPOINT AFRICA GROUP'])
    .order('name', { ascending: true });

  if (finalError) {
    throw new Error(`Erreur lors de la vérification: ${finalError.message}`);
  }

  if (finalCompanies.length === 1 && finalCompanies[0].name === 'ONPOINT AFRICA GROUP') {
    console.log('✅ Fusion réussie !');
    console.log(`   - ONPOINT AFRICA GROUP (ID: ${finalCompanies[0].id})`);
    console.log(`   - JIRA ID: ${finalCompanies[0].jira_company_id || 'Non renseigné'}\n`);
  } else {
    console.log('⚠️  État inattendu:');
    finalCompanies.forEach(c => {
      console.log(`   - ${c.name} (ID: ${c.id})`);
    });
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log('✅ Fusion terminée avec succès');
  console.log('═'.repeat(80));
  console.log('');
  console.log('📝 Note: Vous devrez mettre à jour manuellement le Google Sheet');
  console.log('   pour remplacer "ONPOINT" par "ONPOINT AFRICA GROUP"\n');
}

mergeOnpointCompanies()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });





