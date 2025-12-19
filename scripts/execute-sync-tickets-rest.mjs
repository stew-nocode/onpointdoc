/**
 * Script pour exécuter la migration SQL de synchronisation des tickets
 * Divise le fichier en parties exécutables
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-08-sync-tickets-from-csv-rest.sql');

// Lire le fichier SQL
const sql = readFileSync(SQL_FILE, 'utf-8');

// Diviser en parties logiques
const parts = sql.split(/-- ============================================\n/);

// Partie 1: En-tête + Création table temporaire
const part1 = parts[0] + '\n-- ============================================\n' + parts[1] + '\n-- ============================================\n' + parts[2] + '\n-- ============================================\n' + parts[3];

// Partie 2: INSERT VALUES (toute la section)
const part2 = parts[4]; // Contient tous les INSERT VALUES

// Partie 3: UPSERT logic + Cleanup
const part3 = '\n-- ============================================\n' + parts[5] + '\n-- ============================================\n' + parts[6] + '\n-- ============================================\n' + parts[7] + '\n-- ============================================\n' + parts[8];

console.log('📄 Fichier SQL divisé en 3 parties:');
console.log(`  Partie 1 (Création table): ${part1.length} caractères`);
console.log(`  Partie 2 (INSERT VALUES): ${part2.length} caractères`);
console.log(`  Partie 3 (UPSERT + Cleanup): ${part3.length} caractères`);

// Sauvegarder les parties pour inspection
import { writeFileSync } from 'fs';

writeFileSync(join(__dirname, '..', 'temp_sql_part1.sql'), part1, 'utf-8');
writeFileSync(join(__dirname, '..', 'temp_sql_part2.sql'), part2, 'utf-8');
writeFileSync(join(__dirname, '..', 'temp_sql_part3.sql'), part3, 'utf-8');

console.log('\n✅ Parties sauvegardées dans temp_sql_part*.sql');
console.log('💡 Ces fichiers peuvent être exécutés séquentiellement via Supabase CLI ou l\'interface web.');












