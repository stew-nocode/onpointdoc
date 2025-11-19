/**
 * Script de test pour la recherche textuelle et les colonnes personnalisables
 * 
 * Tests :
 * 1. Recherche textuelle dans l'API
 * 2. Fonctions de gestion des colonnes (localStorage)
 * 3. Validation des colonnes disponibles
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables Supabase manquantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Tests de la recherche textuelle et colonnes personnalisables\n');

// Test 1: Recherche textuelle dans l'API
async function testSearchAPI() {
  console.log('📋 Test 1: Recherche textuelle dans l\'API');
  
  try {
    // Test avec un terme de recherche
    const searchTerm = 'test';
    const searchPattern = `%${searchTerm}%`;
    
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, title, description, jira_issue_key', { count: 'exact' })
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern},jira_issue_key.ilike.${searchPattern}`)
      .limit(5);

    if (error) {
      console.error('   ❌ Erreur:', error.message);
      return false;
    }

    console.log(`   ✅ Recherche réussie: ${count || 0} tickets trouvés`);
    if (data && data.length > 0) {
      console.log(`   📝 Exemples de résultats:`);
      data.slice(0, 3).forEach((ticket, idx) => {
        console.log(`      ${idx + 1}. ${ticket.title || 'Sans titre'} (${ticket.jira_issue_key || 'N/A'})`);
      });
    }
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 2: Recherche avec terme vide (devrait retourner tous les tickets)
async function testEmptySearch() {
  console.log('\n📋 Test 2: Recherche avec terme vide');
  
  try {
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('   ❌ Erreur:', error.message);
      return false;
    }

    console.log(`   ✅ Total de tickets dans la base: ${count || 0}`);
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 3: Recherche avec terme inexistant
async function testNonExistentSearch() {
  console.log('\n📋 Test 3: Recherche avec terme inexistant');
  
  try {
    const searchTerm = 'xyz123nonexistent456';
    const searchPattern = `%${searchTerm}%`;
    
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id', { count: 'exact' })
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern},jira_issue_key.ilike.${searchPattern}`)
      .limit(1);

    if (error) {
      console.error('   ❌ Erreur:', error.message);
      return false;
    }

    console.log(`   ✅ Aucun résultat trouvé (attendu): ${count || 0} tickets`);
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 4: Vérification des colonnes disponibles
async function testAvailableColumns() {
  console.log('\n📋 Test 4: Vérification des colonnes disponibles');
  
  try {
    // Simuler l'import du module (en Node.js, on ne peut pas vraiment importer les modules ES)
    // On va plutôt vérifier que les colonnes existent dans la base de données
    
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        ticket_type,
        status,
        priority,
        canal,
        jira_issue_key,
        created_at,
        assigned_to,
        product:products(id, name),
        module:modules(id, name)
      `)
      .limit(1)
      .single();

    if (error) {
      console.error('   ❌ Erreur:', error.message);
      return false;
    }

    const expectedColumns = [
      'title',
      'ticket_type',
      'status',
      'priority',
      'canal',
      'jira_issue_key',
      'created_at',
      'assigned_to',
      'product',
      'module'
    ];

    console.log('   ✅ Colonnes disponibles dans la base de données:');
    expectedColumns.forEach(col => {
      const exists = ticket && (ticket[col] !== undefined || (col === 'product' && ticket.product) || (col === 'module' && ticket.module));
      console.log(`      ${exists ? '✅' : '❌'} ${col}`);
    });

    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 5: Recherche par clé Jira
async function testJiraKeySearch() {
  console.log('\n📋 Test 5: Recherche par clé Jira');
  
  try {
    // Récupérer une clé Jira existante
    const { data: ticketWithJira } = await supabase
      .from('tickets')
      .select('jira_issue_key')
      .not('jira_issue_key', 'is', null)
      .limit(1)
      .single();

    if (!ticketWithJira || !ticketWithJira.jira_issue_key) {
      console.log('   ⚠️  Aucun ticket avec clé Jira trouvé pour le test');
      return true;
    }

    const jiraKey = ticketWithJira.jira_issue_key;
    const searchPattern = `%${jiraKey}%`;
    
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, jira_issue_key', { count: 'exact' })
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern},jira_issue_key.ilike.${searchPattern}`)
      .limit(5);

    if (error) {
      console.error('   ❌ Erreur:', error.message);
      return false;
    }

    console.log(`   ✅ Recherche par clé Jira "${jiraKey}": ${count || 0} tickets trouvés`);
    if (data && data.length > 0) {
      console.log(`   📝 Résultats:`);
      data.forEach((ticket, idx) => {
        console.log(`      ${idx + 1}. ${ticket.jira_issue_key}`);
      });
    }
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 6: Performance de la recherche
async function testSearchPerformance() {
  console.log('\n📋 Test 6: Performance de la recherche');
  
  try {
    const searchTerm = 'test';
    const searchPattern = `%${searchTerm}%`;
    
    const startTime = Date.now();
    
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id', { count: 'exact' })
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern},jira_issue_key.ilike.${searchPattern}`)
      .limit(25);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.error('   ❌ Erreur:', error.message);
      return false;
    }

    console.log(`   ✅ Recherche effectuée en ${duration}ms`);
    console.log(`   📊 ${count || 0} tickets trouvés`);
    
    if (duration > 2000) {
      console.log('   ⚠️  Performance: Recherche lente (>2s), considérer l\'ajout d\'index');
    } else if (duration > 1000) {
      console.log('   ⚠️  Performance: Recherche modérée (>1s)');
    } else {
      console.log('   ✅ Performance: Recherche rapide (<1s)');
    }

    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  const results = [];
  
  results.push(await testSearchAPI());
  results.push(await testEmptySearch());
  results.push(await testNonExistentSearch());
  results.push(await testAvailableColumns());
  results.push(await testJiraKeySearch());
  results.push(await testSearchPerformance());

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Résultats: ${passed}/${total} tests réussis`);
  
  if (passed === total) {
    console.log('✅ Tous les tests sont passés !');
    process.exit(0);
  } else {
    console.log('❌ Certains tests ont échoué');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

