/**
 * Script pour appliquer une migration SQL volumineuse en plusieurs parties
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-08-sync-tickets-from-sheet-1765293279327.sql');

// Lire le fichier SQL
const sql = readFileSync(SQL_FILE, 'utf-8');

// Diviser en parties logiques
const parts = sql.split('-- ============================================');

console.log(`📊 Fichier SQL divisé en ${parts.length} parties`);

// Partie 1: Création de la table temporaire + début INSERT
const part1End = sql.indexOf('-- ÉTAPE 3: UPSERT des tickets');
const part1 = sql.substring(0, part1End);

// Partie 2: UPSERT + nettoyage
const part2 = sql.substring(part1End);

console.log(`\n📦 Partie 1 (création table + INSERT): ${Math.round(part1.length / 1024)} KB`);
console.log(`📦 Partie 2 (UPSERT + nettoyage): ${Math.round(part2.length / 1024)} KB`);

// Diviser la partie 1 (INSERT) en lots plus petits
const insertStart = part1.indexOf('INSERT INTO temp_tickets_csv');
const insertEnd = part1.length;
const header = part1.substring(0, insertStart);
const insertSection = part1.substring(insertStart, insertEnd);

// Extraire les lignes VALUES individuelles
const valuesMatch = insertSection.match(/VALUES\s+(.+);/s);
if (!valuesMatch) {
  console.error('❌ Impossible de trouver la section VALUES');
  process.exit(1);
}

const valuesContent = valuesMatch[1];
// Diviser par lignes qui commencent par "  ('OD-"
const valueLines = valuesContent.split(/,\s*(?=\('OD-)/);

console.log(`\n📊 Total de lignes VALUES: ${valueLines.length}`);

// Diviser en lots de 100 tickets
const BATCH_SIZE = 100;
const batches = [];
for (let i = 0; i < valueLines.length; i += BATCH_SIZE) {
  batches.push(valueLines.slice(i, i + BATCH_SIZE));
}

console.log(`📦 Nombre de lots: ${batches.length}`);

// Générer les parties SQL
const sqlParts = [];

// Partie 0: Header (création table)
sqlParts.push({
  name: 'Partie 0: Création table temporaire',
  sql: header.trim()
});

// Parties 1-N: INSERT par lots
batches.forEach((batch, index) => {
  const batchSQL = `INSERT INTO temp_tickets_csv (
  jira_issue_key,
  title,
  description,
  ticket_type,
  priority,
  canal,
  status,
  module_name,
  submodule_name,
  feature_name,
  bug_type,
  reporter_name,
  contact_user_name,
  company_name,
  created_at,
  updated_at,
  resolved_at
) VALUES
${batch.join(',\n')};`;
  
  sqlParts.push({
    name: `Partie ${index + 1}: INSERT lot ${index + 1}/${batches.length} (${batch.length} tickets)`,
    sql: batchSQL
  });
});

// Dernière partie: UPSERT + nettoyage
sqlParts.push({
  name: 'Partie finale: UPSERT + nettoyage',
  sql: part2.trim()
});

console.log(`\n✅ ${sqlParts.length} parties SQL générées\n`);

// Afficher le résumé
sqlParts.forEach((part, index) => {
  console.log(`${index + 1}. ${part.name} (${Math.round(part.sql.length / 1024)} KB)`);
});

console.log('\n💡 Ces parties doivent être exécutées séquentiellement via Supabase MCP');












