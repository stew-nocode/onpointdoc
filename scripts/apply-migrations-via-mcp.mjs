/**
 * Script pour appliquer les migrations via MCP Supabase
 * et générer un rapport final
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations', 'import-all-assistance');
const REPORT_PATH = 'rapport-import-assistance.json';

// Cette fonction sera appelée pour chaque fichier
// L'utilisateur devra appliquer les migrations via MCP ou SQL Editor
async function analyzeMigrations() {
  console.log('📊 ANALYSE DES FICHIERS DE MIGRATION\n');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  
  const files = await glob('supabase/migrations/import-all-assistance/*.sql');
  files.sort();
  
  const report = {
    timestamp: new Date().toISOString(),
    total_files: files.length,
    files: [],
    instructions: []
  };
  
  console.log(`📁 ${files.length} fichiers de migration trouvés:\n`);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.split(/[/\\]/).pop();
    const content = readFileSync(file, 'utf-8');
    
    // Compter les tickets dans le fichier
    const ticketMatches = content.match(/'OBCS-\d+'/g);
    const ticketCount = ticketMatches ? ticketMatches.length : 0;
    
    // Extraire les dates
    const dateMatches = content.match(/'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)'::timestamptz/g);
    const dates = dateMatches ? dateMatches.map(m => m.match(/'([^']+)'/)[1]) : [];
    const uniqueDates = [...new Set(dates)];
    
    report.files.push({
      file: fileName,
      part_number: i + 1,
      ticket_count: ticketCount,
      date_range: uniqueDates.length > 0 ? {
        oldest: uniqueDates.sort()[0],
        newest: uniqueDates.sort().reverse()[0]
      } : null,
      file_size_kb: Math.round(content.length / 1024)
    });
    
    console.log(`   [${i + 1}/${files.length}] ${fileName}`);
    console.log(`      📊 Tickets: ${ticketCount}`);
    console.log(`      📏 Taille: ${Math.round(content.length / 1024)} KB`);
    if (uniqueDates.length > 0) {
      console.log(`      📅 Plage de dates: ${uniqueDates.sort()[0]} → ${uniqueDates.sort().reverse()[0]}`);
    }
    console.log('');
  }
  
  report.instructions = [
    'Pour appliquer ces migrations, utilisez le MCP Supabase apply_migration pour chaque fichier',
    'OU appliquez-les via le SQL Editor de Supabase',
    'Les migrations utilisent ON CONFLICT sur jira_issue_key pour éviter les doublons'
  ];
  
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log('📋 INSTRUCTIONS:\n');
  console.log('   1. Appliquez chaque migration via MCP Supabase ou SQL Editor');
  console.log('   2. Les migrations utilisent ON CONFLICT pour éviter les doublons');
  console.log('   3. Un rapport final sera généré après l\'application\n');
  console.log(`💾 Rapport d'analyse sauvegardé: ${REPORT_PATH}\n`);
  
  return report;
}

analyzeMigrations().catch(console.error);












