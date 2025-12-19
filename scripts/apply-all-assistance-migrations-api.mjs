/**
 * Script pour appliquer toutes les migrations d'import assistance via API Supabase
 * et générer un rapport final
 */

import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });
dotenv.config(); // Charger aussi .env si présent

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations', 'import-all-assistance');
const REPORT_PATH = 'rapport-import-assistance-final.json';

// Compter les tickets
async function countTickets() {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'ASSISTANCE');
  
  if (error) {
    console.error('❌ Erreur:', error.message);
    return 0;
  }
  return count || 0;
}

// Obtenir les statistiques détaillées
async function getDetailedStats() {
  const { data, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, created_at, action_menee, objet_principal, duration_minutes')
    .eq('ticket_type', 'ASSISTANCE')
    .order('created_at', { ascending: false })
    .limit(10000);
  
  if (error) {
    console.error('❌ Erreur lors de la récupération des stats:', error.message);
    return null;
  }
  
  return {
    total: data.length,
    with_created_at: data.filter(t => t.created_at).length,
    with_action_menee: data.filter(t => t.action_menee).length,
    with_objet_principal: data.filter(t => t.objet_principal).length,
    with_duration: data.filter(t => t.duration_minutes).length,
    date_range: data.length > 0 ? {
      oldest: data[data.length - 1]?.created_at,
      newest: data[0]?.created_at
    } : null
  };
}

// Appliquer une migration via API
async function applyMigrationViaAPI(filePath, partNumber) {
  console.log(`\n📄 [${partNumber}/15] Application de: ${filePath.split(/[/\\]/).pop()}`);
  
  try {
    const sqlContent = readFileSync(filePath, 'utf-8');
    
    // Utiliser la fonction RPC exec_sql
    const { data, error } = await supabase.rpc('exec_sql', { query_text: sqlContent });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Vérifier si le résultat indique une erreur
    if (data && typeof data === 'object' && data.success === false) {
      throw new Error(data.error || 'Erreur inconnue lors de l\'exécution SQL');
    }
    
    console.log(`   ✅ Migration ${partNumber} appliquée avec succès`);
    return { success: true, partNumber, result: data };
    
  } catch (error) {
    console.error(`   ❌ Erreur migration ${partNumber}:`, error.message.substring(0, 200));
    return { success: false, partNumber, error: error.message };
  }
}

// Fonction principale
async function main() {
  console.log('🚀 APPLICATION DES MIGRATIONS VIA API SUPABASE\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  
  const countBefore = await countTickets();
  console.log(`📊 Tickets assistance avant import: ${countBefore}\n`);
  
  // Lister les fichiers
  const files = [];
  for (let i = 1; i <= 15; i++) {
    const fileName = `2025-12-10-import-all-assistance-part-${String(i).padStart(2, '0')}.sql`;
    files.push({ path: join(MIGRATIONS_DIR, fileName), number: i, name: fileName });
  }
  
  const results = [];
  let successCount = 0;
  let failedCount = 0;
  
  // Appliquer chaque migration
  for (const file of files) {
    const result = await applyMigrationViaAPI(file.path, file.number);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
    
    // Pause entre les migrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Compter après
  const countAfter = await countTickets();
  const ticketsAdded = countAfter - countBefore;
  
  // Statistiques détaillées
  console.log('\n📊 Récupération des statistiques détaillées...\n');
  const detailedStats = await getDetailedStats();
  
  // Générer le rapport
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      migrations_total: 15,
      migrations_success: successCount,
      migrations_failed: failedCount,
      tickets_before: countBefore,
      tickets_after: countAfter,
      tickets_added: ticketsAdded
    },
    detailed_stats: detailedStats,
    results: results.map(r => ({
      part: r.partNumber,
      success: r.success,
      error: r.error || null,
      file: r.file?.name || files.find(f => f.number === r.partNumber)?.name
    }))
  };
  
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  
  // Afficher le rapport
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('📊 RAPPORT FINAL - IMPORT DES TICKETS D\'ASSISTANCE\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('📈 RÉSUMÉ:\n');
  console.log(`   Migrations totales: ${report.summary.migrations_total}`);
  console.log(`   ✅ Migrations réussies: ${report.summary.migrations_success}`);
  console.log(`   ❌ Migrations échouées: ${report.summary.migrations_failed}\n`);
  console.log('🎫 TICKETS:\n');
  console.log(`   Avant import: ${report.summary.tickets_before}`);
  console.log(`   Après import: ${report.summary.tickets_after}`);
  console.log(`   Tickets ajoutés/mis à jour: ${report.summary.tickets_added}\n`);
  
  if (detailedStats) {
    console.log('📋 STATISTIQUES DÉTAILLÉES:\n');
    console.log(`   Total tickets analysés: ${detailedStats.total}`);
    console.log(`   Avec date de création: ${detailedStats.with_created_at}`);
    console.log(`   Avec action menée: ${detailedStats.with_action_menee}`);
    console.log(`   Avec objet principal: ${detailedStats.with_objet_principal}`);
    console.log(`   Avec durée: ${detailedStats.with_duration}`);
    if (detailedStats.date_range?.oldest && detailedStats.date_range?.newest) {
      console.log(`   Plage de dates: ${detailedStats.date_range.oldest} → ${detailedStats.date_range.newest}\n`);
    }
  }
  
  if (failedCount > 0) {
    console.log('❌ MIGRATIONS ÉCHOUÉES:\n');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   Partie ${r.partNumber}: ${r.error?.substring(0, 100) || 'Erreur inconnue'}`);
    });
    console.log('');
  }
  
  console.log(`💾 Rapport JSON sauvegardé: ${REPORT_PATH}\n`);
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);

