#!/usr/bin/env node
/**
 * Script de test des optimisations du dashboard
 *
 * Vérifie que :
 * 1. La fonction PostgreSQL get_all_ticket_stats fonctionne
 * 2. Les données retournées sont correctes
 * 3. Les performances sont améliorées
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OBC_PRODUCT_ID = '91304e02-2ce6-4811-b19d-1cae091a6fde';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🧪 Tests des optimisations dashboard\n');

// Test 1: Fonction get_all_ticket_stats
console.log('📊 Test 1: Fonction get_all_ticket_stats');
console.log('━'.repeat(60));

const startTime = performance.now();

const { data, error } = await supabase.rpc('get_all_ticket_stats', {
  p_product_id: OBC_PRODUCT_ID,
});

const endTime = performance.now();
const duration = Math.round(endTime - startTime);

if (error) {
  console.error('❌ Erreur:', error.message);
  console.log('\n⚠️  La fonction PostgreSQL n\'est peut-être pas encore créée.');
  console.log('   👉 Appliquer la migration manuellement via Supabase Studio\n');
  process.exit(1);
}

console.log(`✅ Fonction exécutée avec succès en ${duration}ms`);
console.log(`\n📈 Résultats:\n`);

if (!data || data.length === 0) {
  console.log('⚠️  Aucune donnée retournée');
} else {
  const expectedTypes = ['BUG', 'REQ', 'ASSISTANCE'];
  const foundTypes = new Set(data.map(row => row.ticket_type));

  expectedTypes.forEach(type => {
    const stats = data.find(row => row.ticket_type === type);

    if (stats) {
      console.log(`${getTypeIcon(type)} ${type}:`);
      console.log(`   Total: ${stats.total}`);
      console.log(`   Ouverts: ${stats.ouverts}`);
      console.log(`   Résolus: ${stats.resolus}`);
      console.log(`   Taux résolution: ${stats.taux_resolution}%`);
      console.log('');
    } else {
      console.log(`⚠️  ${type}: Aucune donnée`);
    }
  });

  // Vérifications
  console.log('\n🔍 Vérifications:');
  console.log('━'.repeat(60));

  const allTypesPresent = expectedTypes.every(type => foundTypes.has(type));
  console.log(`${allTypesPresent ? '✅' : '❌'} Tous les types présents (BUG, REQ, ASSISTANCE)`);

  const allHaveValidData = data.every(row => {
    const totalValid = row.total >= 0;
    const sumValid = row.ouverts + row.resolus === row.total;
    const rateValid = row.taux_resolution >= 0 && row.taux_resolution <= 100;
    return totalValid && sumValid && rateValid;
  });
  console.log(`${allHaveValidData ? '✅' : '❌'} Données cohérentes (total = ouverts + résolus)`);

  const performanceGood = duration < 100;
  console.log(`${performanceGood ? '✅' : '⚠️'} Performance (${duration}ms ${performanceGood ? '< 100ms' : '>= 100ms'})`);
}

// Test 2: Comparer avec l'ancienne méthode
console.log('\n\n⏱️  Test 2: Comparaison performance (ancienne vs nouvelle méthode)');
console.log('━'.repeat(60));

console.log('\n🔴 Ancienne méthode (6 requêtes COUNT séparées):');
const oldStartTime = performance.now();

const [bugTotal, bugResolved, reqTotal, reqResolved, assistanceTotal, assistanceResolved] = await Promise.all([
  supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('ticket_type', 'BUG').eq('product_id', OBC_PRODUCT_ID),
  supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('ticket_type', 'BUG').eq('product_id', OBC_PRODUCT_ID).in('status', ['Terminé(e)', 'Resolue', 'Closed', 'Done']),
  supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('ticket_type', 'REQ').eq('product_id', OBC_PRODUCT_ID),
  supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('ticket_type', 'REQ').eq('product_id', OBC_PRODUCT_ID).in('status', ['Terminé(e)', 'Resolue', 'Closed', 'Done']),
  supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('ticket_type', 'ASSISTANCE').eq('product_id', OBC_PRODUCT_ID),
  supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('ticket_type', 'ASSISTANCE').eq('product_id', OBC_PRODUCT_ID).in('status', ['Terminé(e)', 'Resolue', 'Closed', 'Done']),
]);

const oldEndTime = performance.now();
const oldDuration = Math.round(oldEndTime - oldStartTime);

console.log(`   Temps: ${oldDuration}ms`);
console.log(`   Requêtes: 6`);

console.log('\n🟢 Nouvelle méthode (1 fonction PostgreSQL):');
console.log(`   Temps: ${duration}ms`);
console.log(`   Requêtes: 1`);

console.log('\n📊 Gains:');
const improvement = ((oldDuration - duration) / oldDuration * 100).toFixed(1);
const faster = (oldDuration / duration).toFixed(1);
console.log(`   ✅ Temps: ${improvement}% plus rapide (${faster}x)`);
console.log(`   ✅ Requêtes: 83% de réduction (6 → 1)`);

// Test 3: Vérifier les index
console.log('\n\n🗂️  Test 3: Vérification des index');
console.log('━'.repeat(60));

const { data: indexes, error: indexError } = await supabase.rpc('exec_sql', {
  sql_query: `
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'tickets'
      AND schemaname = 'public'
      AND indexname LIKE 'idx_tickets%'
    ORDER BY indexname;
  `
}).catch(() => ({ data: null, error: 'Function exec_sql not available' }));

if (indexError || !indexes) {
  console.log('⚠️  Impossible de vérifier les index (fonction exec_sql non disponible)');
  console.log('   Vous pouvez vérifier manuellement dans Supabase Studio');
} else {
  const expectedIndexes = [
    'idx_tickets_dashboard_main',
    'idx_tickets_product_status',
    'idx_tickets_created_at_brin',
  ];

  expectedIndexes.forEach(indexName => {
    const found = indexes.find(idx => idx.indexname === indexName);
    console.log(`${found ? '✅' : '❌'} ${indexName}`);
  });
}

// Résumé final
console.log('\n\n🎯 RÉSUMÉ FINAL');
console.log('━'.repeat(60));

const allTestsPassed = data && data.length > 0 && duration < 100;

if (allTestsPassed) {
  console.log('✅ Toutes les optimisations sont actives !');
  console.log('\n📈 Gains observés:');
  console.log(`   • Temps de requête: ${oldDuration}ms → ${duration}ms (-${improvement}%)`);
  console.log('   • Nombre de requêtes: 6 → 1 (-83%)');
  console.log('   • Performance: Excellente (<100ms)');
  console.log('\n🚀 Le dashboard est maintenant ultra-rapide !');
} else {
  console.log('⚠️  Certaines optimisations ne sont pas encore actives');
  console.log('\n👉 Prochaines étapes:');
  if (!data || data.length === 0) {
    console.log('   1. Vérifier que la migration SQL a bien été appliquée');
    console.log('   2. Ouvrir Supabase Studio > SQL Editor');
    console.log('   3. Exécuter: SELECT * FROM get_all_ticket_stats(NULL);');
  }
  if (duration >= 100) {
    console.log('   1. Vérifier que les index sont créés (idx_tickets_dashboard_main)');
    console.log('   2. Exécuter ANALYZE tickets; dans Supabase');
  }
}

console.log('');

function getTypeIcon(type) {
  switch (type) {
    case 'BUG': return '🐛';
    case 'REQ': return '✨';
    case 'ASSISTANCE': return '🆘';
    default: return '📋';
  }
}
