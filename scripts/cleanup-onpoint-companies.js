/* eslint-disable no-console */
/**
 * Script de nettoyage des entreprises ONPOINT
 * 
 * Actions:
 * 1. Vérifie les dépendances (profiles, tickets) des entreprises à supprimer
 * 2. Transfère les dépendances vers ONPOINT AFRICA GROUP si nécessaire
 * 3. Supprime ONPOINT et ONPOINT AFRICA
 * 4. Met à jour le JIRA ID de ONPOINT AFRICA GROUP (10028)
 * 
 * Usage: node scripts/cleanup-onpoint-companies.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function cleanupOnpointCompanies() {
  console.log(`\n🔍 Recherche des entreprises ONPOINT...\n`);

  const { data: companies, error: companyErr } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .ilike('name', '%onpoint%')
    .order('name', { ascending: true });

  if (companyErr) {
    console.error(`❌ Erreur lors de la recherche: ${companyErr.message}`);
    process.exit(1);
  }

  if (!companies || companies.length === 0) {
    console.error(`❌ Aucune entreprise ONPOINT trouvée`);
    process.exit(1);
  }

  // Trouver ONPOINT AFRICA GROUP
  const onpointAfricaGroup = companies.find((c) =>
    c.name.toLowerCase().includes('onpoint africa group')
  );

  if (!onpointAfricaGroup) {
    console.error(`❌ ONPOINT AFRICA GROUP non trouvée`);
    process.exit(1);
  }

  // Trouver les entreprises à supprimer
  const toDelete = companies.filter((c) => c.id !== onpointAfricaGroup.id);

  if (toDelete.length === 0) {
    console.log(`✅ Aucune entreprise à supprimer. ONPOINT AFRICA GROUP est la seule entreprise ONPOINT.`);
    
    // Vérifier et mettre à jour le JIRA ID si nécessaire
    if (onpointAfricaGroup.jira_company_id !== '10028') {
      console.log(`\n🔄 Mise à jour du JIRA ID de ONPOINT AFRICA GROUP...`);
      const { error: updateErr } = await supabase
        .from('companies')
        .update({ jira_company_id: '10028' })
        .eq('id', onpointAfricaGroup.id);

      if (updateErr) {
        console.error(`❌ Erreur lors de la mise à jour: ${updateErr.message}`);
        process.exit(1);
      }
      console.log(`✅ JIRA ID mis à jour: 10028`);
    } else {
      console.log(`✅ JIRA ID déjà correct: 10028`);
    }
    
    process.exit(0);
  }

  console.log(`📋 Entreprises trouvées:`);
  console.log(`   ✅ À conserver: ${onpointAfricaGroup.name} (ID: ${onpointAfricaGroup.id})`);
  toDelete.forEach((c) => {
    console.log(`   ❌ À supprimer: ${c.name} (ID: ${c.id})`);
  });
  console.log('');

  // Vérifier les dépendances pour chaque entreprise à supprimer
  console.log(`🔍 Vérification des dépendances...\n`);

  for (const company of toDelete) {
    // Vérifier les profiles (contacts clients)
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('company_id', company.id);

    if (profilesErr) {
      console.error(`❌ Erreur lors de la vérification des profiles pour ${company.name}: ${profilesErr.message}`);
      continue;
    }

    const profilesCount = profiles?.length || 0;
    if (profilesCount > 0) {
      console.log(`   ⚠️  ${company.name}: ${profilesCount} contact(s) client(s) trouvé(s)`);
      
      // Transférer vers ONPOINT AFRICA GROUP
      const { error: transferErr } = await supabase
        .from('profiles')
        .update({ company_id: onpointAfricaGroup.id })
        .eq('company_id', company.id);

      if (transferErr) {
        console.error(`   ❌ Erreur lors du transfert: ${transferErr.message}`);
        continue;
      }
      console.log(`   ✅ ${profilesCount} contact(s) transféré(s) vers ONPOINT AFRICA GROUP`);
    }

    // Vérifier les tickets
    const { count: ticketsCount, error: ticketsErr } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id);

    if (ticketsErr) {
      console.error(`❌ Erreur lors de la vérification des tickets pour ${company.name}: ${ticketsErr.message}`);
      continue;
    }

    const totalTickets = ticketsCount || 0;
    if (totalTickets > 0) {
      console.log(`   ⚠️  ${company.name}: ${totalTickets} ticket(s) trouvé(s)`);
      
      // Transférer vers ONPOINT AFRICA GROUP
      const { error: transferTicketsErr } = await supabase
        .from('tickets')
        .update({ company_id: onpointAfricaGroup.id })
        .eq('company_id', company.id);

      if (transferTicketsErr) {
        console.error(`   ❌ Erreur lors du transfert des tickets: ${transferTicketsErr.message}`);
        continue;
      }
      console.log(`   ✅ ${totalTickets} ticket(s) transféré(s) vers ONPOINT AFRICA GROUP`);
    }
  }

  console.log(`\n🗑️  Suppression des entreprises...\n`);

  // Supprimer les entreprises
  for (const company of toDelete) {
    const { error: deleteErr } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id);

    if (deleteErr) {
      console.error(`❌ Erreur lors de la suppression de ${company.name}: ${deleteErr.message}`);
    } else {
      console.log(`✅ ${company.name} supprimée`);
    }
  }

  // Mettre à jour le JIRA ID de ONPOINT AFRICA GROUP
  console.log(`\n🔄 Mise à jour du JIRA ID de ONPOINT AFRICA GROUP...`);

  const { error: updateErr } = await supabase
    .from('companies')
    .update({ jira_company_id: '10028' })
    .eq('id', onpointAfricaGroup.id);

  if (updateErr) {
    console.error(`❌ Erreur lors de la mise à jour: ${updateErr.message}`);
    process.exit(1);
  }

  console.log(`✅ JIRA ID mis à jour: 10028`);

  // Vérification finale
  const { data: finalCheck } = await supabase
    .from('companies')
    .select('id, name, jira_company_id')
    .eq('id', onpointAfricaGroup.id)
    .single();

  console.log(`\n📊 Résultat final:`);
  console.log(`   ✅ Entreprise: ${finalCheck?.name}`);
  console.log(`   ✅ ID: ${finalCheck?.id}`);
  console.log(`   ✅ JIRA ID: ${finalCheck?.jira_company_id || 'Non défini'}`);
  console.log(`\n✨ Nettoyage terminé!\n`);
}

cleanupOnpointCompanies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

