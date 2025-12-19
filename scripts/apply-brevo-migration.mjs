#!/usr/bin/env node
/**
 * Script pour appliquer la migration Brevo via l'API Supabase
 * Utilise le service role key pour exécuter du SQL directement
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
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Créer le client Supabase avec service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Application de la migration Brevo...\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251215000000_add_brevo_email_marketing.sql');
    console.log('📁 Lecture de la migration:', migrationPath);

    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`📄 Migration chargée (${migrationSQL.length} caractères)\n`);

    // Vérifier si les tables existent déjà
    console.log('🔍 Vérification de l\'état actuel...');
    const { data: existingCampaigns, error: checkError } = await supabase
      .from('brevo_email_campaigns')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('⚠️  Les tables Brevo existent déjà. Migration déjà appliquée?\n');
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('Voulez-vous continuer quand même? (o/N) ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'o') {
        console.log('❌ Migration annulée par l\'utilisateur');
        process.exit(0);
      }
    }

    // Exécuter la migration via l'API REST de Supabase
    console.log('⚙️  Exécution de la migration...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (!response.ok) {
      // Si exec_sql n'existe pas, on essaie une approche alternative
      console.log('⚠️  La fonction exec_sql n\'est pas disponible. Exécution par morceaux...\n');

      // Diviser le SQL en statements individuels
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      console.log(`📝 Exécution de ${statements.length} statements SQL...\n`);

      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        process.stdout.write(`[${i + 1}/${statements.length}] `);

        try {
          const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });

          if (error) {
            // Ignorer les erreurs "already exists" qui sont normales avec IF NOT EXISTS
            if (error.message?.includes('already exists') ||
                error.message?.includes('does not exist')) {
              console.log(`⏭️  Skipped (${error.message.substring(0, 50)}...)`);
              skipCount++;
            } else {
              console.error(`❌ Error: ${error.message}`);
              console.error(`   Statement: ${statement.substring(0, 100)}...`);
            }
          } else {
            console.log('✅ Success');
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Exception: ${err.message}`);
        }
      }

      console.log(`\n📊 Résultats: ${successCount} réussis, ${skipCount} ignorés\n`);
    } else {
      console.log('✅ Migration exécutée avec succès!\n');
    }

    // Vérifier que les tables ont été créées
    console.log('🔍 Vérification des tables créées...');

    const { error: campaignsError } = await supabase
      .from('brevo_email_campaigns')
      .select('id')
      .limit(1);

    const { error: configError } = await supabase
      .from('brevo_config')
      .select('id')
      .limit(1);

    if (!campaignsError && !configError) {
      console.log('✅ Table brevo_email_campaigns - OK');
      console.log('✅ Table brevo_config - OK\n');
      console.log('🎉 Migration Brevo appliquée avec succès!\n');
      console.log('📝 Prochaines étapes:');
      console.log('   1. Régénérer les types TypeScript');
      console.log('   2. Tester l\'intégration sur /marketing/email');
      console.log('   3. Synchroniser les campagnes depuis Brevo\n');
    } else {
      console.log('⚠️  Problème de vérification:');
      if (campaignsError) console.log('   - brevo_email_campaigns:', campaignsError.message);
      if (configError) console.log('   - brevo_config:', configError.message);
      console.log('\n💡 Les tables peuvent exister mais avec des permissions RLS restrictives.');
      console.log('   Vérifiez manuellement dans le dashboard Supabase.\n');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter la migration
applyMigration();
