-- OnpointDoc - Synchronisation des utilisateurs clients depuis Google Sheets
-- Date: 2025-01-27
-- Crée les utilisateurs clients manquants basés sur leur nom complet, fonction et entreprise

-- ============================================
-- ÉTAPE 1: Table temporaire pour les données de la feuille
-- ============================================

-- Créer une table temporaire pour stocker les utilisateurs à synchroniser
CREATE TEMP TABLE IF NOT EXISTS temp_client_users (
  full_name TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT NOT NULL,
  UNIQUE(full_name, company_name)
);

-- ============================================
-- ÉTAPE 2: Insérer les données de la feuille Google Sheets
-- ============================================
-- NOTE: Les données doivent être insérées ici depuis la feuille Google Sheets
-- Format: (full_name, job_title, company_name)
-- Exemple basé sur les données visibles dans la feuille :

INSERT INTO temp_client_users (full_name, job_title, company_name) VALUES
  ('GNAHORE AMOS', 'Activation Specialist', 'ARIC'),
  ('KONE Mariam', 'Contrôleur de Gestion', 'SIT BTP'),
  ('N''GBRA MOYE BERNICE DORIS', 'Directeur général', 'SIE-TRAVAUX'),
  ('KOUAME KONAN GUY ROGER', 'Directeur général', 'SIE-TRAVAUX'),
  ('EVA BASSE', 'Activation Specialist', 'KOFFI & DIABATE'),
  ('Edwige KOUASSI', 'Directeur général', 'ONPOINT'),
  ('Edwige KOUASSI', 'Helpdesk Manager', 'ONPOINT'),
  ('Nadia Jocelyn Bouazo', 'Chef Comptable', 'CILAGRI'),
  ('Florence OUAYOU', 'Consultant DAF', 'FIRST CAPITAL')
ON CONFLICT (full_name, company_name) DO NOTHING;

-- ============================================
-- ÉTAPE 3: Créer les utilisateurs manquants
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
  -- Parcourir tous les utilisateurs de la table temporaire
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
    -- Vérifier si l'entreprise existe
    IF v_user.company_id IS NULL THEN
      RAISE NOTICE 'Entreprise non trouvée: % (utilisateur: %)', v_user.company_name, v_user.full_name;
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    -- Vérifier si l'utilisateur existe déjà par nom complet (et éventuellement entreprise)
    SELECT id INTO v_existing_user_id
    FROM profiles
    WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_user.full_name))
      AND (company_id = v_user.company_id OR company_id IS NULL)
    LIMIT 1;
    
    IF v_existing_user_id IS NOT NULL THEN
      -- Mettre à jour l'utilisateur existant si nécessaire
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
        RAISE NOTICE 'Utilisateur déjà existant (pas de changement): % (entreprise: %)', v_user.full_name, v_user.company_name;
      END IF;
    ELSE
      -- Créer un nouvel utilisateur client
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
  RAISE NOTICE 'Utilisateurs ignorés (déjà existants ou entreprise manquante): %', v_skipped_count;
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

DROP TABLE IF EXISTS temp_client_users;

