/**
 * Script pour appliquer toutes les migrations d'import des tickets assistance
 * et générer un rapport final
 */

import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations', 'import-all-assistance');
const REPORT_PATH = 'rapport-import-assistance.json';

// Compter les tickets avant l'import
async function countTicketsBefore() {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'ASSISTANCE');
  
  if (error) {
    console.error('❌ Erreur lors du comptage initial:', error.message);
    return 0;
  }
  return count || 0;
}

// Compter les tickets après l'import
async function countTicketsAfter() {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'ASSISTANCE');
  
  if (error) {
    console.error('❌ Erreur lors du comptage final:', error.message);
    return 0;
  }
  return count || 0;
}

// Obtenir les statistiques détaillées
async function getDetailedStats() {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, created_at, action_menee, objet_principal, duration_minutes')
    .eq('ticket_type', 'ASSISTANCE')
    .order('created_at', { ascending: false })
    .limit(1000);
  
  if (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error.message);
    return null;
  }
  
  const stats = {
    total: tickets.length,
    with_created_at: tickets.filter(t => t.created_at).length,
    with_action_menee: tickets.filter(t => t.action_menee).length,
    with_objet_principal: tickets.filter(t => t.objet_principal).length,
    with_duration: tickets.filter(t => t.duration_minutes).length,
    date_range: {
      oldest: tickets.length > 0 ? tickets[tickets.length - 1]?.created_at : null,
      newest: tickets.length > 0 ? tickets[0]?.created_at : null
    }
  };
  
  return stats;
}

// Appliquer une migration via Supabase REST API (rpc exec_sql si disponible, sinon via SQL Editor)
async function applyMigration(filePath, partNumber) {
  console.log(`\n📄 [${partNumber}/15] Application de: ${filePath.split(/[/\\]/).pop()}`);
  
  const sqlContent = readFileSync(filePath, 'utf-8');
  
  // Utiliser execute_sql via RPC si disponible, sinon on devra utiliser le SQL Editor manuellement
  // Pour l'instant, on va utiliser une approche différente : exécuter via le client Supabase
  // Mais les migrations complexes avec DO $$ blocks nécessitent le SQL Editor
  
  try {
    // Pour les grandes migrations SQL, on doit utiliser le SQL Editor de Supabase
    // On va donc indiquer à l'utilisateur qu'il faut les appliquer manuellement
    // OU on peut essayer de les exécuter via une fonction RPC si elle existe
    
    // Vérifier si la fonction exec_sql existe
    const { data: rpcCheck, error: rpcError } = await supabase
      .rpc('exec_sql', { query_text: 'SELECT 1' })
      .single();
    
    if (!rpcError && rpcCheck) {
      // La fonction existe, on peut l'utiliser
      const { data, error } = await supabase
        .rpc('exec_sql', { query_text: sqlContent });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log(`   ✅ Migration ${partNumber} appliquée avec succès`);
      return { success: true, partNumber };
    } else {
      // La fonction n'existe pas, on doit utiliser le SQL Editor
      console.log(`   ⚠️  Migration ${partNumber} doit être appliquée via le SQL Editor de Supabase`);
      console.log(`   📋 Fichier: ${filePath}`);
      return { success: false, partNumber, needsManual: true, filePath };
    }
  } catch (error) {
    console.error(`   ❌ Erreur lors de l'application de la migration ${partNumber}:`, error.message);
    return { success: false, partNumber, error: error.message };
  }
}

// Fonction principale
async function main() {
  console.log('🚀 DÉBUT DE L\'IMPORT DES TICKETS D\'ASSISTANCE\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  
  // Compter les tickets avant
  const countBefore = await countTicketsBefore();
  console.log(`📊 Tickets assistance avant import: ${countBefore}\n`);
  
  // Lister les fichiers de migration
  const files = [];
  for (let i = 1; i <= 15; i++) {
    const fileName = `2025-12-10-import-all-assistance-part-${String(i).padStart(2, '0')}.sql`;
    const filePath = join(MIGRATIONS_DIR, fileName);
    files.push({ path: filePath, number: i });
  }
  
  const results = [];
  let successCount = 0;
  let failedCount = 0;
  let manualCount = 0;
  
  // Appliquer chaque migration
  for (const file of files) {
    const result = await applyMigration(file.path, file.number);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else if (result.needsManual) {
      manualCount++;
    } else {
      failedCount++;
    }
    
    // Petite pause entre les migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Compter les tickets après
  const countAfter = await countTicketsAfter();
  const ticketsAdded = countAfter - countBefore;
  
  // Obtenir les statistiques détaillées
  console.log('\n📊 Récupération des statistiques détaillées...\n');
  const detailedStats = await getDetailedStats();
  
  // Générer le rapport
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      migrations_total: 15,
      migrations_success: successCount,
      migrations_failed: failedCount,
      migrations_manual: manualCount,
      tickets_before: countBefore,
      tickets_after: countAfter,
      tickets_added: ticketsAdded
    },
    detailed_stats: detailedStats,
    results: results.map(r => ({
      part: r.partNumber,
      success: r.success,
      needs_manual: r.needsManual || false,
      error: r.error || null,
      file: r.filePath ? r.filePath.split(/[/\\]/).pop() : null
    }))
  };
  
  // Sauvegarder le rapport
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  
  // Afficher le rapport
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('📊 RAPPORT FINAL - IMPORT DES TICKETS D\'ASSISTANCE\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('📈 RÉSUMÉ:\n');
  console.log(`   Migrations totales: ${report.summary.migrations_total}`);
  console.log(`   ✅ Migrations réussies: ${report.summary.migrations_success}`);
  console.log(`   ⚠️  Migrations nécessitant une application manuelle: ${report.summary.migrations_manual}`);
  console.log(`   ❌ Migrations échouées: ${report.summary.migrations_failed}\n`);
  console.log('🎫 TICKETS:\n');
  console.log(`   Avant import: ${report.summary.tickets_before}`);
  console.log(`   Après import: ${report.summary.tickets_after}`);
  console.log(`   Tickets ajoutés/mis à jour: ${report.summary.tickets_added}\n`);
  
  if (detailedStats) {
    console.log('📋 STATISTIQUES DÉTAILLÉES (échantillon de 1000 tickets):\n');
    console.log(`   Total tickets analysés: ${detailedStats.total}`);
    console.log(`   Avec date de création: ${detailedStats.with_created_at}`);
    console.log(`   Avec action menée: ${detailedStats.with_action_menee}`);
    console.log(`   Avec objet principal: ${detailedStats.with_objet_principal}`);
    console.log(`   Avec durée: ${detailedStats.with_duration}`);
    if (detailedStats.date_range.oldest && detailedStats.date_range.newest) {
      console.log(`   Plage de dates: ${detailedStats.date_range.oldest} → ${detailedStats.date_range.newest}\n`);
    }
  }
  
  if (manualCount > 0) {
    console.log('⚠️  MIGRATIONS NÉCESSITANT UNE APPLICATION MANUELLE:\n');
    results.filter(r => r.needsManual).forEach(r => {
      console.log(`   Partie ${r.partNumber}: ${r.filePath?.split(/[/\\]/).pop() || 'N/A'}`);
    });
    console.log('\n   💡 Ces migrations doivent être appliquées via le SQL Editor de Supabase\n');
  }
  
  console.log(`💾 Rapport JSON sauvegardé: ${REPORT_PATH}\n`);
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);












