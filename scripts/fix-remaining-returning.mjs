/**
 * Script pour remplacer tous les RETURNING ... INTO restants
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function fixRemainingReturning() {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.startsWith('2025-12-09-sync-assistance-tickets-part-') && f.endsWith('.sql'))
      .sort();
    
    console.log(`🔧 Correction des RETURNING ... INTO restants...\n`);
    
    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file);
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;
      
      // Pattern 1: RETURNING id INTO v_created_by (pour reporter)
      if (content.includes('RETURNING id INTO v_created_by')) {
        // Chercher le bloc complet
        const pattern = /(\s+true\s+\)\s+ON CONFLICT \(email\) DO UPDATE\s+SET full_name = EXCLUDED\.full_name\s+RETURNING id INTO v_created_by;)/g;
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            `\n        )
        ON CONFLICT (email) DO UPDATE
        SET full_name = EXCLUDED.full_name;
        
        -- Récupérer l'ID après l'INSERT
        v_created_by := (
          SELECT id
          FROM profiles
          WHERE email = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local'
          LIMIT 1
        );`
          );
          modified = true;
        }
      }
      
      // Pattern 2: RETURNING id INTO v_contact_user_id (pour contact)
      if (content.includes('RETURNING id INTO v_contact_user_id')) {
        // Chercher le bloc complet avec plusieurs SET
        const pattern = /(\s+true\s+\)\s+ON CONFLICT \(email\) DO UPDATE\s+SET\s+full_name = EXCLUDED\.full_name,\s+company_id = COALESCE\(EXCLUDED\.company_id, profiles\.company_id\),\s+job_title = COALESCE\(EXCLUDED\.job_title, profiles\.job_title\)\s+RETURNING id INTO v_contact_user_id;)/g;
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            `\n        )
        ON CONFLICT (email) DO UPDATE
        SET 
          full_name = EXCLUDED.full_name,
          company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
          job_title = COALESCE(EXCLUDED.job_title, profiles.job_title);
        
        -- Récupérer l'ID après l'INSERT
        v_contact_user_id := (
          SELECT id
          FROM profiles
          WHERE email = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9s]', '', 'g'), '\\s+', '.', 'g')) || '@assistance.onpoint.local'
          LIMIT 1
        );`
          );
          modified = true;
        }
      }
      
      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✅ ${file} corrigé`);
      } else {
        // Vérifier s'il reste des RETURNING
        const remaining = (content.match(/RETURNING.*INTO/g) || []).length;
        if (remaining > 0) {
          console.log(`  ⚠️  ${file} a encore ${remaining} RETURNING ... INTO`);
        } else {
          console.log(`  ✓ ${file} OK`);
        }
      }
    }
    
    console.log('\n✨ Correction terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixRemainingReturning();

