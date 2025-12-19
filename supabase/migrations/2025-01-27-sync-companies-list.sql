-- OnpointDoc - Synchronisation de la liste des entreprises
-- Date: 2025-01-27
-- Fusionne ONPOINT AFRICA GROUP vers ONPOINT et crée les entreprises manquantes

-- ============================================
-- ÉTAPE 1: Fusionner ONPOINT AFRICA GROUP vers ONPOINT
-- ============================================

-- Récupérer les IDs
DO $$
DECLARE
  v_onpoint_africa_group_id UUID := '9b477280-7465-4563-b199-e07b99c3e2e9';
  v_onpoint_id UUID;
  v_onpoint_country_id UUID;
  v_onpoint_focal_user_id UUID;
  v_onpoint_jira_company_id INTEGER;
BEGIN
  -- Récupérer l'ID de ONPOINT
  SELECT id INTO v_onpoint_id FROM companies WHERE name = 'ONPOINT';
  
  -- Si ONPOINT n'existe pas, le créer avec les données de ONPOINT AFRICA GROUP
  IF v_onpoint_id IS NULL THEN
    SELECT country_id, focal_user_id, jira_company_id 
    INTO v_onpoint_country_id, v_onpoint_focal_user_id, v_onpoint_jira_company_id
    FROM companies WHERE id = v_onpoint_africa_group_id;
    
    INSERT INTO companies (name, country_id, focal_user_id, jira_company_id)
    VALUES ('ONPOINT', v_onpoint_country_id, v_onpoint_focal_user_id, v_onpoint_jira_company_id)
    RETURNING id INTO v_onpoint_id;
  ELSE
    -- Si ONPOINT existe mais n'a pas de données, récupérer celles de ONPOINT AFRICA GROUP
    SELECT country_id, focal_user_id, jira_company_id 
    INTO v_onpoint_country_id, v_onpoint_focal_user_id, v_onpoint_jira_company_id
    FROM companies WHERE id = v_onpoint_africa_group_id;
    
    -- Mettre à jour ONPOINT avec les données de ONPOINT AFRICA GROUP si elles sont meilleures
    -- Note: jira_company_id seulement si ONPOINT n'en a pas déjà un (pour éviter conflit d'index unique)
    UPDATE companies
    SET 
      country_id = COALESCE(country_id, v_onpoint_country_id),
      focal_user_id = COALESCE(focal_user_id, v_onpoint_focal_user_id),
      jira_company_id = CASE 
        WHEN jira_company_id IS NULL THEN v_onpoint_jira_company_id
        ELSE jira_company_id
      END
    WHERE id = v_onpoint_id;
  END IF;
  
  -- Mettre à jour toutes les références AVANT de supprimer
  UPDATE profiles 
  SET company_id = v_onpoint_id 
  WHERE company_id = v_onpoint_africa_group_id;
  
  UPDATE tickets 
  SET company_id = v_onpoint_id 
  WHERE company_id = v_onpoint_africa_group_id;
  
  UPDATE ticket_company_link 
  SET company_id = v_onpoint_id 
  WHERE company_id = v_onpoint_africa_group_id;
  
  UPDATE company_sector_link 
  SET company_id = v_onpoint_id 
  WHERE company_id = v_onpoint_africa_group_id;
  
  -- IMPORTANT: Mettre jira_company_id à NULL pour ONPOINT AFRICA GROUP AVANT
  -- de mettre à jour ONPOINT (pour éviter conflit d'index unique)
  UPDATE companies
  SET jira_company_id = NULL
  WHERE id = v_onpoint_africa_group_id;
  
  -- Maintenant on peut mettre à jour ONPOINT avec les données de ONPOINT AFRICA GROUP
  UPDATE companies
  SET 
    country_id = COALESCE(country_id, v_onpoint_country_id),
    focal_user_id = COALESCE(focal_user_id, v_onpoint_focal_user_id),
    jira_company_id = COALESCE(jira_company_id, v_onpoint_jira_company_id)
  WHERE id = v_onpoint_id;
  
  -- Supprimer ONPOINT AFRICA GROUP
  DELETE FROM companies WHERE id = v_onpoint_africa_group_id;
END $$;

-- ============================================
-- ÉTAPE 2: Créer les entreprises manquantes
-- ============================================

-- Liste des entreprises à créer (noms uniques normalisés)
INSERT INTO companies (name)
SELECT DISTINCT company_name
FROM (VALUES
  ('ALL'),
  ('ARTIS HOLDING'),
  ('SIAM')
) AS new_companies(company_name)
WHERE NOT EXISTS (
  SELECT 1 FROM companies WHERE name = new_companies.company_name
)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- VÉRIFICATION: Compter les entreprises créées
-- ============================================

-- Afficher le nombre total d'entreprises
DO $$
DECLARE
  v_total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_count FROM companies;
  RAISE NOTICE 'Nombre total d''entreprises après synchronisation: %', v_total_count;
END $$;

