/**
 * Script pour remplacer tous les SELECT ... INTO et RETURNING ... INTO
 * par des assignations directes pour éviter les conflits PL/pgSQL
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');

async function fixAllIntoConflicts() {
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
      
      // 1. Remplacer SELECT ... INTO v_company_id
      if (content.includes('SELECT id INTO v_company_id')) {
        content = content.replace(
          /SELECT id INTO v_company_id\s+FROM companies\s+WHERE UPPER\(TRIM\(name\)\) = UPPER\(TRIM\(v_ticket\.client_name\)\)\s+LIMIT 1;/g,
          `v_company_id := (
        SELECT id
        FROM companies
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.client_name))
        LIMIT 1
      );`
        );
        modified = true;
      }
      
      // 2. Remplacer RETURNING id INTO v_company_id (companies)
      if (content.includes('RETURNING id INTO v_company_id') && content.includes('INSERT INTO companies')) {
        content = content.replace(
          /INSERT INTO companies \(name, country_id, focal_user_id, jira_company_id\)\s+VALUES \(TRIM\(v_ticket\.client_name\), NULL, NULL, NULL\)\s+RETURNING id INTO v_company_id;/g,
          `INSERT INTO companies (name, country_id, focal_user_id, jira_company_id)
        VALUES (TRIM(v_ticket.client_name), NULL, NULL, NULL);
        
        v_company_id := (
          SELECT id
          FROM companies
          WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.client_name))
          LIMIT 1
        );`
        );
        modified = true;
      }
      
      // 3. Remplacer SELECT ... INTO v_module_id
      if (content.includes('SELECT id INTO v_module_id')) {
        content = content.replace(
          /SELECT id INTO v_module_id\s+FROM modules\s+WHERE UPPER\(TRIM\(name\)\) = UPPER\(TRIM\(v_ticket\.module_name\)\)\s+LIMIT 1;/g,
          `v_module_id := (
          SELECT id
          FROM modules
          WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
          LIMIT 1
        );`
        );
        modified = true;
      }
      
      // 4. Remplacer RETURNING id INTO v_module_id
      if (content.includes('RETURNING id INTO v_module_id')) {
        content = content.replace(
          /INSERT INTO modules \(name, product_id\)\s+VALUES \(TRIM\(v_ticket\.module_name\), v_obc_product_id\)\s+RETURNING id INTO v_module_id;/g,
          `INSERT INTO modules (name, product_id)
          VALUES (TRIM(v_ticket.module_name), v_obc_product_id);
          
          v_module_id := (
            SELECT id
            FROM modules
            WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
            LIMIT 1
          );`
        );
        modified = true;
      }
      
      // 5. Remplacer SELECT ... INTO v_submodule_id
      if (content.includes('SELECT id INTO v_submodule_id')) {
        content = content.replace(
          /SELECT id INTO v_submodule_id\s+FROM submodules\s+WHERE module_id = v_module_id\s+AND UPPER\(TRIM\(name\)\) = UPPER\(TRIM\(v_ticket\.submodule_name\)\)\s+LIMIT 1;/g,
          `v_submodule_id := (
        SELECT id
        FROM submodules
        WHERE module_id = v_module_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
        LIMIT 1
      );`
        );
        modified = true;
      }
      
      // 6. Remplacer RETURNING id INTO v_submodule_id
      if (content.includes('RETURNING id INTO v_submodule_id')) {
        content = content.replace(
          /INSERT INTO submodules \(name, module_id\)\s+VALUES \(TRIM\(v_ticket\.submodule_name\), v_module_id\)\s+RETURNING id INTO v_submodule_id;/g,
          `INSERT INTO submodules (name, module_id)
        VALUES (TRIM(v_ticket.submodule_name), v_module_id);
        
        v_submodule_id := (
          SELECT id
          FROM submodules
          WHERE module_id = v_module_id
            AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
          LIMIT 1
        );`
        );
        modified = true;
      }
      
      // 7. Remplacer SELECT ... INTO v_created_by
      if (content.includes('SELECT id INTO v_created_by')) {
        content = content.replace(
          /SELECT id INTO v_created_by\s+FROM profiles\s+WHERE UPPER\(TRIM\(full_name\)\) = UPPER\(TRIM\(v_ticket\.reporter_name\)\)\s+LIMIT 1;/g,
          `v_created_by := (
        SELECT id
        FROM profiles
        WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
        LIMIT 1
      );`
        );
        modified = true;
      }
      
      // 8. Remplacer SELECT ... INTO v_contact_user_id
      if (content.includes('SELECT id INTO v_contact_user_id')) {
        content = content.replace(
          /SELECT id INTO v_contact_user_id\s+FROM profiles\s+WHERE UPPER\(TRIM\(full_name\)\) = UPPER\(TRIM\(v_ticket\.contact_user_name\)\)\s+AND \(v_company_id IS NULL OR company_id = v_company_id\)\s+LIMIT 1;/g,
          `v_contact_user_id := (
        SELECT id
        FROM profiles
        WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.contact_user_name))
          AND (v_company_id IS NULL OR company_id = v_company_id)
        LIMIT 1
      );`
        );
        modified = true;
      }
      
      // 9. Remplacer SELECT ... INTO v_existing_ticket_id
      if (content.includes('SELECT id INTO v_existing_ticket_id')) {
        content = content.replace(
          /SELECT id INTO v_existing_ticket_id\s+FROM tickets\s+WHERE jira_issue_key = v_ticket\.jira_issue_key\s+LIMIT 1;/g,
          `v_existing_ticket_id := (
      SELECT id
      FROM tickets
      WHERE jira_issue_key = v_ticket.jira_issue_key
      LIMIT 1
    );`
        );
        modified = true;
      }
      
      // 10. Corriger les INSERT INTO profiles pour reporter (created_by) - remplacer RETURNING
      if (content.includes('RETURNING id INTO v_created_by') && content.includes('INSERT INTO profiles')) {
        // Pattern complexe pour reporter
        const reporterPattern = /INSERT INTO profiles \(\s+full_name,\s+email,\s+role,\s+company_id,\s+is_active\s+\)\s+VALUES \([^)]+\)\s+ON CONFLICT \(email\) DO UPDATE\s+SET full_name = EXCLUDED\.full_name\s+RETURNING id INTO v_created_by;/gs;
        if (reporterPattern.test(content)) {
          content = content.replace(
            /(\s+true\s+\)\s+ON CONFLICT \(email\) DO UPDATE\s+SET full_name = EXCLUDED\.full_name\s+RETURNING id INTO v_created_by;)/,
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
      
      // 11. Corriger les INSERT INTO profiles pour contact_user - remplacer RETURNING
      if (content.includes('RETURNING id INTO v_contact_user_id') && content.includes('INSERT INTO profiles')) {
        // Pattern complexe pour contact_user
        const contactPattern = /(\s+true\s+\)\s+ON CONFLICT \(email\) DO UPDATE\s+SET[^R]+RETURNING id INTO v_contact_user_id;)/gs;
        if (contactPattern.test(content)) {
          content = content.replace(
            /(\s+true\s+\)\s+ON CONFLICT \(email\) DO UPDATE\s+SET[^R]+RETURNING id INTO v_contact_user_id;)/,
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
      
      // 12. Corriger les erreurs de syntaxe (manque true ou parenthèse)
      if (content.includes("'agent',\n          NULL,\n        ON CONFLICT")) {
        content = content.replace(
          /'agent',\s+NULL,\s+ON CONFLICT/g,
          "'agent',\n          NULL,\n          true\n        )\n        ON CONFLICT"
        );
        modified = true;
      }
      
      if (content.includes("'client',\n          v_company_id,\n          NULLIF(TRIM(v_ticket.job_title), ''),\n        ON CONFLICT")) {
        content = content.replace(
          /NULLIF\(TRIM\(v_ticket\.job_title\), ''\),\s+ON CONFLICT/g,
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
    
    console.log('\n✨ Correction terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixAllIntoConflicts();

