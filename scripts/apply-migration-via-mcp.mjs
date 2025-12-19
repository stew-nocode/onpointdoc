/**
 * Script pour appliquer la migration SQL via Supabase MCP
 * Ce script doit être exécuté dans un environnement qui a accès aux outils MCP Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-08-sync-tickets-from-sheet-1765293279327.sql');
const PROJECT_ID = 'xjcttqaiplnoalolebls';

console.log('📝 Instructions pour appliquer la migration SQL\n');
console.log('='.repeat(70));
console.log('OPTION 1 : Via l\'interface web Supabase (RECOMMANDÉ - Le plus simple)');
console.log('='.repeat(70));
console.log('\n1. Ouvrez votre navigateur et allez sur:');
console.log('   https://supabase.com/dashboard/project/xjcttqaiplnoalolebls/sql/new\n');
console.log('2. Ouvrez le fichier:');
console.log(`   ${SQL_FILE}\n`);
console.log('3. Copiez TOUT le contenu du fichier (Ctrl+A, Ctrl+C)\n');
console.log('4. Collez dans l\'éditeur SQL de Supabase\n');
console.log('5. Cliquez sur "Run" ou appuyez sur Ctrl+Enter\n');
console.log('✅ C\'est tout ! La migration sera appliquée automatiquement.\n');

console.log('='.repeat(70));
console.log('OPTION 2 : Installer Supabase CLI');
console.log('='.repeat(70));
console.log('\n1. Installer Supabase CLI via npm:');
console.log('   npm install -g supabase\n');
console.log('2. Se connecter:');
console.log('   supabase login\n');
console.log('3. Lier le projet:');
console.log('   supabase link --project-ref xjcttqaiplnoalolebls\n');
console.log('4. Appliquer la migration:');
console.log(`   supabase db push --file ${SQL_FILE}\n`);

console.log('='.repeat(70));
console.log('OPTION 3 : Via psql (si vous avez PostgreSQL installé)');
console.log('='.repeat(70));
console.log('\n1. Récupérer la connection string depuis Supabase Dashboard\n');
console.log('2. Exécuter:');
console.log(`   psql "votre-connection-string" -f ${SQL_FILE}\n`);

console.log('='.repeat(70));
console.log('📊 Informations sur la migration');
console.log('='.repeat(70));

// Lire le fichier pour afficher les stats
try {
  const sql = readFileSync(SQL_FILE, 'utf-8');
  const ticketCount = (sql.match(/\('OD-/g) || []).length;
  const fileSizeKB = Math.round(sql.length / 1024);
  
  console.log(`\n📁 Fichier: ${SQL_FILE}`);
  console.log(`📊 Nombre de tickets: ${ticketCount}`);
  console.log(`📦 Taille: ${fileSizeKB} KB`);
  console.log(`\n⚠️  Le fichier est volumineux (${fileSizeKB} KB).`);
  console.log('   L\'interface web Supabase est la méthode la plus fiable.\n');
} catch (error) {
  console.log(`\n❌ Erreur lors de la lecture du fichier: ${error.message}\n`);
}












