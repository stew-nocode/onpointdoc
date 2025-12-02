/**
 * Script de test pour valider le calcul du taux de résolution
 * 
 * Teste que le calcul du taux de résolution est correct :
 * - Doit afficher 34% pour la période 02 nov - 02 déc 2025
 * - Au lieu de 174% (ancien calcul incorrect)
 * 
 * Usage: npx tsx scripts/test-resolution-rate.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (à adapter selon votre environnement)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TestPeriod {
  name: string;
  startDate: string;
  endDate: string;
}

const TEST_PERIOD: TestPeriod = {
  name: '02 nov - 02 déc 2025',
  startDate: '2025-11-02',
  endDate: '2025-12-02',
};

/**
 * Simule le calcul du taux de résolution comme dans ticket-flux.ts
 */
async function testResolutionRateCalculation(period: TestPeriod) {
  console.log(`\n📊 Test du calcul du taux de résolution`);
  console.log(`Période: ${period.name} (${period.startDate} à ${period.endDate})\n`);

  // 1. Tickets ouverts dans la période
  const { data: openedTickets, error: openedError } = await supabase
    .from('tickets')
    .select('id, created_at')
    .gte('created_at', `${period.startDate}T00:00:00.000Z`)
    .lte('created_at', `${period.endDate}T23:59:59.999Z`);

  if (openedError) {
    console.error('❌ Erreur lors de la récupération des tickets ouverts:', openedError);
    return;
  }

  // 2. Tickets résolus dans la période (avec created_at pour le filtrage)
  const { data: resolvedTickets, error: resolvedError } = await supabase
    .from('tickets')
    .select('id, created_at, resolved_at')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', `${period.startDate}T00:00:00.000Z`)
    .lte('resolved_at', `${period.endDate}T23:59:59.999Z`);

  if (resolvedError) {
    console.error('❌ Erreur lors de la récupération des tickets résolus:', resolvedError);
    return;
  }

  const opened = openedTickets?.length || 0;
  const resolved = resolvedTickets?.length || 0;

  // 3. Calcul ANCIEN (incorrect) : tous les tickets résolus / tickets ouverts
  const oldResolutionRate = opened > 0 ? Math.round((resolved / opened) * 100) : 0;

  // 4. Calcul NOUVEAU (correct) : seulement les tickets ouverts ET résolus dans la période
  const periodStart = new Date(`${period.startDate}T00:00:00.000Z`);
  const periodEnd = new Date(`${period.endDate}T23:59:59.999Z`);

  const openedAndResolvedInPeriod = (resolvedTickets || []).filter(ticket => {
    const createdDate = new Date(ticket.created_at);
    return createdDate >= periodStart && createdDate <= periodEnd;
  });

  const newResolutionRate = opened > 0
    ? Math.round((openedAndResolvedInPeriod.length / opened) * 100)
    : 0;

  // 5. Analyse détaillée
  const resolvedButOpenedBefore = resolved - openedAndResolvedInPeriod.length;

  // 6. Affichage des résultats
  console.log('📈 Résultats:');
  console.log('─'.repeat(60));
  console.log(`Tickets ouverts dans la période:           ${opened}`);
  console.log(`Tickets résolus dans la période:           ${resolved}`);
  console.log(`  ├─ Ouverts ET résolus dans la période:   ${openedAndResolvedInPeriod.length}`);
  console.log(`  └─ Résolus mais ouverts avant:           ${resolvedButOpenedBefore}`);
  console.log('─'.repeat(60));
  console.log(`\n❌ Ancien calcul (incorrect):              ${oldResolutionRate}%`);
  console.log(`   Formule: (${resolved} / ${opened}) × 100 = ${oldResolutionRate}%`);
  console.log(`\n✅ Nouveau calcul (correct):               ${newResolutionRate}%`);
  console.log(`   Formule: (${openedAndResolvedInPeriod.length} / ${opened}) × 100 = ${newResolutionRate}%`);

  // 7. Validation
  console.log('\n🔍 Validation:');
  console.log('─'.repeat(60));
  
  const expectedRate = 34; // Taux attendu selon l'analyse
  const tolerance = 2; // Tolérance de ±2%
  
  if (Math.abs(newResolutionRate - expectedRate) <= tolerance) {
    console.log(`✅ SUCCÈS: Le taux de résolution (${newResolutionRate}%) est correct!`);
    console.log(`   (Attendu: ~${expectedRate}%, Tolérance: ±${tolerance}%)`);
  } else {
    console.log(`⚠️  ATTENTION: Le taux de résolution (${newResolutionRate}%) diffère de l'attendu (~${expectedRate}%)`);
    console.log(`   Vérifiez les données ou le calcul.`);
  }

  // 8. Vérification que le nouveau calcul est différent de l'ancien
  if (newResolutionRate !== oldResolutionRate) {
    console.log(`✅ SUCCÈS: Le nouveau calcul (${newResolutionRate}%) diffère de l'ancien (${oldResolutionRate}%)`);
    console.log(`   La correction fonctionne correctement.`);
  } else {
    console.log(`⚠️  ATTENTION: Les deux calculs donnent le même résultat.`);
  }

  // 9. Vérification que le taux est ≤ 100%
  if (newResolutionRate <= 100) {
    console.log(`✅ SUCCÈS: Le taux de résolution (${newResolutionRate}%) est ≤ 100% (cohérent)`);
  } else {
    console.log(`❌ ERREUR: Le taux de résolution (${newResolutionRate}%) est > 100% (incohérent)`);
  }

  console.log('─'.repeat(60));
  console.log('\n✨ Test terminé!\n');
}

// Exécution du test
async function main() {
  console.log('🧪 Test du calcul du taux de résolution');
  console.log('='.repeat(60));
  
  await testResolutionRateCalculation(TEST_PERIOD);
}

main().catch(console.error);

