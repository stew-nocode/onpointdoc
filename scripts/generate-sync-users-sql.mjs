/**
 * Script pour générer le SQL complet de synchronisation des utilisateurs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_FILE = join(__dirname, '..', 'docs', 'ticket', 'client-users.csv - Feuille 2.csv');

// Lire et parser le CSV
const content = readFileSync(CSV_FILE, 'utf-8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l);

const header = lines[0].split(/[,;]/).map(c => c.trim().toLowerCase());
const nameIdx = header.findIndex(c => c.includes('utilisateur') || c.includes('rapporteur'));
const jobIdx = header.findIndex(c => c.includes('poste'));
const compIdx = header.findIndex(c => c.includes('entreprise'));

const users = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(/[,;]/).map(c => {
    let val = c.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val.trim();
  });
  
  const name = cols[nameIdx]?.trim();
  const job = jobIdx >= 0 ? cols[jobIdx]?.trim() : null;
  const comp = cols[compIdx]?.trim();
  
  // Ignorer les lignes sans nom ou entreprise, ou avec entreprise "ALL"
  if (!name || name === '' || !comp || comp === '' || comp === 'ALL') {
    continue;
  }
  
  users.push({ name, job, comp });
}

// Dédupliquer
const unique = Array.from(
  new Map(
    users.map(u => [
      `${u.name.toUpperCase()}|${u.comp.toUpperCase()}`,
      { name: u.name.trim(), job: u.job?.trim() || null, comp: u.comp.trim() }
    ])
  ).values()
);

// Générer les valeurs SQL
const values = unique.map(u => {
  const nameEscaped = u.name.replace(/'/g, "''");
  const jobEscaped = u.job ? u.job.replace(/'/g, "''") : null;
  const compEscaped = u.comp.replace(/'/g, "''");
  
  return `  ('${nameEscaped}', ${jobEscaped ? `'${jobEscaped}'` : 'NULL'}, '${compEscaped}')`;
}).join(',\n');

const sql = `-- OnpointDoc - Synchronisation des utilisateurs clients depuis CSV
-- Date: ${new Date().toISOString().split('T')[0]}
-- Généré automatiquement depuis scripts/generate-sync-users-sql.mjs
-- Total: ${unique.length} utilisateurs uniques

CREATE TEMP TABLE IF NOT EXISTS temp_client_users (
  full_name TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT NOT NULL,
  UNIQUE(full_name, company_name)
);

INSERT INTO temp_client_users (full_name, job_title, company_name) VALUES
${values}
ON CONFLICT (full_name, company_name) DO NOTHING;

DO $$
DECLARE
  v_user RECORD;
  v_company_id UUID;
  v_existing_user_id UUID;
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  FOR v_user IN 
    SELECT DISTINCT 
      t.full_name,
      t.job_title,
      t.company_name,
      c.id as company_id
    FROM temp_client_users t
    LEFT JOIN companies c ON UPPER(TRIM(c.name)) = UPPER(TRIM(t.company_name))
    WHERE t.full_name IS NOT NULL 
      AND TRIM(t.full_name) != ''
      AND t.company_name IS NOT NULL
      AND TRIM(t.company_name) != ''
  LOOP
    IF v_user.company_id IS NULL THEN
      RAISE NOTICE 'Entreprise non trouvée: % (utilisateur: %)', v_user.company_name, v_user.full_name;
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    SELECT id INTO v_existing_user_id
    FROM profiles
    WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_user.full_name))
      AND (company_id = v_user.company_id OR company_id IS NULL)
    LIMIT 1;
    
    IF v_existing_user_id IS NOT NULL THEN
      UPDATE profiles
      SET 
        company_id = COALESCE(company_id, v_user.company_id),
        job_title = COALESCE(job_title, v_user.job_title),
        role = CASE WHEN role IS NULL OR role = 'agent' THEN 'client' ELSE role END,
        is_active = COALESCE(is_active, true)
      WHERE id = v_existing_user_id
        AND (
          company_id IS DISTINCT FROM v_user.company_id OR
          job_title IS DISTINCT FROM v_user.job_title
        );
      
      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
        RAISE NOTICE 'Utilisateur mis à jour: % (entreprise: %)', v_user.full_name, v_user.company_name;
      ELSE
        v_skipped_count := v_skipped_count + 1;
      END IF;
    ELSE
      INSERT INTO profiles (
        full_name,
        job_title,
        company_id,
        role,
        is_active
      )
      VALUES (
        TRIM(v_user.full_name),
        NULLIF(TRIM(v_user.job_title), ''),
        v_user.company_id,
        'client',
        true
      );
      
      v_created_count := v_created_count + 1;
      RAISE NOTICE 'Utilisateur créé: % (entreprise: %, fonction: %)', v_user.full_name, v_user.company_name, v_user.job_title;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Utilisateurs créés: %', v_created_count;
  RAISE NOTICE 'Utilisateurs mis à jour: %', v_updated_count;
  RAISE NOTICE 'Utilisateurs ignorés: %', v_skipped_count;
END $$;

DROP TABLE IF EXISTS temp_client_users;
`;

// Sauvegarder dans un fichier
const outputFile = join(__dirname, '..', 'supabase', 'migrations', '2025-01-27-sync-client-users-complete.sql');
writeFileSync(outputFile, sql, 'utf-8');

console.log(`✅ SQL généré avec ${unique.length} utilisateurs uniques`);
console.log(`📁 Fichier sauvegardé: ${outputFile}`);

