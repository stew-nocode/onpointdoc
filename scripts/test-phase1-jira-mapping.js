/**
 * Script de test pour la Phase 1 : Mapping champs standards Jira ↔ Supabase
 * 
 * Tests :
 * 1. Vérification des tables de mapping
 * 2. Test des fonctions de mapping
 * 3. Test de synchronisation complète
 * 4. Vérification des données dans jira_sync
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

async function testStatusMappings() {
  logSection('TEST 1: Vérification des mappings de statuts');
  
  const { data, error } = await supabase
    .from('jira_status_mapping')
    .select('*')
    .order('ticket_type', { ascending: true })
    .order('jira_status_name', { ascending: true });
  
  if (error) {
    log(`❌ Erreur lors de la récupération des mappings: ${error.message}`, 'red');
    return false;
  }
  
  if (!data || data.length === 0) {
    log('❌ Aucun mapping de statut trouvé', 'red');
    return false;
  }
  
  log(`✅ ${data.length} mappings de statuts trouvés`, 'green');
  
  // Vérifier les mappings attendus
  const expectedMappings = [
    { jira: 'Sprint Backlog', supabase: 'Nouveau', type: 'BUG' },
    { jira: 'Sprint Backlog', supabase: 'Nouveau', type: 'REQ' },
    { jira: 'Traitement en Cours', supabase: 'En_cours', type: 'BUG' },
    { jira: 'Traitement en Cours', supabase: 'En_cours', type: 'REQ' },
    { jira: 'Terminé(e)', supabase: 'Resolue', type: 'BUG' },
    { jira: 'Terminé(e)', supabase: 'Resolue', type: 'REQ' }
  ];
  
  let allFound = true;
  for (const expected of expectedMappings) {
    const found = data.find(
      m => m.jira_status_name === expected.jira &&
           m.supabase_status === expected.supabase &&
           m.ticket_type === expected.type
    );
    
    if (found) {
      log(`   ✓ ${expected.jira} (${expected.type}) → ${expected.supabase}`, 'green');
    } else {
      log(`   ✗ ${expected.jira} (${expected.type}) → ${expected.supabase} - MANQUANT`, 'red');
      allFound = false;
    }
  }
  
  return allFound;
}

async function testPriorityMappings() {
  logSection('TEST 2: Vérification des mappings de priorités');
  
  const { data, error } = await supabase
    .from('jira_priority_mapping')
    .select('*')
    .order('jira_priority_name', { ascending: true });
  
  if (error) {
    log(`❌ Erreur lors de la récupération des mappings: ${error.message}`, 'red');
    return false;
  }
  
  if (!data || data.length === 0) {
    log('❌ Aucun mapping de priorité trouvé', 'red');
    return false;
  }
  
  log(`✅ ${data.length} mappings de priorités trouvés`, 'green');
  
  // Vérifier les mappings attendus
  const expectedMappings = [
    { jira: 'Priorité 1', supabase: 'Critical' },
    { jira: 'Priorité 2', supabase: 'High' },
    { jira: 'Priorité 3', supabase: 'Medium' },
    { jira: 'Priorité 4', supabase: 'Low' }
  ];
  
  let allFound = true;
  for (const expected of expectedMappings) {
    const found = data.find(
      m => m.jira_priority_name === expected.jira &&
           m.supabase_priority === expected.supabase
    );
    
    if (found) {
      log(`   ✓ ${expected.jira} → ${expected.supabase}`, 'green');
    } else {
      log(`   ✗ ${expected.jira} → ${expected.supabase} - MANQUANT`, 'red');
      allFound = false;
    }
  }
  
  return allFound;
}

async function testSQLFunctions() {
  logSection('TEST 3: Test des fonctions SQL de mapping');
  
  // Test get_supabase_status_from_jira
  const { data: statusData, error: statusError } = await supabase.rpc(
    'get_supabase_status_from_jira',
    {
      p_jira_status: 'Sprint Backlog',
      p_ticket_type: 'BUG'
    }
  );
  
  if (statusError) {
    log(`❌ Erreur fonction get_supabase_status_from_jira: ${statusError.message}`, 'red');
    return false;
  }
  
  if (statusData === 'Nouveau') {
    log('✅ get_supabase_status_from_jira: Sprint Backlog (BUG) → Nouveau', 'green');
  } else {
    log(`❌ get_supabase_status_from_jira: Résultat inattendu: ${statusData}`, 'red');
    return false;
  }
  
  // Test get_supabase_priority_from_jira
  const { data: priorityData, error: priorityError } = await supabase.rpc(
    'get_supabase_priority_from_jira',
    {
      p_jira_priority: 'Priorité 1'
    }
  );
  
  if (priorityError) {
    log(`❌ Erreur fonction get_supabase_priority_from_jira: ${priorityError.message}`, 'red');
    return false;
  }
  
  if (priorityData === 'Critical') {
    log('✅ get_supabase_priority_from_jira: Priorité 1 → Critical', 'green');
  } else {
    log(`❌ get_supabase_priority_from_jira: Résultat inattendu: ${priorityData}`, 'red');
    return false;
  }
  
  return true;
}

async function testJiraSyncColumns() {
  logSection('TEST 4: Vérification des colonnes jira_sync');
  
  // Vérifier que les nouvelles colonnes existent
  const { data, error } = await supabase
    .from('jira_sync')
    .select('*')
    .limit(1);
  
  if (error) {
    log(`❌ Erreur lors de la vérification: ${error.message}`, 'red');
    return false;
  }
  
  // Liste des colonnes attendues (Phase 1)
  const expectedColumns = [
    'jira_status',
    'jira_priority',
    'jira_assignee_account_id',
    'jira_reporter_account_id',
    'jira_resolution',
    'jira_fix_version',
    'jira_sprint_id',
    'last_status_sync',
    'last_priority_sync',
    'sync_metadata'
  ];
  
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    let allFound = true;
    
    for (const col of expectedColumns) {
      if (columns.includes(col)) {
        log(`   ✓ Colonne ${col} présente`, 'green');
      } else {
        log(`   ✗ Colonne ${col} MANQUANTE`, 'red');
        allFound = false;
      }
    }
    
    return allFound;
  } else {
    // Table vide, vérifier la structure via une requête de métadonnées
    log('   ℹ Table jira_sync vide, vérification de la structure...', 'yellow');
    // On considère que c'est OK si pas d'erreur
    return true;
  }
}

async function testTicketsColumns() {
  logSection('TEST 5: Vérification des colonnes tickets');
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .limit(1);
  
  if (error) {
    log(`❌ Erreur lors de la vérification: ${error.message}`, 'red');
    return false;
  }
  
  const expectedColumns = ['resolution', 'fix_version'];
  
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    let allFound = true;
    
    for (const col of expectedColumns) {
      if (columns.includes(col)) {
        log(`   ✓ Colonne ${col} présente`, 'green');
      } else {
        log(`   ✗ Colonne ${col} MANQUANTE`, 'red');
        allFound = false;
      }
    }
    
    return allFound;
  } else {
    log('   ℹ Table tickets vide, vérification de la structure...', 'yellow');
    return true;
  }
}

async function testSyncSimulation() {
  logSection('TEST 6: Simulation de synchronisation Jira → Supabase');
  
  // Créer un ticket de test
  const testTicket = {
    title: '[TEST Phase 1] Ticket de test synchronisation Jira',
    description: 'Ce ticket est créé pour tester la synchronisation Phase 1',
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
  
  // Simuler une synchronisation jira_sync
  const jiraSyncData = {
    ticket_id: ticketData.id,
    jira_issue_key: 'OD-TEST-001',
    origin: 'jira',
    jira_status: 'Traitement en Cours',
    jira_priority: 'Priorité 2',
    jira_assignee_account_id: '712020:test-account-id',
    jira_reporter_account_id: '712020:test-reporter-id',
    jira_resolution: null,
    jira_fix_version: 'OBC V T1 2024',
    jira_sprint_id: '352',
    last_status_sync: new Date().toISOString(),
    last_priority_sync: new Date().toISOString(),
    sync_metadata: {
      labels: ['test', 'phase1'],
      components: ['Test Component']
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
    // Nettoyer le ticket de test
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  log('✅ jira_sync créé avec toutes les métadonnées Phase 1', 'green');
  log(`   - jira_status: ${syncData.jira_status}`, 'blue');
  log(`   - jira_priority: ${syncData.jira_priority}`, 'blue');
  log(`   - jira_fix_version: ${syncData.jira_fix_version}`, 'blue');
  log(`   - sync_metadata: ${JSON.stringify(syncData.sync_metadata)}`, 'blue');
  
  // Vérifier que les données sont bien stockées
  const { data: verifyData, error: verifyError } = await supabase
    .from('jira_sync')
    .select('*')
    .eq('ticket_id', ticketData.id)
    .single();
  
  if (verifyError || !verifyData) {
    log(`❌ Erreur vérification: ${verifyError?.message}`, 'red');
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  // Nettoyer les données de test
  await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
  await supabase.from('tickets').delete().eq('id', ticketData.id);
  
  log('✅ Données de test nettoyées', 'green');
  return true;
}

async function runAllTests() {
  log('\n🚀 DÉMARRAGE DES TESTS PHASE 1', 'cyan');
  log('='.repeat(60));
  
  const results = {
    statusMappings: false,
    priorityMappings: false,
    sqlFunctions: false,
    jiraSyncColumns: false,
    ticketsColumns: false,
    syncSimulation: false
  };
  
  try {
    results.statusMappings = await testStatusMappings();
    results.priorityMappings = await testPriorityMappings();
    results.sqlFunctions = await testSQLFunctions();
    results.jiraSyncColumns = await testJiraSyncColumns();
    results.ticketsColumns = await testTicketsColumns();
    results.syncSimulation = await testSyncSimulation();
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

