/**
 * Script pour synchroniser les utilisateurs clients depuis Google Sheets
 * 
 * Usage:
 * 1. Exporter la feuille Google Sheets en CSV
 * 2. Placer le fichier CSV dans le dossier scripts/
 * 3. Exécuter: node scripts/sync-client-users-from-sheets.mjs
 * 
 * OU
 * 
 * 1. Mettre à jour le tableau USERS ci-dessous avec les données de la feuille
 * 2. Exécuter: node scripts/sync-client-users-from-sheets.mjs
 */

// ============================================
// DONNÉES À METTRE À JOUR DEPUIS LA FEUILLE GOOGLE SHEETS
// ============================================
// Colonnes: Rapporteur/Utilisateurs | Poste | Entreprises
// Ignorer les lignes sans utilisateur

const USERS = [
  // Exemples basés sur les données visibles dans la feuille
  { fullName: 'GNAHORE AMOS', jobTitle: 'Activation Specialist', company: 'ARIC' },
  { fullName: 'KONE Mariam', jobTitle: 'Contrôleur de Gestion', company: 'SIT BTP' },
  { fullName: "N'GBRA MOYE BERNICE DORIS", jobTitle: 'Directeur général', company: 'SIE-TRAVAUX' },
  { fullName: 'KOUAME KONAN GUY ROGER', jobTitle: 'Directeur général', company: 'SIE-TRAVAUX' },
  { fullName: 'EVA BASSE', jobTitle: 'Activation Specialist', company: 'KOFFI & DIABATE' },
  { fullName: 'Edwige KOUASSI', jobTitle: 'Directeur général', company: 'ONPOINT' },
  { fullName: 'Edwige KOUASSI', jobTitle: 'Helpdesk Manager', company: 'ONPOINT' },
  { fullName: 'Nadia Jocelyn Bouazo', jobTitle: 'Chef Comptable', company: 'CILAGRI' },
  { fullName: 'Florence OUAYOU', jobTitle: 'Consultant DAF', company: 'FIRST CAPITAL' },
  // TODO: Ajouter tous les autres utilisateurs de la feuille Google Sheets
];

// ============================================
// GÉNÉRATION DU SQL
// ============================================

function generateSQL(users) {
  // Filtrer les utilisateurs valides (avec nom et entreprise)
  const validUsers = users.filter(u => 
    u.fullName && 
    u.fullName.trim() !== '' && 
    u.company && 
    u.company.trim() !== ''
  );

  // Dédupliquer par (fullName, company)
  const uniqueUsers = Array.from(
    new Map(
      validUsers.map(u => [
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

  const sql = `-- OnpointDoc - Synchronisation des utilisateurs clients depuis Google Sheets
-- Date: ${new Date().toISOString().split('T')[0]}
-- Généré automatiquement depuis scripts/sync-client-users-from-sheets.mjs

-- ============================================
-- ÉTAPE 1: Table temporaire pour les données
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_client_users (
  full_name TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT NOT NULL,
  UNIQUE(full_name, company_name)
);

-- ============================================
-- ÉTAPE 2: Insérer les données
-- ============================================

INSERT INTO temp_client_users (full_name, job_title, company_name) VALUES
${values}
ON CONFLICT (full_name, company_name) DO NOTHING;

-- ============================================
-- ÉTAPE 3: Créer/mettre à jour les utilisateurs
-- ============================================

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

  return sql;
}

// ============================================
// EXÉCUTION
// ============================================

if (USERS.length === 0) {
  console.error('❌ Aucun utilisateur à traiter. Veuillez mettre à jour le tableau USERS.');
  process.exit(1);
}

const sql = generateSQL(USERS);
console.log('📝 SQL généré:');
console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log(`\n✅ ${USERS.length} utilisateur(s) à traiter`);
console.log('\n💡 Pour appliquer cette migration:');
console.log('   1. Copier le SQL ci-dessus');
console.log('   2. L\'appliquer via MCP Supabase ou directement dans Supabase SQL Editor');

