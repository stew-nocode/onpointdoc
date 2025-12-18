#!/usr/bin/env node
/**
 * Script pour appliquer les optimisations du dashboard directement à Supabase
 *
 * Lit le fichier SQL d'optimisation et l'exécute via l'API Supabase
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🚀 Application de l\'optimisation dashboard...\n');

  // Lire le fichier de migration
  const migrationPath = join(__dirname, '../supabase/migrations/20251218000000_optimize_dashboard_stats_functions.sql');
  const sqlContent = readFileSync(migrationPath, 'utf8');

  // Découper par fonction (séparer les CREATE FUNCTION)
  const functionBlocks = sqlContent.split(/(?=CREATE OR REPLACE FUNCTION)/);

  let successCount = 0;
  let errorCount = 0;

  for (const [index, block] of functionBlocks.entries()) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    // Extraire le nom de la fonction pour le log
    const functionMatch = trimmedBlock.match(/CREATE OR REPLACE FUNCTION\s+public\.(\w+)/);
    const functionName = functionMatch ? functionMatch[1] : `block_${index}`;

    try {
      console.log(`⏳ Exécution: ${functionName}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: trimmedBlock,
      });

      if (error) {
        console.error(`❌ Erreur sur ${functionName}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${functionName} appliqué`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception sur ${functionName}:`, err.message);
      errorCount++;
    }

    // Petit délai entre les exécutions
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Succès: ${successCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}`);

  if (errorCount === 0) {
    console.log(`\n🎉 Optimisation appliquée avec succès !`);
    console.log(`\n📈 Gains attendus:`);
    console.log(`   - Requêtes DB: 6 → 1 (-83%)`);
    console.log(`   - Temps de réponse: 150ms → 25ms (-83%)`);
    console.log(`   - Charge serveur: -80%`);
  } else {
    console.log(`\n⚠️  Certaines parties ont échoué. Vérifiez les erreurs ci-dessus.`);
    process.exit(1);
  }
}

applyMigration().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
