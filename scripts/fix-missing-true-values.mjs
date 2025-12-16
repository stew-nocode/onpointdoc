/**
 * Script pour corriger les VALUES manquants (true pour is_active)
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function fixMissingTrueValues() {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.startsWith('2025-12-09-sync-assistance-tickets-part-') && f.endsWith('.sql'))
      .sort();
    
    console.log(`🔧 Vérification de ${migrationFiles.length} fichiers...\n`);
    
    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file);
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;
      
      // Pattern 1: 'agent', NULL, ) ON CONFLICT (manque true)
      if (content.includes("'agent',\n          NULL,\n        )\n        ON CONFLICT")) {
        content = content.replace(
          /'agent',\s+NULL,\s+\)\s+ON CONFLICT/g,
          "'agent',\n          NULL,\n          true\n        )\n        ON CONFLICT"
        );
        modified = true;
      }
      
      // Pattern 2: NULLIF(TRIM(v_ticket.job_title), ''), ) ON CONFLICT (manque true)
      if (content.includes("NULLIF(TRIM(v_ticket.job_title), ''),\n        )\n        ON CONFLICT")) {
        content = content.replace(
          /NULLIF\(TRIM\(v_ticket\.job_title\), ''\),\s+\)\s+ON CONFLICT/g,
          "NULLIF(TRIM(v_ticket.job_title), ''),\n          true\n        )\n        ON CONFLICT"
        );
        modified = true;
      }
      
      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✅ ${file} corrigé`);
      } else {
        console.log(`  ✓ ${file} OK`);
      }
    }
    
    console.log('\n✨ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixMissingTrueValues();

