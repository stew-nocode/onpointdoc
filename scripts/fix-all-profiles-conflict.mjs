/**
 * Script pour ajouter ON CONFLICT à tous les INSERT INTO profiles
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function fixAllProfilesConflict() {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.startsWith('2025-12-09-sync-assistance-tickets-part-') && f.endsWith('.sql'))
      .sort();
    
    console.log(`🔧 Correction de ${migrationFiles.length} fichiers...\n`);
    
    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file);
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;
      
      // Correction 1: INSERT pour rapporteur (created_by)
      if (content.includes("RETURNING id INTO v_created_by;") && !content.includes("ON CONFLICT (email) DO UPDATE")) {
        content = content.replace(
          /(\s+true\s+\)\s+RETURNING id INTO v_created_by;)/,
          `\n        ON CONFLICT (email) DO UPDATE\n        SET full_name = EXCLUDED.full_name\n        RETURNING id INTO v_created_by;`
        );
        content = content.replace(
          /RAISE NOTICE 'Rapporteur créé: % \(ID: %\)', v_ticket\.reporter_name, v_created_by;/g,
          "RAISE NOTICE 'Rapporteur créé/trouvé: % (ID: %)', v_ticket.reporter_name, v_created_by;"
        );
        modified = true;
      }
      
      // Correction 2: INSERT pour contact utilisateur
      if (content.includes("RETURNING id INTO v_contact_user_id;") && !content.includes("ON CONFLICT (email) DO UPDATE")) {
        // Chercher le pattern spécifique pour contact_user_id
        const pattern = /(\s+true\s+\)\s+RETURNING id INTO v_contact_user_id;)/;
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            `\n        ON CONFLICT (email) DO UPDATE\n        SET \n          full_name = EXCLUDED.full_name,\n          company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),\n          job_title = COALESCE(EXCLUDED.job_title, profiles.job_title)\n        RETURNING id INTO v_contact_user_id;`
          );
          content = content.replace(
            /RAISE NOTICE 'Contact utilisateur créé: % \(ID: %\)', v_ticket\.contact_user_name, v_contact_user_id;/g,
            "RAISE NOTICE 'Contact utilisateur créé/trouvé: % (ID: %)', v_ticket.contact_user_name, v_contact_user_id;"
          );
          modified = true;
        }
      }
      
      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✅ ${file} corrigé`);
      } else {
        console.log(`  ✓ ${file} OK`);
      }
    }
    
    console.log('\n✨ Correction terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixAllProfilesConflict();

