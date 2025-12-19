-- Migration: Optimisation des index RLS pour page /tickets
-- Date: 2025-12-20
-- Objectif: Réduire l'overhead RLS de -20% (100ms → 80ms)
--
-- Context: Les politiques RLS vérifient created_by et assigned_to sans index composé,
-- causant des sequential scans sur chaque requête (+100-200ms overhead).
--
-- Solution: Index composés optimisés pour RLS + INCLUDE pour éviter les lookups

-- ============================================================================
-- 1. INDEX RLS OWNERSHIP (CRITIQUE)
-- ============================================================================

-- Index composé pour les checks RLS created_by/assigned_to
-- Utilisé par: tickets_read_owner, tickets_read_assigned policies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_rls_ownership
ON tickets(created_by, assigned_to)
WHERE created_by IS NOT NULL OR assigned_to IS NOT NULL;

COMMENT ON INDEX idx_tickets_rls_ownership IS
'Index composé pour optimiser les politiques RLS ownership. Réduit sequential scans sur created_by/assigned_to.';

-- ============================================================================
-- 2. INDEX INCLUDE POUR ÉVITER LOOKUPS (CRITIQUE)
-- ============================================================================

-- Index avec INCLUDE pour éviter les lookups supplémentaires
-- PostgreSQL peut récupérer status, ticket_type, created_at directement depuis l'index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_created_assigned_combined
ON tickets(created_by)
INCLUDE (assigned_to, status, ticket_type, created_at)
WHERE created_by IS NOT NULL;

COMMENT ON INDEX idx_tickets_created_assigned_combined IS
'Index INCLUDE pour éviter les lookups. Contient les colonnes fréquemment accédées après le filtre RLS.';

-- ============================================================================
-- 3. INDEX PROFILES.ROLE POUR MANAGERS (CRITIQUE)
-- ============================================================================

-- Index pour la policy tickets_read_managers
-- Optimise: WHERE p.role::text LIKE '%manager%'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_managers
ON profiles(id)
INCLUDE (role)
WHERE role::text LIKE '%manager%'
   OR role::text IN ('director', 'daf', 'admin');

COMMENT ON INDEX idx_profiles_role_managers IS
'Index partiel pour optimiser le check RLS managers. Utilisé par la policy tickets_read_managers.';

-- ============================================================================
-- 4. INDEX MODULE_ID POUR FILTRE "ALL" (CRITIQUE)
-- ============================================================================

-- Index pour le filtre quickFilter = 'all' avec modules affectés
-- Optimise: WHERE module_id = ANY(assignedModuleIds)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_module_id
ON tickets(module_id)
WHERE module_id IS NOT NULL;

COMMENT ON INDEX idx_tickets_module_id IS
'Index pour optimiser le filtre "all" qui vérifie les modules affectés à l''utilisateur.';

-- ============================================================================
-- 5. INDEX COMPANY_ID POUR NOUVEAUX FILTRES (MOYEN)
-- ============================================================================

-- Index pour le nouveau filtre par entreprise (managers)
-- Optimise: WHERE company_id = $companyId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_company_id
ON tickets(company_id)
WHERE company_id IS NOT NULL;

COMMENT ON INDEX idx_tickets_company_id IS
'Index pour le filtre par entreprise (utilisé par les managers et admins).';

-- ============================================================================
-- 6. INDEX COMPOSÉ POUR FILTRE AGENT (MOYEN)
-- ============================================================================

-- Index composé pour le filtre par agent support
-- Optimise: WHERE created_by = $agentId OR assigned_to = $agentId
-- INCLUDE ajoute les colonnes de tri et filtrage fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_agent_filter
ON tickets(created_by, assigned_to, ticket_type, created_at DESC)
INCLUDE (status, company_id, priority);

COMMENT ON INDEX idx_tickets_agent_filter IS
'Index composé pour filtrer par agent (créateur ou assigné). Utilisé par les managers pour filtrer les tickets d''un agent spécifique.';

-- ============================================================================
-- 7. INDEX POUR TRI PAR PRIORITÉ (BONUS)
-- ============================================================================

-- Index pour le tri par priorité (colonne de tri disponible)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_priority_created_at
ON tickets(priority, created_at DESC)
WHERE priority IS NOT NULL;

COMMENT ON INDEX idx_tickets_priority_created_at IS
'Index pour tri par priorité avec fallback sur created_at.';

-- ============================================================================
-- 8. INDEX POUR TRI PAR UPDATED_AT (BONUS)
-- ============================================================================

-- Index pour le tri par date de modification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_updated_at_desc
ON tickets(updated_at DESC)
WHERE updated_at IS NOT NULL;

COMMENT ON INDEX idx_tickets_updated_at_desc IS
'Index pour tri par date de dernière modification.';

-- ============================================================================
-- ANALYSE DES TABLES
-- ============================================================================

-- Mettre à jour les statistiques PostgreSQL pour le query planner
ANALYZE tickets;
ANALYZE profiles;

-- ============================================================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ============================================================================

-- Requête pour vérifier que les index ont été créés
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'tickets'
    AND indexname LIKE 'idx_tickets_%'
    AND (
      indexname = 'idx_tickets_rls_ownership'
      OR indexname = 'idx_tickets_created_assigned_combined'
      OR indexname = 'idx_tickets_module_id'
      OR indexname = 'idx_tickets_company_id'
      OR indexname = 'idx_tickets_agent_filter'
      OR indexname = 'idx_tickets_priority_created_at'
      OR indexname = 'idx_tickets_updated_at_desc'
    );

  IF index_count = 7 THEN
    RAISE NOTICE '✅ Tous les index ont été créés avec succès (7/7)';
  ELSE
    RAISE WARNING '⚠️ Seulement % index créés sur 7 attendus', index_count;
  END IF;
END $$;

-- Afficher la taille des index créés
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'tickets'
  AND indexname LIKE 'idx_tickets_%'
ORDER BY pg_relation_size(indexrelid) DESC;
