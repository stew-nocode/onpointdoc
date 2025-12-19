/**
 * Script pour corriger les INSERT INTO profiles avec ON CONFLICT
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function fixProfilesInsert() {
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
      
      // Pattern 1: INSERT pour rapporteur (created_by)
      const pattern1 = /INSERT INTO profiles \(\s+full_name,\s+email,\s+role,\s+company_id,\s+is_active\s+\)\s+VALUES \([^)]+\)\s+RETURNING id INTO v_created_by;/gs;
      const replacement1 = `INSERT INTO profiles (
          full_name,
          email,
          role,
          company_id,
          is_active
        )
        VALUES (
          TRIM(v_ticket.reporter_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
          'agent',
          NULL,
          true
        )
        ON CONFLICT (email) DO UPDATE
        SET full_name = EXCLUDED.full_name
        RETURNING id INTO v_created_by;`;
      
      if (pattern1.test(content)) {
        content = content.replace(pattern1, replacement1);
        modified = true;
      }
      
      // Pattern 2: INSERT pour contact utilisateur
      const pattern2 = /INSERT INTO profiles \(\s+full_name,\s+email,\s+role,\s+company_id,\s+job_title,\s+is_active\s+\)\s+VALUES \([^)]+\)\s+RETURNING id INTO v_contact_user_id;/gs;
      const replacement2 = `INSERT INTO profiles (
          full_name,
          email,
          role,
          company_id,
          job_title,
          is_active
        )
        VALUES (
          TRIM(v_ticket.contact_user_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local',
          'client',
          v_company_id,
          NULLIF(TRIM(v_ticket.job_title), ''),
          true
        )
        ON CONFLICT (email) DO UPDATE
        SET 
          full_name = EXCLUDED.full_name,
          company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
          job_title = COALESCE(EXCLUDED.job_title, profiles.job_title)
        RETURNING id INTO v_contact_user_id;`;
      
      if (pattern2.test(content)) {
        content = content.replace(pattern2, replacement2);
        modified = true;
      }
      
      // Mettre à jour les messages RAISE NOTICE
      content = content.replace(
        /RAISE NOTICE 'Rapporteur créé: % \(ID: %\)', v_ticket\.reporter_name, v_created_by;/g,
        "RAISE NOTICE 'Rapporteur créé/trouvé: % (ID: %)', v_ticket.reporter_name, v_created_by;"
      );
      
      content = content.replace(
        /RAISE NOTICE 'Contact utilisateur créé: % \(ID: %\)', v_ticket\.contact_user_name, v_contact_user_id;/g,
        "RAISE NOTICE 'Contact utilisateur créé/trouvé: % (ID: %)', v_ticket.contact_user_name, v_contact_user_id;"
      );
      
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

fixProfilesInsert();

