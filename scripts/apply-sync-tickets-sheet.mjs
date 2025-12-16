/**
 * Script pour diviser et appliquer la migration SQL depuis Google Sheet
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-08-sync-tickets-from-sheet-1765293279327.sql');

// Lire le fichier SQL
const sql = readFileSync(SQL_FILE, 'utf-8');

// Extraire les parties
const headerEnd = sql.indexOf('INSERT INTO temp_tickets_csv');
const insertStart = sql.indexOf('INSERT INTO temp_tickets_csv');
const insertEnd = sql.indexOf('-- ============================================\n-- ÉTAPE 3: UPSERT des tickets');
const upsertStart = insertEnd;

const header = sql.substring(0, insertStart);
const insertSection = sql.substring(insertStart, insertEnd);
const upsertSection = sql.substring(upsertStart);

// Extraire les lignes INSERT (chaque ligne commence par "  ('OD-")
const insertLines = insertSection.split('\n').filter(line => 
  line.trim().startsWith("('OD-") || line.trim().startsWith("  ('OD-")
);

console.log(`📊 Total de lignes INSERT: ${insertLines.length}`);

// Diviser en lots de 200 tickets
const BATCH_SIZE = 200;
const batches = [];
for (let i = 0; i < insertLines.length; i += BATCH_SIZE) {
  batches.push(insertLines.slice(i, i + BATCH_SIZE));
}

console.log(`📦 Nombre de lots: ${batches.length}`);

// Créer les fichiers SQL pour chaque lot
batches.forEach((batch, index) => {
  const batchSQL = header + 
    '\nINSERT INTO temp_tickets_csv (\n' +
    '  jira_issue_key,\n' +
    '  title,\n' +
    '  description,\n' +
    '  ticket_type,\n' +
    '  priority,\n' +
    '  canal,\n' +
    '  status,\n' +
    '  module_name,\n' +
    '  submodule_name,\n' +
    '  feature_name,\n' +
    '  bug_type,\n' +
    '  reporter_name,\n' +
    '  contact_user_name,\n' +
    '  company_name,\n' +
    '  created_at,\n' +
    '  updated_at,\n' +
    '  resolved_at\n' +
    ') VALUES\n' +
    batch.join(',\n') + ';';
  
  const filename = join(__dirname, '..', `temp_sql_sheet_batch_${index + 1}.sql`);
  writeFileSync(filename, batchSQL, 'utf-8');
  console.log(`  Lot ${index + 1}: ${batch.length} tickets -> ${filename}`);
});

// Créer le fichier UPSERT final
const upsertFile = join(__dirname, '..', 'temp_sql_sheet_upsert_final.sql');
writeFileSync(upsertFile, upsertSection, 'utf-8');
console.log(`\n✅ Fichier UPSERT final: ${upsertFile}`);

console.log('\n💡 Fichiers prêts pour exécution séquentielle');






