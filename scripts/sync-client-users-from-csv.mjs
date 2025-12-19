/**
 * Script pour synchroniser les utilisateurs clients depuis un fichier CSV
 * exporté de Google Sheets
 * 
 * Format CSV attendu:
 * - Colonnes: Rapporteur/Utilisateurs | Poste | Entreprises
 * - Encodage: UTF-8
 * - Séparateur: virgule ou point-virgule
 * 
 * Usage:
 * 1. Exporter la feuille Google Sheets en CSV
 * 2. Placer le fichier dans scripts/client-users.csv
 * 3. Exécuter: node scripts/sync-client-users-from-csv.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

const CSV_FILE = join(__dirname, '..', 'docs', 'ticket', 'client-users.csv - Feuille 2.csv');
const CSV_SEPARATOR = /[,;]/; // Supporte virgule ou point-virgule

// ============================================
// LECTURE ET PARSING DU CSV
// ============================================

function parseCSV(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    throw new Error('Le fichier CSV est vide');
  }
  
  // Détecter les colonnes (première ligne)
  const header = lines[0].split(CSV_SEPARATOR).map(col => col.trim().toLowerCase());
  
  // Trouver les indices des colonnes pertinentes
  const nameColIndex = header.findIndex(col => 
    col.includes('rapporteur') || 
    col.includes('utilisateur') || 
    col.includes('nom') ||
    col === 'rapporteur' ||
    col === 'utilisateurs'
  );
  
  const jobTitleColIndex = header.findIndex(col => 
    col.includes('poste') || 
    col.includes('fonction') ||
    col === 'poste'
  );
  
  const companyColIndex = header.findIndex(col => 
    col.includes('entreprise') || 
    col.includes('company') ||
    col === 'entreprises'
  );
  
  if (nameColIndex === -1) {
    throw new Error('Colonne "Rapporteur" ou "Utilisateurs" non trouvée dans le CSV');
  }
  
  if (companyColIndex === -1) {
    throw new Error('Colonne "Entreprises" non trouvée dans le CSV');
  }
  
  // Parser les données
  const users = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(CSV_SEPARATOR).map(col => {
      // Enlever les guillemets si présents
      return col.trim().replace(/^["']|["']$/g, '');
    });
    
    const fullName = cols[nameColIndex]?.trim();
    const jobTitle = jobTitleColIndex !== -1 ? cols[jobTitleColIndex]?.trim() : null;
    const company = cols[companyColIndex]?.trim();
    
    // Ignorer les lignes sans nom ou entreprise
    if (!fullName || fullName === '' || !company || company === '') {
      continue;
    }
    
    users.push({
      fullName,
      jobTitle: jobTitle || null,
      company
    });
  }
  
  return users;
}

// ============================================
// GÉNÉRATION DU SQL
// ============================================

function generateSQL(users) {
  // Dédupliquer par (fullName, company)
  const uniqueUsers = Array.from(
    new Map(
      users.map(u => [
        `${u.fullName.trim().toUpperCase()}|${u.company.trim().toUpperCase()}`,
        {
          fullName: u.fullName.trim(),
          jobTitle: u.jobTitle?.trim() || null,
          company: u.company.trim()
        }
      ])
    ).values()
  );

  // Générer les valeurs SQL
  const values = uniqueUsers.map(u => {
    const fullNameEscaped = u.fullName.replace(/'/g, "''");
    const jobTitleEscaped = u.jobTitle ? u.jobTitle.replace(/'/g, "''") : 'NULL';
    const companyEscaped = u.company.replace(/'/g, "''");
    
    return `  ('${fullNameEscaped}', ${jobTitleEscaped ? `'${jobTitleEscaped}'` : 'NULL'}, '${companyEscaped}')`;
  }).join(',\n');

  return `-- OnpointDoc - Synchronisation des utilisateurs clients depuis CSV
-- Date: ${new Date().toISOString().split('T')[0]}
-- Généré automatiquement depuis scripts/sync-client-users-from-csv.mjs

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
}

// ============================================
// EXÉCUTION
// ============================================

try {
  console.log('📖 Lecture du fichier CSV...');
  const csvContent = readFileSync(CSV_FILE, 'utf-8');
  
  console.log('🔍 Parsing des données...');
  const users = parseCSV(csvContent);
  
  if (users.length === 0) {
    console.error('❌ Aucun utilisateur valide trouvé dans le CSV');
    process.exit(1);
  }
  
  console.log(`✅ ${users.length} utilisateur(s) trouvé(s) dans le CSV`);
  
  // Dédupliquer
  const uniqueUsers = Array.from(
    new Map(
      users.map(u => [
        `${u.fullName.trim().toUpperCase()}|${u.company.trim().toUpperCase()}`,
        u
      ])
    ).values()
  );
  
  console.log(`📊 ${uniqueUsers.length} utilisateur(s) unique(s) après déduplication\n`);
  
  const sql = generateSQL(users);
  console.log('📝 SQL généré:');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
  console.log('\n💡 Pour appliquer cette migration:');
  console.log('   1. Copier le SQL ci-dessus');
  console.log('   2. L\'appliquer via MCP Supabase ou directement dans Supabase SQL Editor');
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`❌ Fichier non trouvé: ${CSV_FILE}`);
    console.error('\n💡 Instructions:');
    console.error('   1. Exporter la feuille Google Sheets en CSV');
    console.error('   2. Placer le fichier dans scripts/client-users.csv');
    console.error('   3. Relancer ce script');
  } else {
    console.error('❌ Erreur:', error.message);
  }
  process.exit(1);
}

