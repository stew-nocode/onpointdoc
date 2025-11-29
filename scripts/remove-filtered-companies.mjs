#!/usr/bin/env node

/**
 * Script pour supprimer les entreprises qui ont été filtrées dans Google Sheets
 * 
 * Entreprises à supprimer selon les filtres :
 * - ROADMAP
 * - CHURN/TEST
 * - TEAM SUPPORT
 * - (et autres si nécessaire)
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

// Liste des entreprises à supprimer (filtrées dans Google Sheets)
const COMPANIES_TO_REMOVE = [
  'ROADMAP',
  'CHURN/TEST',
  'TEAM SUPPORT',
  // Ajouter d'autres si nécessaire
];

async function removeFilteredCompanies() {
  console.log('═'.repeat(80));
  console.log('🗑️  SUPPRESSION DES ENTREPRISES FILTRÉES');
  console.log('═'.repeat(80));
  console.log('');

  console.log(`📋 Entreprises à supprimer: ${COMPANIES_TO_REMOVE.length}`);
  COMPANIES_TO_REMOVE.forEach((name, idx) => {
    console.log(`   ${idx + 1}. ${name}`);
  });
  console.log('');

  let deletedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const companyName of COMPANIES_TO_REMOVE) {
    try {
      // Vérifier si l'entreprise existe
      const { data: existing, error: fetchError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('name', companyName)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        console.log(`   ⏭️  Non trouvée: ${companyName}`);
        notFoundCount++;
        continue;
      }

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Supprimer l'entreprise
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error(`   ❌ Erreur pour "${companyName}": ${deleteError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Supprimée: ${companyName}`);
        deletedCount++;
      }
    } catch (error) {
      console.error(`   ❌ Erreur pour "${companyName}": ${error.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('═'.repeat(80));
  console.log('📊 RÉSULTAT');
  console.log('═'.repeat(80));
  console.log(`   ✅ ${deletedCount} supprimées`);
  console.log(`   ⏭️  ${notFoundCount} non trouvées`);
  console.log(`   ❌ ${errorCount} erreurs`);
  console.log('');

  // Vérification finale
  const { data: remainingCompanies, error: finalError } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true });

  if (finalError) {
    console.error('❌ Erreur lors de la vérification finale:', finalError.message);
    return;
  }

  console.log('═'.repeat(80));
  console.log(`✅ Total d'entreprises restantes: ${remainingCompanies.length}`);
  console.log('═'.repeat(80));
  console.log('');
  console.log('📋 Liste des entreprises restantes:');
  remainingCompanies.forEach((company, idx) => {
    console.log(`   ${idx + 1}. ${company.name}`);
  });
  console.log('');
}

removeFilteredCompanies()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });





