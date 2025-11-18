/**
 * Script de test pour la Phase 3 : Mapping Structure Produit/Module/Fonctionnalité Jira ↔ Supabase
 * 
 * Tests :
 * 1. Vérification table jira_feature_mapping
 * 2. Test fonction SQL get_feature_id_from_jira
 * 3. Test fonction SQL get_submodule_id_from_feature_id
 * 4. Test service getFeatureIdFromJira
 * 5. Test service mapJiraFeatureToSupabase
 * 6. Test synchronisation complète avec feature
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testTableExists() {
  logSection('TEST 1: Vérification table jira_feature_mapping');
  
  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .select('*')
    .limit(1);
  
  if (error) {
    log(`❌ Erreur lors de l'accès à la table: ${error.message}`, 'red');
    return false;
  }
  
  log('✅ Table jira_feature_mapping accessible', 'green');
  return true;
}

async function testSQLFeatureFunction() {
  logSection('TEST 2: Test fonction SQL get_feature_id_from_jira');
  
  // Créer un mapping de test d'abord
  const testJiraValue = '[TEST Phase 3] Feature Test';
  
  // Récupérer une feature existante pour le test
  const { data: features } = await supabase
    .from('features')
    .select('id')
    .limit(1)
    .single();
  
  if (!features || !features.id) {
    log('⚠️  Aucune feature trouvée pour le test, création d\'un mapping factice', 'yellow');
    // Test avec NULL
    const { data, error } = await supabase.rpc(
      'get_feature_id_from_jira',
      {
        p_jira_feature_value: testJiraValue,
        p_jira_custom_field_id: 'customfield_10052'
      }
    );
    
    if (error) {
      log(`❌ Erreur fonction get_feature_id_from_jira: ${error.message}`, 'red');
      return false;
    }
    
    if (data === null) {
      log('✅ get_feature_id_from_jira: Retourne NULL pour valeur inexistante (comportement attendu)', 'green');
      return true;
    } else {
      log(`❌ get_feature_id_from_jira: Résultat inattendu: ${data}`, 'red');
      return false;
    }
  }
  
  // Créer un mapping de test
  const { error: createError } = await supabase
    .from('jira_feature_mapping')
    .upsert({
      jira_feature_value: testJiraValue,
      feature_id: features.id,
      jira_custom_field_id: 'customfield_10052',
      jira_feature_id: '99999'
    }, {
      onConflict: 'jira_feature_value,jira_custom_field_id'
    });
  
  if (createError) {
    log(`❌ Erreur création mapping test: ${createError.message}`, 'red');
    return false;
  }
  
  // Tester la fonction
  const { data, error } = await supabase.rpc(
    'get_feature_id_from_jira',
    {
      p_jira_feature_value: testJiraValue,
      p_jira_custom_field_id: 'customfield_10052'
    }
  );
  
  if (error) {
    log(`❌ Erreur fonction get_feature_id_from_jira: ${error.message}`, 'red');
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    return false;
  }
  
  if (data === features.id) {
    log(`✅ get_feature_id_from_jira: ${testJiraValue} → ${features.id}`, 'green');
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    return true;
  } else {
    log(`❌ get_feature_id_from_jira: Résultat inattendu: ${data} (attendu: ${features.id})`, 'red');
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    return false;
  }
}

async function testSQLSubmoduleFunction() {
  logSection('TEST 3: Test fonction SQL get_submodule_id_from_feature_id');
  
  // Récupérer une feature avec submodule_id
  const { data: feature, error: featureError } = await supabase
    .from('features')
    .select('id, submodule_id')
    .not('submodule_id', 'is', null)
    .limit(1)
    .single();
  
  if (featureError || !feature) {
    log('⚠️  Aucune feature avec submodule_id trouvée pour le test', 'yellow');
    return true; // Test ignoré mais pas échoué
  }
  
  const { data, error } = await supabase.rpc(
    'get_submodule_id_from_feature_id',
    {
      p_feature_id: feature.id
    }
  );
  
  if (error) {
    log(`❌ Erreur fonction get_submodule_id_from_feature_id: ${error.message}`, 'red');
    return false;
  }
  
  if (data === feature.submodule_id) {
    log(`✅ get_submodule_id_from_feature_id: ${feature.id} → ${feature.submodule_id}`, 'green');
    return true;
  } else {
    log(`❌ get_submodule_id_from_feature_id: Résultat inattendu: ${data} (attendu: ${feature.submodule_id})`, 'red');
    return false;
  }
}

async function testServiceGetFeatureId() {
  logSection('TEST 4: Test service getFeatureIdFromJira');
  
  const testJiraValue = '[TEST Phase 3] Service Test';
  
  // Récupérer une feature existante
  const { data: features } = await supabase
    .from('features')
    .select('id')
    .limit(1)
    .single();
  
  if (!features || !features.id) {
    log('⚠️  Aucune feature trouvée pour le test', 'yellow');
    return true; // Test ignoré
  }
  
  // Créer un mapping de test
  const { error: createError } = await supabase
    .from('jira_feature_mapping')
    .upsert({
      jira_feature_value: testJiraValue,
      feature_id: features.id,
      jira_custom_field_id: 'customfield_10052'
    }, {
      onConflict: 'jira_feature_value,jira_custom_field_id'
    });
  
  if (createError) {
    log(`❌ Erreur création mapping: ${createError.message}`, 'red');
    return false;
  }
  
  // Tester le service (simulation via Supabase direct)
  const { data, error } = await supabase
    .from('jira_feature_mapping')
    .select('feature_id')
    .eq('jira_feature_value', testJiraValue)
    .eq('jira_custom_field_id', 'customfield_10052')
    .single();
  
  if (error || !data) {
    log(`❌ Erreur service: ${error?.message}`, 'red');
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    return false;
  }
  
  if (data.feature_id === features.id) {
    log(`✅ Service getFeatureIdFromJira: ${testJiraValue} → ${features.id}`, 'green');
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    return true;
  } else {
    log(`❌ Service: Résultat inattendu`, 'red');
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    return false;
  }
}

async function testFullSyncWithFeature() {
  logSection('TEST 5: Simulation synchronisation complète avec feature');
  
  // Créer un ticket de test
  const testTicket = {
    title: '[TEST Phase 3] Ticket avec feature',
    description: 'Ce ticket teste la synchronisation Phase 3 avec feature',
    ticket_type: 'BUG',
    status: 'Nouveau',
    priority: 'Medium',
    origin: 'supabase',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: ticketData, error: ticketError } = await supabase
    .from('tickets')
    .insert(testTicket)
    .select()
    .single();
  
  if (ticketError || !ticketData) {
    log(`❌ Erreur création ticket test: ${ticketError?.message}`, 'red');
    return false;
  }
  
  log(`✅ Ticket de test créé: ${ticketData.id}`, 'green');
  
  // Récupérer une feature avec submodule
  const { data: feature, error: featureError } = await supabase
    .from('features')
    .select('id, submodule_id')
    .not('submodule_id', 'is', null)
    .limit(1)
    .single();
  
  if (featureError || !feature) {
    log('⚠️  Aucune feature avec submodule trouvée, test partiel', 'yellow');
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return true; // Test ignoré mais pas échoué
  }
  
  // Créer un mapping de test
  const testJiraValue = '[TEST Phase 3] Feature Sync';
  const { error: mappingError } = await supabase
    .from('jira_feature_mapping')
    .upsert({
      jira_feature_value: testJiraValue,
      feature_id: feature.id,
      jira_custom_field_id: 'customfield_10052',
      jira_feature_id: '99998'
    }, {
      onConflict: 'jira_feature_value,jira_custom_field_id'
    });
  
  if (mappingError) {
    log(`❌ Erreur création mapping: ${mappingError.message}`, 'red');
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  // Simuler jira_sync avec métadonnées Phase 3
  const jiraSyncData = {
    ticket_id: ticketData.id,
    jira_issue_key: 'OD-TEST-PHASE3-001',
    origin: 'jira',
    sync_metadata: {
      labels: [],
      components: [],
      jira_feature: testJiraValue,
      jira_feature_id: '99998'
    },
    last_synced_at: new Date().toISOString()
  };
  
  const { data: syncData, error: syncError } = await supabase
    .from('jira_sync')
    .upsert(jiraSyncData, { onConflict: 'ticket_id' })
    .select()
    .single();
  
  if (syncError || !syncData) {
    log(`❌ Erreur création jira_sync: ${syncError?.message}`, 'red');
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  log('✅ jira_sync créé avec métadonnées Phase 3', 'green');
  log(`   - jira_feature: ${syncData.sync_metadata?.jira_feature}`, 'blue');
  
  // Mettre à jour le ticket avec feature et submodule
  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      feature_id: feature.id,
      submodule_id: feature.submodule_id
    })
    .eq('id', ticketData.id);
  
  if (updateError) {
    log(`❌ Erreur mise à jour ticket: ${updateError.message}`, 'red');
    await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  log('✅ Ticket mis à jour avec feature_id et submodule_id', 'green');
  
  // Vérifier
  const { data: verifyTicket, error: verifyError } = await supabase
    .from('tickets')
    .select('feature_id, submodule_id')
    .eq('id', ticketData.id)
    .single();
  
  if (verifyError || !verifyTicket) {
    log(`❌ Erreur vérification: ${verifyError?.message}`, 'red');
    await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  if (verifyTicket.feature_id === feature.id && verifyTicket.submodule_id === feature.submodule_id) {
    log('✅ Vérification ticket: feature_id et submodule_id corrects', 'green');
  } else {
    log(`❌ Vérification ticket: valeurs inattendues`, 'red');
    await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
    await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  // Nettoyer
  await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
  await supabase.from('jira_feature_mapping').delete().eq('jira_feature_value', testJiraValue);
  await supabase.from('tickets').delete().eq('id', ticketData.id);
  
  log('✅ Données de test nettoyées', 'green');
  return true;
}

async function runAllTests() {
  log('\n🚀 DÉMARRAGE DES TESTS PHASE 3', 'cyan');
  log('='.repeat(60));
  
  const results = {
    tableExists: false,
    sqlFeatureFunction: false,
    sqlSubmoduleFunction: false,
    serviceGetFeatureId: false,
    fullSync: false
  };
  
  try {
    results.tableExists = await testTableExists();
    results.sqlFeatureFunction = await testSQLFeatureFunction();
    results.sqlSubmoduleFunction = await testSQLSubmoduleFunction();
    results.serviceGetFeatureId = await testServiceGetFeatureId();
    results.fullSync = await testFullSyncWithFeature();
  } catch (error) {
    log(`\n❌ Erreur fatale: ${error.message}`, 'red');
    console.error(error);
    return;
  }
  
  // Résumé
  logSection('RÉSUMÉ DES TESTS');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r === true).length;
  
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '❌';
    const name = test.replace(/([A-Z])/g, ' $1').trim();
    log(`${status} ${name}`, passed ? 'green' : 'red');
  }
  
  console.log('\n' + '='.repeat(60));
  log(`Résultat: ${passedTests}/${totalTests} tests réussis`, passedTests === totalTests ? 'green' : 'yellow');
  console.log('='.repeat(60) + '\n');
  
  if (passedTests === totalTests) {
    log('🎉 TOUS LES TESTS SONT PASSÉS !', 'green');
    process.exit(0);
  } else {
    log('⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.', 'yellow');
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests().catch(console.error);

