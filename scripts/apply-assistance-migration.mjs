/**
 * Script pour appliquer la migration des tickets d'assistance via MCP Supabase
 * Ce script lit le fichier SQL et l'applique via l'API Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATION_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-09-sync-assistance-tickets-from-sheet.sql');
const PROJECT_ID = 'xjcttqaiplnoalolebls'; // ONPOINT CENTRAL

async function applyMigration() {
  try {
    console.log('📖 Lecture du fichier de migration...');
    const sql = readFileSync(MIGRATION_FILE, 'utf-8');
    
    console.log(`📊 Taille du fichier: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📝 Nombre de lignes: ${sql.split('\n').length}`);
    
    console.log('\n⚠️  ATTENTION: Cette migration va insérer 5308 tickets d\'assistance.');
    console.log('⏱️  Cela peut prendre plusieurs minutes...\n');
    
    // Note: Le MCP Supabase apply_migration nécessite que le contenu soit passé
    // mais comme le fichier est très volumineux, nous devons utiliser une autre approche
    
    console.log('💡 SOLUTION RECOMMANDÉE:');
    console.log('   1. Utiliser le CLI Supabase: supabase db push');
    console.log('   2. Ou diviser la migration en plusieurs parties plus petites');
    console.log('   3. Ou utiliser l\'interface Supabase Dashboard > SQL Editor avec un script par lots\n');
    
    console.log('📋 Pour appliquer via CLI Supabase:');
    console.log('   npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.xjcttqaiplnoalolebls.supabase.co:5432/postgres"');
    console.log('   (Remplacez [PASSWORD] par votre mot de passe Supabase)\n');
    
    console.log('📋 Alternative: Diviser la migration en parties de 500 tickets chacune');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

applyMigration();

