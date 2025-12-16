/**
 * Script pour appliquer toutes les migrations des tickets d'assistance
 * Utilise le MCP Supabase pour exécuter chaque fichier SQL
 */

import { readFileSync, statSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');
const PROJECT_ID = 'xjcttqaiplnoalolebls';

async function applyMigrations() {
  try {
    // Lister tous les fichiers SQL dans l'ordre
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.startsWith('2025-12-09-sync-assistance-tickets-part-') && f.endsWith('.sql'))
      .sort();
    
    console.log(`📦 ${migrationFiles.length} fichiers de migration trouvés\n`);
    
    console.log('💡 Pour appliquer ces migrations, vous avez plusieurs options :\n');
    
    console.log('Option 1 : Via l\'éditeur SQL Supabase (Recommandé)');
    console.log('  1. Allez sur https://supabase.com/dashboard/project/xjcttqaiplnoalolebls/sql/new');
    console.log('  2. Ouvrez chaque fichier dans l\'ordre :\n');
    
    migrationFiles.forEach((file, index) => {
      const filePath = join(MIGRATIONS_DIR, file);
      const stats = statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`     ${index + 1}. ${file} (${sizeKB} KB)`);
    });
    
    console.log('\n  3. Copiez-collez le contenu de chaque fichier et exécutez');
    console.log('  4. Attendez la fin de chaque exécution avant de passer au suivant\n');
    
    console.log('Option 2 : Via psql (si installé)');
    console.log('  for file in supabase/migrations/assistance-tickets-split/2025-12-09-sync-assistance-tickets-part-*.sql; do');
    console.log('    psql "postgresql://postgres:[PASSWORD]@db.xjcttqaiplnoalolebls.supabase.co:5432/postgres" -f "$file"');
    console.log('  done\n');
    
    console.log('Option 3 : Installer le CLI Supabase');
    console.log('  npm install -g supabase');
    console.log('  supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.xjcttqaiplnoalolebls.supabase.co:5432/postgres"\n');
    
    console.log('⚠️  Note : Les fichiers sont trop volumineux pour être appliqués automatiquement via MCP.');
    console.log('    Utilisez l\'éditeur SQL Supabase pour une application manuelle et sécurisée.\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

applyMigrations();

