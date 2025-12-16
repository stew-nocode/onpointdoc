/**
 * Script pour vérifier précisément quels tickets manquent
 */

import { readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function verifyMissingTickets() {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.startsWith('2025-12-09-sync-assistance-tickets-part-') && f.endsWith('.sql'))
      .sort();
    
    console.log(`📊 Extraction des tickets depuis les fichiers SQL...\n`);
    
    const allTicketsFromFiles = new Map();
    
    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      
      // Extraire tous les OBCS-XXXXX avec leur ligne
      const matches = content.matchAll(/OBCS-(\d+)/g);
      const ticketsInFile = new Set();
      
      for (const match of matches) {
        const ticketKey = `OBCS-${match[1]}`;
        ticketsInFile.add(ticketKey);
        if (!allTicketsFromFiles.has(ticketKey)) {
          allTicketsFromFiles.set(ticketKey, file);
        }
      }
      
      console.log(`  ${file}: ${ticketsInFile.size} tickets`);
    }
    
    console.log(`\n📈 Total de tickets uniques dans les fichiers: ${allTicketsFromFiles.size}`);
    console.log(`📋 Objectif: 5308 tickets`);
    
    // Créer un fichier SQL pour vérifier les tickets manquants
    const ticketsList = Array.from(allTicketsFromFiles.keys())
      .map(key => `'${key}'`)
      .join(',\n    ');
    
    const checkQuery = `
-- Vérification des tickets manquants
SELECT 
  'Tickets dans les fichiers' as source,
  ${allTicketsFromFiles.size} as count
UNION ALL
SELECT 
  'Tickets dans la base' as source,
  COUNT(*)::INTEGER as count
FROM tickets
WHERE ticket_type = 'ASSISTANCE' 
  AND jira_issue_key IN (
    ${ticketsList}
  )
UNION ALL
SELECT 
  'Tickets manquants' as source,
  (${allTicketsFromFiles.size} - COUNT(*))::INTEGER as count
FROM tickets
WHERE ticket_type = 'ASSISTANCE' 
  AND jira_issue_key IN (
    ${ticketsList}
  );

-- Liste des tickets manquants (échantillon de 20)
SELECT 
  jira_issue_key as ticket_manquant
FROM (
  SELECT unnest(ARRAY[
    ${ticketsList}
  ]) as jira_issue_key
) t
WHERE jira_issue_key NOT IN (
  SELECT jira_issue_key
  FROM tickets
  WHERE ticket_type = 'ASSISTANCE'
)
LIMIT 20;
`;
    
    console.log(`\n💾 Requête SQL générée pour vérification`);
    console.log(`\n📝 Exécutez cette requête dans Supabase pour voir les tickets manquants :`);
    console.log(`\n${checkQuery.substring(0, 500)}...`);
    
    // Sauvegarder la requête
    const queryPath = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split', 'check-missing-tickets.sql');
    require('fs').writeFileSync(queryPath, checkQuery, 'utf-8');
    console.log(`\n✅ Requête sauvegardée dans: ${queryPath}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

verifyMissingTickets();

