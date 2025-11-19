/**
 * Script de test pour la route API /api/tickets/list
 * 
 * Teste :
 * 1. Chargement initial (offset 0, limit 25)
 * 2. Pagination (page 2)
 * 3. Filtres (type, status)
 * 4. Filtres combinés
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

async function testApiEndpoint(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());
  if (params.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params.type) queryParams.set('type', params.type);
  if (params.status) queryParams.set('status', params.status);

  const url = `${API_URL}/api/tickets/list?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🧪 TEST : ROUTE API /api/tickets/list', 'cyan');
  log('='.repeat(60));
  log(`🌐 URL de base: ${API_URL}`, 'blue');

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Chargement initial (offset 0, limit 25)
  log('\n📄 Test 1: Chargement initial (offset 0, limit 25)', 'blue');
  try {
    const result = await testApiEndpoint({ offset: 0, limit: 25 });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const { tickets, hasMore, total } = result.data;
    
    if (!Array.isArray(tickets)) {
      throw new Error('La réponse ne contient pas un tableau de tickets');
    }

    if (typeof hasMore !== 'boolean') {
      throw new Error('hasMore doit être un booléen');
    }

    if (typeof total !== 'number') {
      throw new Error('total doit être un nombre');
    }

    log(`   ✓ Tickets récupérés: ${tickets.length}`, 'green');
    log(`   ✓ Total disponible: ${total}`, 'green');
    log(`   ✓ HasMore: ${hasMore}`, 'green');
    
    if (tickets.length > 0) {
      const firstTicket = tickets[0];
      const requiredFields = ['id', 'title', 'ticket_type', 'status', 'priority', 'created_at'];
      const hasAllFields = requiredFields.every(field => field in firstTicket);
      
      if (hasAllFields) {
        log(`   ✓ Structure du ticket valide`, 'green');
        log(`   ✓ Premier ticket: ${firstTicket.title.substring(0, 50)}...`, 'green');
      } else {
        throw new Error('Le ticket ne contient pas tous les champs requis');
      }
    }

    tests.push({ name: 'Chargement initial', status: 'passed', count: tickets.length, total, hasMore });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Chargement initial', status: 'failed', error: error.message });
    failed++;
  }

  // Test 2: Pagination - Page 2
  log('\n📄 Test 2: Pagination - Page 2 (offset 25, limit 25)', 'blue');
  try {
    const result = await testApiEndpoint({ offset: 25, limit: 25 });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const { tickets, hasMore, total } = result.data;
    
    log(`   ✓ Tickets récupérés: ${tickets.length}`, 'green');
    log(`   ✓ HasMore: ${hasMore}`, 'green');
    
    if (tickets.length > 0) {
      log(`   ✓ Premier ticket page 2: ${tickets[0].title.substring(0, 50)}...`, 'green');
    }

    tests.push({ name: 'Pagination page 2', status: 'passed', count: tickets.length, hasMore });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Pagination page 2', status: 'failed', error: error.message });
    failed++;
  }

  // Test 3: Filtre par type BUG
  log('\n🔍 Test 3: Filtre par type BUG', 'blue');
  try {
    const result = await testApiEndpoint({ offset: 0, limit: 25, type: 'BUG' });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const { tickets, hasMore, total } = result.data;
    const allBug = tickets.every(t => t.ticket_type === 'BUG');
    
    log(`   ✓ Tickets BUG récupérés: ${tickets.length}`, 'green');
    log(`   ✓ Total BUG disponible: ${total}`, 'green');
    log(`   ✓ Tous sont de type BUG: ${allBug ? 'Oui' : 'Non'}`, allBug ? 'green' : 'red');

    if (!allBug) {
      throw new Error('Certains tickets ne sont pas de type BUG');
    }

    tests.push({ name: 'Filtre type BUG', status: 'passed', count: tickets.length, total });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Filtre type BUG', status: 'failed', error: error.message });
    failed++;
  }

  // Test 4: Filtre par statut Nouveau
  log('\n🔍 Test 4: Filtre par statut Nouveau', 'blue');
  try {
    const result = await testApiEndpoint({ offset: 0, limit: 25, status: 'Nouveau' });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const { tickets, hasMore, total } = result.data;
    const allNouveau = tickets.every(t => t.status === 'Nouveau');
    
    log(`   ✓ Tickets "Nouveau" récupérés: ${tickets.length}`, 'green');
    log(`   ✓ Total "Nouveau" disponible: ${total}`, 'green');
    log(`   ✓ Tous sont de statut "Nouveau": ${allNouveau ? 'Oui' : 'Non'}`, allNouveau ? 'green' : 'red');

    if (!allNouveau) {
      throw new Error('Certains tickets ne sont pas de statut "Nouveau"');
    }

    tests.push({ name: 'Filtre statut Nouveau', status: 'passed', count: tickets.length, total });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Filtre statut Nouveau', status: 'failed', error: error.message });
    failed++;
  }

  // Test 5: Filtre combiné (BUG + Nouveau)
  log('\n🔍 Test 5: Filtre combiné (BUG + Nouveau)', 'blue');
  try {
    const result = await testApiEndpoint({ offset: 0, limit: 25, type: 'BUG', status: 'Nouveau' });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const { tickets, hasMore, total } = result.data;
    const allMatch = tickets.every(t => t.ticket_type === 'BUG' && t.status === 'Nouveau');
    
    log(`   ✓ Tickets BUG+Nouveau récupérés: ${tickets.length}`, 'green');
    log(`   ✓ Total BUG+Nouveau disponible: ${total}`, 'green');
    log(`   ✓ Tous correspondent aux filtres: ${allMatch ? 'Oui' : 'Non'}`, allMatch ? 'green' : 'red');

    if (!allMatch) {
      throw new Error('Certains tickets ne correspondent pas aux filtres combinés');
    }

    tests.push({ name: 'Filtre combiné BUG+Nouveau', status: 'passed', count: tickets.length, total });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Filtre combiné BUG+Nouveau', status: 'failed', error: error.message });
    failed++;
  }

  // Test 6: Vérifier que les tickets de la page 2 sont différents de la page 1
  log('\n🔄 Test 6: Vérifier que les tickets de la page 2 sont différents', 'blue');
  try {
    const page1 = await testApiEndpoint({ offset: 0, limit: 25 });
    const page2 = await testApiEndpoint({ offset: 25, limit: 25 });
    
    if (!page1.success || !page2.success) {
      throw new Error('Impossible de récupérer les pages');
    }

    const page1Ids = page1.data.tickets.map(t => t.id);
    const page2Ids = page2.data.tickets.map(t => t.id);
    const hasDuplicates = page1Ids.some(id => page2Ids.includes(id));
    
    if (hasDuplicates) {
      throw new Error('Des tickets sont dupliqués entre la page 1 et la page 2');
    }

    log(`   ✓ Page 1: ${page1Ids.length} tickets`, 'green');
    log(`   ✓ Page 2: ${page2Ids.length} tickets`, 'green');
    log(`   ✓ Aucun doublon entre les pages`, 'green');

    tests.push({ name: 'Pas de doublons entre pages', status: 'passed' });
    passed++;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    tests.push({ name: 'Pas de doublons entre pages', status: 'failed', error: error.message });
    failed++;
  }

  // Résumé
  log('\n' + '='.repeat(60));
  log('📊 RÉSUMÉ DES TESTS API', 'cyan');
  log('='.repeat(60));
  log(`✅ Tests réussis: ${passed}`, 'green');
  log(`❌ Tests échoués: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📈 Taux de réussite: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue');

  if (failed === 0) {
    log('\n✅ Tous les tests API sont passés !', 'green');
    log('💡 La route API /api/tickets/list fonctionne correctement.', 'blue');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.', 'yellow');
    log('💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)', 'yellow');
  }

  return { passed, failed, tests };
}

// Exécuter les tests
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Erreur fatale: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });

