-- ============================================
-- ÉTAPE 3: UPSERT des tickets
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_module_id UUID;
  v_submodule_id UUID;
  v_feature_id UUID;
  v_created_by UUID;
  v_contact_user_id UUID;
  v_company_id UUID;
  v_existing_ticket_id UUID;
  v_global_module_id UUID := '98ce1c5f-e53c-4baf-9af1-52255d499378';
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  FOR v_ticket IN
    SELECT * FROM temp_tickets_csv
    WHERE jira_issue_key IS NOT NULL
      AND TRIM(jira_issue_key) != ''
      AND title IS NOT NULL
      AND TRIM(title) != ''
  LOOP
    -- Rechercher le module
    IF v_ticket.module_name IS NOT NULL AND TRIM(v_ticket.module_name) != '' THEN
      IF UPPER(TRIM(v_ticket.module_name)) = 'GLOBAL' THEN
        v_module_id := v_global_module_id;
        v_submodule_id := NULL;
      ELSE
        SELECT id INTO v_module_id
        FROM modules
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
        LIMIT 1;
      END IF;
    ELSE
      v_module_id := NULL;
    END IF;
    
    -- Rechercher le sous-module
    IF v_module_id IS NOT NULL AND v_module_id != v_global_module_id AND v_ticket.submodule_name IS NOT NULL AND TRIM(v_ticket.submodule_name) != '' THEN
      IF UPPER(TRIM(v_ticket.submodule_name)) = 'GLOBAL' THEN
        v_submodule_id := NULL;
      ELSE
        SELECT id INTO v_submodule_id
        FROM submodules
        WHERE module_id = v_module_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
        LIMIT 1;
      END IF;
    ELSE
      v_submodule_id := NULL;
    END IF;
    
    -- Rechercher la fonctionnalité
    IF v_submodule_id IS NOT NULL AND v_ticket.feature_name IS NOT NULL AND TRIM(v_ticket.feature_name) != '' THEN
      IF UPPER(TRIM(v_ticket.feature_name)) = 'GLOBAL' THEN
        v_feature_id := NULL;
      ELSE
        SELECT id INTO v_feature_id
        FROM features
        WHERE submodule_id = v_submodule_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.feature_name))
        LIMIT 1;
      END IF;
    ELSE
      v_feature_id := NULL;
    END IF;
    
    -- Rechercher le rapporteur
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      SELECT id INTO v_created_by
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
      LIMIT 1;
    ELSE
      v_created_by := NULL;
    END IF;
    
    -- Rechercher l'utilisateur contact
    IF v_ticket.contact_user_name IS NOT NULL AND TRIM(v_ticket.contact_user_name) != '' THEN
      SELECT id INTO v_contact_user_id
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.contact_user_name))
      LIMIT 1;
    ELSE
      v_contact_user_id := NULL;
    END IF;
    
    -- Rechercher l'entreprise
    IF v_ticket.company_name IS NOT NULL AND TRIM(v_ticket.company_name) != '' THEN
      SELECT id INTO v_company_id
      FROM companies
      WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.company_name))
      LIMIT 1;
    ELSE
      v_company_id := NULL;
    END IF;
    
    -- Vérifier si le ticket existe déjà
    SELECT id INTO v_existing_ticket_id
    FROM tickets
    WHERE jira_issue_key = v_ticket.jira_issue_key
    LIMIT 1;
    
    -- UPSERT du ticket
    INSERT INTO tickets (
      jira_issue_key,
      title,
      description,
      ticket_type,
      priority,
      canal,
      status,
      module_id,
      submodule_id,
      feature_id,
      bug_type,
      created_by,
      contact_user_id,
      affects_all_companies,
      company_id,
      created_at,
      updated_at,
      resolved_at,
      origin
    )
    VALUES (
      v_ticket.jira_issue_key,
      v_ticket.title,
      NULLIF(TRIM(v_ticket.description), ''),
      v_ticket.ticket_type::ticket_type_t,
      v_ticket.priority::priority_t,
      v_ticket.canal::canal_t,
      v_ticket.status,
      v_module_id,
      v_submodule_id,
      v_feature_id,
      v_ticket.bug_type::bug_type_enum,
      v_created_by,
      v_contact_user_id,
      false,
      v_company_id,
      COALESCE(v_ticket.created_at, NOW()),
      COALESCE(v_ticket.updated_at, NOW()),
      v_ticket.resolved_at,
      'jira'::origin_t
    )
    ON CONFLICT (jira_issue_key) DO UPDATE
    SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      ticket_type = EXCLUDED.ticket_type,
      priority = EXCLUDED.priority,
      canal = EXCLUDED.canal,
      status = EXCLUDED.status,
      module_id = EXCLUDED.module_id,
      submodule_id = EXCLUDED.submodule_id,
      feature_id = EXCLUDED.feature_id,
      bug_type = EXCLUDED.bug_type,
      created_by = COALESCE(EXCLUDED.created_by, tickets.created_by),
      contact_user_id = COALESCE(EXCLUDED.contact_user_id, tickets.contact_user_id),
      affects_all_companies = EXCLUDED.affects_all_companies,
      company_id = EXCLUDED.company_id,
      updated_at = EXCLUDED.updated_at,
      resolved_at = EXCLUDED.resolved_at;
    
    -- Compter création vs mise à jour
    IF v_existing_ticket_id IS NULL THEN
      v_created_count := v_created_count + 1;
    ELSE
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Tickets créés: %', v_created_count;
  RAISE NOTICE 'Tickets mis à jour: %', v_updated_count;
  RAISE NOTICE 'Tickets ignorés: %', v_skipped_count;
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

DROP TABLE IF EXISTS temp_tickets_csv;
