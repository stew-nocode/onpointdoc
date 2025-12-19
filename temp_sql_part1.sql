-- OnpointDoc - Synchronisation des tickets depuis CSV (rest)
-- Date: 2025-12-08
-- Généré automatiquement depuis scripts/generate-sync-tickets-from-csv.mjs
-- Total: 1462 tickets
-- Note: Ces tickets sont pour des entreprises spécifiques (affects_all_companies = false)


-- ============================================
-- ÉTAPE 1: Créer la table temporaire

-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_tickets_csv (
  jira_issue_key TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ticket_type ticket_type_t,
  priority priority_t,
  canal canal_t,
  status TEXT NOT NULL,
  module_name TEXT,
  submodule_name TEXT,
  feature_name TEXT,
  bug_type bug_type_enum,
  reporter_name TEXT,
  contact_user_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);


-- ============================================
-- ÉTAPE 2: Insérer les données dans la table temporaire
