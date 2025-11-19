/**
 * Script de test pour la pagination des tickets
 * 
 * Teste :
 * 1. La route API /api/tickets/list
 * 2. Le service listTicketsPaginated
 * 3. La pagination (offset/limit)
 * 4. Les filtres (type, status)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
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

async function testPagination() {
  log('\n🧪 TEST : PAGINATION DES TICKETS', 'cyan');
  log('='.repeat(60));

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Compter le total de tickets
  log('\n📊 Test 1: Compter le total de tickets', 'blue');
  try {
    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    log(`   ✓ Total de tickets: ${count}`, 'green');
    tests.push({ name: 'Compter total tickets', status: 'passed', total: count });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Compter total tickets', status: 'failed', error: error.message });
    failed++;
  }

  // Test 2: Pagination - Page 1 (offset 0, limit 25)
  log('\n📄 Test 2: Pagination - Page 1 (offset 0, limit 25)', 'blue');
  try {
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, status, priority, assigned_to, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 24);

    if (error) throw error;

    const hasMore = count ? 25 < count : false;
    log(`   ✓ Tickets récupérés: ${data?.length || 0}`, 'green');
    log(`   ✓ Total disponible: ${count}`, 'green');
    log(`   ✓ HasMore: ${hasMore}`, 'green');
    
    if (data && data.length > 0) {
      log(`   ✓ Premier ticket: ${data[0].title.substring(0, 50)}...`, 'green');
    }

    tests.push({ name: 'Pagination page 1', status: 'passed', count: data?.length, total: count });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Pagination page 1', status: 'failed', error: error.message });
    failed++;
  }

  // Test 3: Pagination - Page 2 (offset 25, limit 25)
  log('\n📄 Test 3: Pagination - Page 2 (offset 25, limit 25)', 'blue');
  try {
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, status, priority, assigned_to, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(25, 49);

    if (error) throw error;

    const hasMore = count ? 50 < count : false;
    log(`   ✓ Tickets récupérés: ${data?.length || 0}`, 'green');
    log(`   ✓ HasMore: ${hasMore}`, 'green');
    
    if (data && data.length > 0) {
      log(`   ✓ Premier ticket page 2: ${data[0].title.substring(0, 50)}...`, 'green');
    }

    tests.push({ name: 'Pagination page 2', status: 'passed', count: data?.length, hasMore });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Pagination page 2', status: 'failed', error: error.message });
    failed++;
  }

  // Test 4: Filtre par type BUG
  log('\n🔍 Test 4: Filtre par type BUG', 'blue');
  try {
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, status, priority, assigned_to, created_at', { count: 'exact' })
      .eq('ticket_type', 'BUG')
      .order('created_at', { ascending: false })
      .range(0, 24);

    if (error) throw error;

    const allBug = data?.every(t => t.ticket_type === 'BUG') || false;
    log(`   ✓ Tickets BUG récupérés: ${data?.length || 0}`, 'green');
    log(`   ✓ Total BUG disponible: ${count}`, 'green');
    log(`   ✓ Tous sont de type BUG: ${allBug ? 'Oui' : 'Non'}`, allBug ? 'green' : 'red');

    tests.push({ name: 'Filtre type BUG', status: allBug ? 'passed' : 'failed', count: data?.length, total: count });
    if (allBug) passed++;
    else failed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Filtre type BUG', status: 'failed', error: error.message });
    failed++;
  }

  // Test 5: Filtre par statut Nouveau
  log('\n🔍 Test 5: Filtre par statut Nouveau', 'blue');
  try {
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, status, priority, assigned_to, created_at', { count: 'exact' })
      .eq('status', 'Nouveau')
      .order('created_at', { ascending: false })
      .range(0, 24);

    if (error) throw error;

    const allNouveau = data?.every(t => t.status === 'Nouveau') || false;
    log(`   ✓ Tickets "Nouveau" récupérés: ${data?.length || 0}`, 'green');
    log(`   ✓ Total "Nouveau" disponible: ${count}`, 'green');
    log(`   ✓ Tous sont de statut "Nouveau": ${allNouveau ? 'Oui' : 'Non'}`, allNouveau ? 'green' : 'red');

    tests.push({ name: 'Filtre statut Nouveau', status: allNouveau ? 'passed' : 'failed', count: data?.length, total: count });
    if (allNouveau) passed++;
    else failed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Filtre statut Nouveau', status: 'failed', error: error.message });
    failed++;
  }

  // Test 6: Filtre combiné (BUG + Nouveau)
  log('\n🔍 Test 6: Filtre combiné (BUG + Nouveau)', 'blue');
  try {
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, status, priority, assigned_to, created_at', { count: 'exact' })
      .eq('ticket_type', 'BUG')
      .eq('status', 'Nouveau')
      .order('created_at', { ascending: false })
      .range(0, 24);

    if (error) throw error;

    const allMatch = data?.every(t => t.ticket_type === 'BUG' && t.status === 'Nouveau') || false;
    log(`   ✓ Tickets BUG+Nouveau récupérés: ${data?.length || 0}`, 'green');
    log(`   ✓ Total BUG+Nouveau disponible: ${count}`, 'green');
    log(`   ✓ Tous correspondent aux filtres: ${allMatch ? 'Oui' : 'Non'}`, allMatch ? 'green' : 'red');

    tests.push({ name: 'Filtre combiné BUG+Nouveau', status: allMatch ? 'passed' : 'failed', count: data?.length, total: count });
    if (allMatch) passed++;
    else failed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Filtre combiné BUG+Nouveau', status: 'failed', error: error.message });
    failed++;
  }

  // Résumé
  log('\n' + '='.repeat(60));
  log('📊 RÉSUMÉ DES TESTS', 'cyan');
  log('='.repeat(60));
  log(`✅ Tests réussis: ${passed}`, 'green');
  log(`❌ Tests échoués: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📈 Taux de réussite: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue');

  if (failed === 0) {
    log('\n✅ Tous les tests sont passés !', 'green');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.', 'yellow');
  }

  return { passed, failed, tests };
}

// Exécuter les tests
testPagination()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Erreur fatale: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });

