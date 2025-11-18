/**
 * Script de test pour la Phase 2 : Mapping Informations Client/Contact Jira ↔ Supabase
 * 
 * Tests :
 * 1. Vérification table jira_channel_mapping
 * 2. Test mapping canaux
 * 3. Test création/mapping client
 * 4. Test création/mapping entreprise
 * 5. Test synchronisation complète avec champs client/contact
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

async function testChannelMappings() {
  logSection('TEST 1: Vérification des mappings de canaux');
  
  const { data, error } = await supabase
    .from('jira_channel_mapping')
    .select('*')
    .order('jira_channel_value', { ascending: true });
  
  if (error) {
    log(`❌ Erreur lors de la récupération des mappings: ${error.message}`, 'red');
    return false;
  }
  
  if (!data || data.length === 0) {
    log('❌ Aucun mapping de canal trouvé', 'red');
    return false;
  }
  
  log(`✅ ${data.length} mappings de canaux trouvés`, 'green');
  
  // Vérifier les mappings attendus
  const expectedMappings = [
    { jira: 'Appel Téléphonique', supabase: 'Appel' },
    { jira: 'Appel WhatsApp', supabase: 'Whatsapp' },
    { jira: 'En présentiel', supabase: 'Autre' },
    { jira: 'Online (Google Meet, Teams...)', supabase: 'Autre' },
    { jira: 'Constat Interne', supabase: 'Autre' }
  ];
  
  let allFound = true;
  for (const expected of expectedMappings) {
    const found = data.find(
      m => m.jira_channel_value === expected.jira &&
           m.supabase_channel === expected.supabase
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

async function testSQLChannelFunction() {
  logSection('TEST 2: Test fonction SQL get_supabase_channel_from_jira');
  
  const { data, error } = await supabase.rpc(
    'get_supabase_channel_from_jira',
    {
      p_jira_channel: 'Appel Téléphonique'
    }
  );
  
  if (error) {
    log(`❌ Erreur fonction get_supabase_channel_from_jira: ${error.message}`, 'red');
    return false;
  }
  
  if (data === 'Appel') {
    log('✅ get_supabase_channel_from_jira: Appel Téléphonique → Appel', 'green');
    return true;
  } else {
    log(`❌ get_supabase_channel_from_jira: Résultat inattendu: ${data}`, 'red');
    return false;
  }
}

async function testCompanyMapping() {
  logSection('TEST 3: Test mapping entreprise Jira → Supabase');
  
  const testCompanyName = '[TEST Phase 2] Entreprise Test';
  const testJiraCompanyId = 99999;
  
  // Nettoyer d'abord si existe
  await supabase.from('companies').delete().eq('name', testCompanyName);
  
  // Test 1: Création automatique d'une entreprise
  const { data: company1, error: error1 } = await supabase
    .from('companies')
    .insert({
      name: testCompanyName,
      jira_company_id: testJiraCompanyId
    })
    .select()
    .single();
  
  if (error1 || !company1) {
    log(`❌ Erreur création entreprise test: ${error1?.message}`, 'red');
    return false;
  }
  
  log(`✅ Entreprise test créée: ${company1.id}`, 'green');
  
  // Test 2: Recherche via jira_company_id
  const { data: foundById, error: error2 } = await supabase
    .from('companies')
    .select('id')
    .eq('jira_company_id', testJiraCompanyId)
    .single();
  
  if (error2 || !foundById) {
    log(`❌ Erreur recherche par jira_company_id: ${error2?.message}`, 'red');
    await supabase.from('companies').delete().eq('id', company1.id);
    return false;
  }
  
  if (foundById.id === company1.id) {
    log('✅ Recherche par jira_company_id fonctionne', 'green');
  } else {
    log(`❌ Recherche par jira_company_id: ID inattendu`, 'red');
    await supabase.from('companies').delete().eq('id', company1.id);
    return false;
  }
  
  // Nettoyer
  await supabase.from('companies').delete().eq('id', company1.id);
  log('✅ Données de test nettoyées', 'green');
  
  return true;
}

async function testClientMapping() {
  logSection('TEST 4: Test mapping client Jira → Supabase');
  
  const testClientName = '[TEST Phase 2] Client Test';
  const testCompanyName = '[TEST Phase 2] Entreprise Client Test';
  
  // Nettoyer d'abord
  await supabase.from('profiles').delete().eq('full_name', testClientName);
  await supabase.from('companies').delete().eq('name', testCompanyName);
  
  // Créer une entreprise test
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: testCompanyName })
    .select()
    .single();
  
  if (companyError || !company) {
    log(`❌ Erreur création entreprise: ${companyError?.message}`, 'red');
    return false;
  }
  
  // Test 1: Création automatique d'un client
  const { data: client1, error: clientError1 } = await supabase
    .from('profiles')
    .insert({
      full_name: testClientName,
      role: 'client',
      company_id: company.id,
      auth_uid: null,
      is_active: true
    })
    .select()
    .single();
  
  if (clientError1 || !client1) {
    log(`❌ Erreur création client test: ${clientError1?.message}`, 'red');
    await supabase.from('companies').delete().eq('id', company.id);
    return false;
  }
  
  log(`✅ Client test créé: ${client1.id}`, 'green');
  
  // Test 2: Recherche client existant
  const { data: foundClient, error: searchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'client')
    .eq('full_name', testClientName)
    .eq('company_id', company.id)
    .single();
  
  if (searchError || !foundClient) {
    log(`❌ Erreur recherche client: ${searchError?.message}`, 'red');
    await supabase.from('profiles').delete().eq('id', client1.id);
    await supabase.from('companies').delete().eq('id', company.id);
    return false;
  }
  
  if (foundClient.id === client1.id) {
    log('✅ Recherche client par nom + entreprise fonctionne', 'green');
  } else {
    log(`❌ Recherche client: ID inattendu`, 'red');
    await supabase.from('profiles').delete().eq('id', client1.id);
    await supabase.from('companies').delete().eq('id', company.id);
    return false;
  }
  
  // Test 3: Mise à jour job_title
  const testJobTitle = 'Chef Comptable';
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ job_title: testJobTitle })
    .eq('id', client1.id);
  
  if (updateError) {
    log(`❌ Erreur mise à jour job_title: ${updateError.message}`, 'red');
    await supabase.from('profiles').delete().eq('id', client1.id);
    await supabase.from('companies').delete().eq('id', company.id);
    return false;
  }
  
  // Vérifier
  const { data: updatedClient, error: verifyError } = await supabase
    .from('profiles')
    .select('job_title')
    .eq('id', client1.id)
    .single();
  
  if (verifyError || !updatedClient) {
    log(`❌ Erreur vérification: ${verifyError?.message}`, 'red');
    await supabase.from('profiles').delete().eq('id', client1.id);
    await supabase.from('companies').delete().eq('id', company.id);
    return false;
  }
  
  if (updatedClient.job_title === testJobTitle) {
    log(`✅ Mise à jour job_title fonctionne: ${testJobTitle}`, 'green');
  } else {
    log(`❌ job_title inattendu: ${updatedClient.job_title}`, 'red');
    await supabase.from('profiles').delete().eq('id', client1.id);
    await supabase.from('companies').delete().eq('id', company.id);
    return false;
  }
  
  // Nettoyer
  await supabase.from('profiles').delete().eq('id', client1.id);
  await supabase.from('companies').delete().eq('id', company.id);
  log('✅ Données de test nettoyées', 'green');
  
  return true;
}

async function testFullSyncWithContact() {
  logSection('TEST 5: Simulation synchronisation complète avec champs client/contact');
  
  // Créer un ticket de test
  const testTicket = {
    title: '[TEST Phase 2] Ticket avec client/contact',
    description: 'Ce ticket teste la synchronisation Phase 2 avec client/contact',
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
  
  // Créer entreprise et client de test
  const testCompanyName = '[TEST Phase 2] Entreprise Sync';
  const testClientName = '[TEST Phase 2] Client Sync';
  
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: testCompanyName, jira_company_id: 99998 })
    .select()
    .single();
  
  if (companyError || !company) {
    log(`❌ Erreur création entreprise: ${companyError?.message}`, 'red');
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  const { data: client, error: clientError } = await supabase
    .from('profiles')
    .insert({
      full_name: testClientName,
      role: 'client',
      company_id: company.id,
      job_title: 'Contrôleur de Gestion',
      auth_uid: null
    })
    .select()
    .single();
  
  if (clientError || !client) {
    log(`❌ Erreur création client: ${clientError?.message}`, 'red');
    await supabase.from('companies').delete().eq('id', company.id);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  // Simuler jira_sync avec métadonnées Phase 2
  const jiraSyncData = {
    ticket_id: ticketData.id,
    jira_issue_key: 'OD-TEST-PHASE2-001',
    origin: 'jira',
    sync_metadata: {
      labels: [],
      components: [],
      client_name: testClientName,
      client_job_title: 'Contrôleur de Gestion',
      company_name: testCompanyName,
      jira_channel: 'Appel Téléphonique'
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
    await supabase.from('profiles').delete().eq('id', client.id);
    await supabase.from('companies').delete().eq('id', company.id);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  log('✅ jira_sync créé avec métadonnées Phase 2', 'green');
  log(`   - client_name: ${syncData.sync_metadata?.client_name}`, 'blue');
  log(`   - company_name: ${syncData.sync_metadata?.company_name}`, 'blue');
  log(`   - jira_channel: ${syncData.sync_metadata?.jira_channel}`, 'blue');
  
  // Mettre à jour le ticket avec contact et canal
  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      contact_user_id: client.id,
      canal: 'Appel'
    })
    .eq('id', ticketData.id);
  
  if (updateError) {
    log(`❌ Erreur mise à jour ticket: ${updateError.message}`, 'red');
    await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
    await supabase.from('profiles').delete().eq('id', client.id);
    await supabase.from('companies').delete().eq('id', company.id);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  log('✅ Ticket mis à jour avec contact_user_id et canal', 'green');
  
  // Vérifier
  const { data: verifyTicket, error: verifyError } = await supabase
    .from('tickets')
    .select('contact_user_id, canal')
    .eq('id', ticketData.id)
    .single();
  
  if (verifyError || !verifyTicket) {
    log(`❌ Erreur vérification: ${verifyError?.message}`, 'red');
    await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
    await supabase.from('profiles').delete().eq('id', client.id);
    await supabase.from('companies').delete().eq('id', company.id);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  if (verifyTicket.contact_user_id === client.id && verifyTicket.canal === 'Appel') {
    log('✅ Vérification ticket: contact_user_id et canal corrects', 'green');
  } else {
    log(`❌ Vérification ticket: valeurs inattendues`, 'red');
    await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
    await supabase.from('profiles').delete().eq('id', client.id);
    await supabase.from('companies').delete().eq('id', company.id);
    await supabase.from('tickets').delete().eq('id', ticketData.id);
    return false;
  }
  
  // Nettoyer
  await supabase.from('jira_sync').delete().eq('ticket_id', ticketData.id);
  await supabase.from('profiles').delete().eq('id', client.id);
  await supabase.from('companies').delete().eq('id', company.id);
  await supabase.from('tickets').delete().eq('id', ticketData.id);
  
  log('✅ Données de test nettoyées', 'green');
  return true;
}

async function runAllTests() {
  log('\n🚀 DÉMARRAGE DES TESTS PHASE 2', 'cyan');
  log('='.repeat(60));
  
  const results = {
    channelMappings: false,
    sqlChannelFunction: false,
    companyMapping: false,
    clientMapping: false,
    fullSync: false
  };
  
  try {
    results.channelMappings = await testChannelMappings();
    results.sqlChannelFunction = await testSQLChannelFunction();
    results.companyMapping = await testCompanyMapping();
    results.clientMapping = await testClientMapping();
    results.fullSync = await testFullSyncWithContact();
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

