/**
 * Script pour ajouter ON CONFLICT manquant pour contact_user_id
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function fixMissingConflict() {
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
      
      // Compter les ON CONFLICT
      const conflictCount = (content.match(/ON CONFLICT \(email\) DO UPDATE/g) || []).length;
      
      // Si il n'y a qu'un seul ON CONFLICT, il manque celui pour contact_user_id
      if (conflictCount === 1) {
        // Chercher le pattern pour contact_user_id sans ON CONFLICT
        const pattern = /(\s+true\s+\)\s+RETURNING id INTO v_contact_user_id;)/;
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            `\n        ON CONFLICT (email) DO UPDATE\n        SET \n          full_name = EXCLUDED.full_name,\n          company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),\n          job_title = COALESCE(EXCLUDED.job_title, profiles.job_title)\n        RETURNING id INTO v_contact_user_id;`
          );
          
          // Mettre à jour le message RAISE NOTICE
          content = content.replace(
            /RAISE NOTICE 'Contact utilisateur créé: % \(ID: %\)', v_ticket\.contact_user_name, v_contact_user_id;/g,
            "RAISE NOTICE 'Contact utilisateur créé/trouvé: % (ID: %)', v_ticket.contact_user_name, v_contact_user_id;"
          );
          
          modified = true;
        }
      }
      
      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✅ ${file} corrigé (ajout ON CONFLICT pour contact_user_id)`);
      } else {
        const status = conflictCount === 2 ? '✓' : '⚠️';
        console.log(`  ${status} ${file} (${conflictCount} ON CONFLICT)`);
      }
    }
    
    console.log('\n✨ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixMissingConflict();

