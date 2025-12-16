/**
 * Script pour appliquer toutes les migrations et générer un rapport
 * Utilise readFileSync pour lire les fichiers SQL complets
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

// Obtenir les statistiques
async function getStats() {
  const { data, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, created_at, action_menee, objet_principal, duration_minutes')
    .eq('ticket_type', 'ASSISTANCE')
    .order('created_at', { ascending: false })
    .limit(5000);
  
  if (error) {
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

async function main() {
  console.log('🚀 APPLICATION DES MIGRATIONS D\'IMPORT ASSISTANCE\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  
  const countBefore = await countTickets();
  console.log(`📊 Tickets assistance avant import: ${countBefore}\n`);
  
  const files = [];
  for (let i = 1; i <= 15; i++) {
    const fileName = `2025-12-10-import-all-assistance-part-${String(i).padStart(2, '0')}.sql`;
    files.push({ path: join(MIGRATIONS_DIR, fileName), number: i, name: fileName });
  }
  
  const results = [];
  
  console.log('📋 Les migrations doivent être appliquées via MCP Supabase apply_migration\n');
  console.log('💡 Pour chaque fichier, utilisez: mcp_supabase_apply_migration avec le contenu SQL\n');
  console.log('📄 Liste des fichiers à appliquer:\n');
  
  files.forEach((file, index) => {
    try {
      const content = readFileSync(file.path, 'utf-8');
      const ticketCount = (content.match(/'OBCS-\d+'/g) || []).length;
      const sizeKB = Math.round(content.length / 1024);
      
      results.push({
        part: file.number,
        file: file.name,
        ticket_count: ticketCount,
        size_kb: sizeKB,
        status: 'pending',
        note: 'À appliquer via MCP Supabase apply_migration'
      });
      
      console.log(`   [${index + 1}/${files.length}] ${file.name}`);
      console.log(`      📊 Tickets: ${ticketCount}`);
      console.log(`      📏 Taille: ${sizeKB} KB`);
      console.log(`      ⏳ Statut: En attente d'application\n`);
    } catch (error) {
      console.error(`   ❌ Erreur lecture ${file.name}:`, error.message);
      results.push({
        part: file.number,
        file: file.name,
        status: 'error',
        error: error.message
      });
    }
  });
  
  // Générer le rapport
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      migrations_total: 15,
      tickets_before: countBefore,
      migrations_status: 'pending_application'
    },
    migrations: results,
    instructions: [
      'Appliquer chaque migration via: mcp_supabase_apply_migration',
      'project_id: xjcttqaiplnoalolebls',
      'name: import_all_assistance_part_XX',
      'query: [contenu du fichier SQL]'
    ]
  };
  
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('📊 RAPPORT PRÉLIMINAIRE\n');
  console.log(`   📁 Fichiers analysés: ${results.length}`);
  console.log(`   🎫 Total tickets à importer: ${results.reduce((sum, r) => sum + (r.ticket_count || 0), 0)}`);
  console.log(`   📊 Tickets assistance actuels: ${countBefore}\n`);
  console.log(`💾 Rapport sauvegardé: ${REPORT_PATH}\n`);
  console.log('⚠️  NOTE: Les migrations doivent être appliquées manuellement via MCP Supabase\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);






