#!/usr/bin/env node
/**
 * Script de test de l'intégration Brevo
 * Vérifie que les tables sont créées et accessibles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🧪 Test de l\'intégration Brevo\n');
console.log('━'.repeat(60) + '\n');

async function testIntegration() {
  let allTestsPassed = true;

  // Test 1: Vérifier que brevo_email_campaigns existe
  console.log('📋 Test 1: Table brevo_email_campaigns');
  try {
    const { data, error } = await supabase
      .from('brevo_email_campaigns')
      .select('id')
      .limit(1);

    if (error) {
      console.log('   ❌ Erreur:', error.message);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Table accessible');
      console.log(`   📊 Campagnes actuelles: ${data?.length || 0}`);
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    allTestsPassed = false;
  }

  console.log();

  // Test 2: Vérifier que brevo_config existe
  console.log('📋 Test 2: Table brevo_config');
  try {
    const { data, error } = await supabase
      .from('brevo_config')
      .select('id, is_active')
      .limit(1);

    if (error) {
      console.log('   ❌ Erreur:', error.message);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Table accessible');
      console.log(`   📊 Configurations: ${data?.length || 0}`);
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    allTestsPassed = false;
  }

  console.log();

  // Test 3: Vérifier le département Marketing
  console.log('📋 Test 3: Département Marketing (MKT)');
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code, color')
      .eq('code', 'MKT')
      .single();

    if (error) {
      console.log('   ❌ Erreur:', error.message);
      allTestsPassed = false;
    } else if (!data) {
      console.log('   ⚠️  Département Marketing non trouvé');
      allTestsPassed = false;
    } else {
      console.log('   ✅ Département trouvé');
      console.log(`   📝 Name: ${data.name}`);
      console.log(`   🏷️  Code: ${data.code}`);
      console.log(`   🎨 Color: ${data.color}`);
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    allTestsPassed = false;
  }

  console.log();

  // Test 4: Vérifier la variable d'environnement BREVO_API_KEY
  console.log('📋 Test 4: Configuration Brevo');
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoApiUrl = process.env.BREVO_API_URL;

  if (!brevoApiKey || brevoApiKey === 'VOTRE_CLE_API_BREVO_ICI') {
    console.log('   ⚠️  BREVO_API_KEY non configurée dans .env.local');
    console.log('   💡 Ajoutez votre clé API Brevo pour activer l\'intégration');
  } else {
    console.log('   ✅ BREVO_API_KEY configurée');
    console.log(`   🔗 API URL: ${brevoApiUrl}`);
  }

  console.log();
  console.log('━'.repeat(60));

  if (allTestsPassed) {
    console.log('\n✅ Tous les tests sont passés!\n');
    console.log('🎉 L\'intégration Brevo est prête!\n');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Configurez votre clé API Brevo dans .env.local');
    console.log('   2. Accédez à http://localhost:3000/marketing/email');
    console.log('   3. Synchronisez vos campagnes depuis Brevo\n');
  } else {
    console.log('\n❌ Certains tests ont échoué\n');
    console.log('💡 Vérifiez que la migration a été correctement appliquée');
    console.log('   dans le SQL Editor de Supabase\n');
    process.exit(1);
  }
}

testIntegration();
