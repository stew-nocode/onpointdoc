#!/usr/bin/env node
/**
 * Script pour appliquer la migration Brevo directement via SQL
 * Exécute le SQL complet en une seule transaction
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function executeSQLDirectly(sql) {
  // Extraire le project ID de l'URL Supabase
  const projectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

  // Utiliser l'API Database de Supabase (PostgreSQL REST API)
  const dbUrl = `${SUPABASE_URL}/rest/v1/`;

  console.log(`🔌 Connexion à Supabase project: ${projectId}\n`);

  try {
    // Alternative: utiliser l'SQL Editor API endpoint si disponible
    const editorUrl = `https://api.supabase.com/v1/projects/${projectId}/database/query`;

    console.log('⚙️  Exécution du SQL via l\'API Supabase...\n');

    const response = await fetch(editorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status}:`);
      console.error(responseText);
      return false;
    }

    console.log('✅ Migration exécutée avec succès!\n');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Application de la migration Brevo via SQL direct\n');
  console.log('━'.repeat(60) + '\n');

  try {
    // Lire le fichier de migration
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251215000000_add_brevo_email_marketing.sql');
    console.log('📁 Lecture de:', migrationPath);

    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`📄 Migration chargée: ${(migrationSQL.length / 1024).toFixed(1)} KB\n`);

    // Afficher un aperçu
    console.log('📋 Contenu de la migration:');
    console.log('   - CREATE TABLE brevo_email_campaigns');
    console.log('   - CREATE TABLE brevo_config');
    console.log('   - Indexes (4)');
    console.log('   - RLS Policies (5)');
    console.log('   - Triggers (2)');
    console.log('\n' + '━'.repeat(60) + '\n');

    // Exécuter la migration
    const success = await executeSQLDirectly(migrationSQL);

    if (success) {
      console.log('🎉 Migration Brevo appliquée avec succès!\n');
      console.log('📝 Prochaines étapes:');
      console.log('   1. ✅ Tables créées: brevo_email_campaigns, brevo_config');
      console.log('   2. 🔄 Régénérer les types TypeScript');
      console.log('   3. 🌐 Tester sur http://localhost:3000/marketing/email');
      console.log('   4. 🔄 Synchroniser les campagnes depuis Brevo\n');
    } else {
      console.log('\n⚠️  La migration n\'a pas pu être appliquée via l\'API.\n');
      console.log('💡 Solution alternative:');
      console.log('   1. Ouvrez: https://supabase.com/dashboard/project/' + SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1] + '/sql/new');
      console.log('   2. Copiez le contenu de: ' + migrationPath);
      console.log('   3. Collez dans le SQL Editor');
      console.log('   4. Cliquez sur "Run"\n');
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
