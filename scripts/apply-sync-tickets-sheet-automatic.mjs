/**
 * Script automatique pour appliquer la migration SQL volumineuse
 * Exécute toutes les parties séquentiellement via l'API Supabase MCP
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-08-sync-tickets-from-sheet-1765293279327.sql');
const PROJECT_ID = 'xjcttqaiplnoalolebls';

// Lire le fichier SQL
const sql = readFileSync(SQL_FILE, 'utf-8');

// Diviser en parties logiques
const part1End = sql.indexOf('-- ÉTAPE 3: UPSERT des tickets');
const part1 = sql.substring(0, part1End); // Création table + INSERT
const part2 = sql.substring(part1End); // UPSERT + nettoyage

// Extraire les lignes VALUES
const insertStart = part1.indexOf('INSERT INTO temp_tickets_csv');
const header = part1.substring(0, insertStart);
const insertSection = part1.substring(insertStart);

// Extraire les lignes VALUES individuelles
const valuesMatch = insertSection.match(/VALUES\s+(.+);/s);
if (!valuesMatch) {
  console.error('❌ Impossible de trouver la section VALUES');
  process.exit(1);
}

const valuesContent = valuesMatch[1];
// Diviser par lignes qui commencent par "  ('OD-"
const valueLines = valuesContent.split(/,\s*(?=\('OD-)/);

console.log(`📊 Total de lignes VALUES: ${valueLines.length}`);

// Diviser en lots de 100 tickets
const BATCH_SIZE = 100;
const batches = [];
for (let i = 0; i < valueLines.length; i += BATCH_SIZE) {
  batches.push(valueLines.slice(i, i + BATCH_SIZE));
}

console.log(`📦 Nombre de lots: ${batches.length}\n`);

// Fonction pour exécuter SQL via fetch (simulation - vous devrez utiliser l'API réelle)
async function executeSQL(sqlQuery, description) {
  console.log(`⏳ ${description}...`);
  console.log(`   Taille: ${Math.round(sqlQuery.length / 1024)} KB`);
  
  // NOTE: Cette fonction doit être adaptée pour utiliser l'API Supabase réelle
  // Pour l'instant, elle affiche juste le SQL à exécuter
  // Vous pouvez utiliser: supabase-js, fetch vers l'API REST, ou MCP
  
  return { success: true };
}

// Exécuter séquentiellement
async function main() {
  try {
    // Partie 0: Création table
    console.log('\n📋 ÉTAPE 1: Création de la table temporaire');
    await executeSQL(header.trim(), 'Création table temporaire');
    console.log('✅ Table temporaire créée\n');

    // Parties 1-N: INSERT par lots
    console.log('📋 ÉTAPE 2: Insertion des tickets (par lots de 100)');
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
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
      
      await executeSQL(
        batchSQL,
        `Lot ${i + 1}/${batches.length} (${batch.length} tickets)`
      );
      console.log(`✅ Lot ${i + 1}/${batches.length} inséré\n`);
    }

    // Partie finale: UPSERT + nettoyage
    console.log('📋 ÉTAPE 3: UPSERT des tickets + nettoyage');
    await executeSQL(part2.trim(), 'UPSERT + nettoyage');
    console.log('✅ Migration terminée avec succès !\n');

    console.log('📊 RÉSUMÉ:');
    console.log(`   - Table temporaire créée`);
    console.log(`   - ${valueLines.length} tickets insérés`);
    console.log(`   - UPSERT effectué`);
    console.log(`   - Table temporaire supprimée`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Afficher les instructions
console.log('='.repeat(60));
console.log('📝 SCRIPT AUTOMATIQUE - APPLICATION DE LA MIGRATION SQL');
console.log('='.repeat(60));
console.log(`\n📁 Fichier: ${SQL_FILE}`);
console.log(`📊 Total tickets: ${valueLines.length}`);
console.log(`📦 Nombre de lots: ${batches.length}`);
console.log(`\n⚠️  NOTE: Ce script nécessite une adaptation pour utiliser l'API Supabase réelle.`);
console.log(`   Pour l'instant, il affiche uniquement la structure d'exécution.\n`);
console.log('='.repeat(60));
console.log('\n💡 OPTIONS DISPONIBLES:\n');
console.log('1. Installer Supabase CLI et utiliser:');
console.log('   supabase db push --file supabase/migrations/2025-12-08-sync-tickets-from-sheet-1765293279327.sql\n');
console.log('2. Utiliser l\'interface web Supabase (SQL Editor)\n');
console.log('3. Adapter ce script pour utiliser l\'API Supabase directement\n');

// Ne pas exécuter automatiquement - juste afficher les instructions
// Décommenter la ligne suivante pour exécuter:
// main();












