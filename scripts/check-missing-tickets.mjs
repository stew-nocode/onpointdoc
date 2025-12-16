/**
 * Script pour vérifier quels tickets manquent dans la base de données
 */

import { readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function checkMissingTickets() {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.startsWith('2025-12-09-sync-assistance-tickets-part-') && f.endsWith('.sql'))
      .sort();
    
    console.log(`📊 Analyse des ${migrationFiles.length} fichiers de migration...\n`);
    
    const allTickets = new Set();
    
    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      
      // Extraire tous les OBCS-XXXXX
      const matches = content.matchAll(/OBCS-(\d+)/g);
      const ticketsInFile = new Set();
      
      for (const match of matches) {
        const ticketKey = `OBCS-${match[1]}`;
        ticketsInFile.add(ticketKey);
        allTickets.add(ticketKey);
      }
      
      console.log(`  ${file}: ${ticketsInFile.size} tickets uniques`);
    }
    
    console.log(`\n📈 Total de tickets uniques dans tous les fichiers: ${allTickets.size}`);
    console.log(`📋 Objectif: 5308 tickets`);
    console.log(`\n💡 Pour vérifier quels tickets manquent dans la base, exécutez :`);
    console.log(`   SELECT jira_issue_key FROM tickets WHERE ticket_type = 'ASSISTANCE' AND jira_issue_key LIKE 'OBCS-%';`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkMissingTickets();

