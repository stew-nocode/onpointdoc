/**
 * Script pour appliquer la migration SQL de synchronisation des tickets
 * Divise le fichier SQL en parties si nécessaire
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-08-sync-tickets-from-csv-rest.sql');

// Lire le fichier SQL
const sql = readFileSync(SQL_FILE, 'utf-8');

console.log('📄 Fichier SQL chargé');
console.log(`📊 Taille: ${sql.length} caractères`);
console.log(`📊 Lignes: ${sql.split('\n').length}`);

// Diviser le SQL en parties logiques
const parts = sql.split(/-- ============================================\n/);

console.log(`\n📦 Parties identifiées: ${parts.length}`);

// Afficher les parties
parts.forEach((part, index) => {
  const lines = part.split('\n').length;
  console.log(`  Partie ${index + 1}: ${lines} lignes`);
});

console.log('\n✅ Le fichier SQL est prêt à être appliqué');
console.log('⚠️  Note: Le fichier est trop volumineux pour être exécuté via l\'API MCP en une seule fois.');
console.log('💡 Utilisez Supabase CLI ou l\'interface web pour appliquer la migration.');












