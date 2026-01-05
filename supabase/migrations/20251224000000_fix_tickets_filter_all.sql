-- Migration: Correction du filtre "Tous les tickets" (all)
-- Date: 2025-12-24
-- Objectif: Le filtre "all" doit retourner TOUS les tickets accessibles via RLS
--
-- Problème identifié:
-- Le filtre "all" appliquait un filtre restrictif (created_by, assigned_to, modules)
-- au lieu de laisser les RLS gérer les permissions.
--
-- Solution:
-- Modifier la fonction RPC pour que p_quick_filter = 'all' retourne
-- tous les tickets accessibles selon les RLS, sans filtre supplémentaire.

-- ============================================================================
-- CORRECTION DE LA FONCTION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.list_tickets_with_user_context(
  p_user_id UUID,
  p_quick_filter TEXT DEFAULT 'all',
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 25,
  p_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_sort_column TEXT DEFAULT 'created_at',
  p_sort_direction TEXT DEFAULT 'desc'
)
RETURNS SETOF ticket_list_result AS $$
DECLARE
  v_user_modules UUID[];
  v_has_modules BOOLEAN;
BEGIN
  -- ============================================================================
  -- Récupérer les modules affectés à l'utilisateur (uniquement pour filtres spécifiques)
  -- ============================================================================
  -- ✅ MODIFIÉ : Ne récupérer les modules que si nécessaire (filtres autres que 'all')
  -- Pour le filtre 'all', on laisse les RLS gérer les permissions
  IF p_quick_filter != 'all' AND p_user_id IS NOT NULL THEN
    SELECT ARRAY_AGG(module_id) INTO v_user_modules
    FROM user_module_assignments
    WHERE user_id = p_user_id;

    v_has_modules := v_user_modules IS NOT NULL AND array_length(v_user_modules, 1) > 0;
  ELSE
    v_has_modules := FALSE;
  END IF;

  -- ============================================================================
  -- Requête principale avec tous les filtres
  -- ============================================================================
  RETURN QUERY
  WITH filtered_tickets AS (
    SELECT
      t.id,
      t.title,
      t.description,
      t.ticket_type,
      t.status,
      t.priority,
      t.canal,
      t.jira_issue_key,
      t.origin,
      t.target_date,
      t.bug_type,
      t.created_at,
      t.updated_at,
      t.created_by,
      t.assigned_to,
      t.contact_user_id,
      t.product_id,
      t.module_id,
      t.submodule_id,
      t.feature_id,
      t.company_id,
      t.affects_all_companies,
      t.customer_context,
      t.duration_minutes,
      t.resolved_at,
      t.validated_by_manager,
      t.last_update_source,
      COUNT(*) OVER() AS total_count
    FROM tickets t
    WHERE
      -- ========================================================================
      -- FILTRES RAPIDES (QUICK FILTERS)
      -- ========================================================================
      (
        -- ✅ CORRIGÉ : Filtre "all" - Retourner tous les tickets accessibles via RLS
        -- Les RLS (Row Level Security) gèrent automatiquement les permissions
        -- Pas de filtre supplémentaire nécessaire
        (p_quick_filter = 'all')

        -- Filtre "mine": uniquement créés/assignés
        OR (p_quick_filter = 'mine' AND p_user_id IS NOT NULL AND (
          t.created_by = p_user_id OR t.assigned_to = p_user_id
        ))

        -- Filtre "unassigned": tickets non assignés
        OR (p_quick_filter = 'unassigned' AND t.assigned_to IS NULL)

        -- Filtre "overdue": tickets en retard
        OR (p_quick_filter = 'overdue' AND
          t.target_date IS NOT NULL AND
          t.target_date < CURRENT_DATE
        )

        -- Filtre "to_validate": tickets à valider (transférés)
        OR (p_quick_filter = 'to_validate' AND t.status = 'Transfere')

        -- Filtre "week": tickets de cette semaine
        OR (p_quick_filter = 'week' AND (
          t.created_at >= date_trunc('week', CURRENT_DATE)
          AND (p_user_id IS NULL OR t.created_by = p_user_id OR t.assigned_to = p_user_id)
        ))

        -- Filtre "month": tickets de ce mois
        OR (p_quick_filter = 'month' AND (
          t.created_at >= date_trunc('month', CURRENT_DATE)
          AND (p_user_id IS NULL OR t.created_by = p_user_id OR t.assigned_to = p_user_id)
        ))

        -- Filtre "bug_in_progress": bugs en cours
        OR (p_quick_filter = 'bug_in_progress' AND
          t.ticket_type = 'BUG' AND
          t.status IN ('Traitement en Cours', 'Test en Cours')
        )

        -- Filtre "req_in_progress": requêtes en cours
        OR (p_quick_filter = 'req_in_progress' AND
          t.ticket_type = 'REQ' AND
          t.status IN ('Traitement en Cours', 'Test en Cours')
        )

        -- Pas de filtre ou filtre inconnu: tous les tickets (comme 'all')
        OR (p_quick_filter IS NULL OR p_quick_filter NOT IN (
          'all', 'mine', 'unassigned', 'overdue', 'to_validate',
          'week', 'month', 'bug_in_progress', 'req_in_progress'
        ))
      )

      -- ========================================================================
      -- FILTRES BASIQUES (TYPE, STATUS)
      -- ========================================================================
      AND (p_type IS NULL OR t.ticket_type::TEXT = p_type)
      AND (p_status IS NULL OR t.status = p_status)

      -- ========================================================================
      -- FILTRES AGENT/COMPANY (MANAGERS)
      -- ========================================================================
      -- Filtre par agent: tickets créés OU assignés à cet agent
      AND (p_agent_id IS NULL OR (
        t.created_by = p_agent_id OR t.assigned_to = p_agent_id
      ))

      -- Filtre par entreprise
      AND (p_company_id IS NULL OR t.company_id = p_company_id)

      -- ========================================================================
      -- RECHERCHE TEXTUELLE
      -- ========================================================================
      AND (
        p_search IS NULL
        OR p_search = ''
        OR t.title ILIKE '%' || p_search || '%'
        OR t.description ILIKE '%' || p_search || '%'
        OR t.jira_issue_key ILIKE '%' || p_search || '%'
      )

    -- ==========================================================================
    -- TRI DYNAMIQUE
    -- ==========================================================================
    ORDER BY
      -- Tri par created_at (par défaut)
      CASE WHEN p_sort_column = 'created_at' AND p_sort_direction = 'desc'
        THEN t.created_at END DESC NULLS LAST,
      CASE WHEN p_sort_column = 'created_at' AND p_sort_direction = 'asc'
        THEN t.created_at END ASC NULLS LAST,

      -- Tri par status
      CASE WHEN p_sort_column = 'status' AND p_sort_direction = 'desc'
        THEN t.status END DESC NULLS LAST,
      CASE WHEN p_sort_column = 'status' AND p_sort_direction = 'asc'
        THEN t.status END ASC NULLS LAST,

      -- Tri par priority
      CASE WHEN p_sort_column = 'priority' AND p_sort_direction = 'desc'
        THEN t.priority END DESC NULLS LAST,
      CASE WHEN p_sort_column = 'priority' AND p_sort_direction = 'asc'
        THEN t.priority END ASC NULLS LAST,

      -- Tri par updated_at
      CASE WHEN p_sort_column = 'updated_at' AND p_sort_direction = 'desc'
        THEN t.updated_at END DESC NULLS LAST,
      CASE WHEN p_sort_column = 'updated_at' AND p_sort_direction = 'asc'
        THEN t.updated_at END ASC NULLS LAST,

      -- Tri par type
      CASE WHEN p_sort_column = 'type' AND p_sort_direction = 'desc'
        THEN t.ticket_type END DESC NULLS LAST,
      CASE WHEN p_sort_column = 'type' AND p_sort_direction = 'asc'
        THEN t.ticket_type END ASC NULLS LAST,

      -- Fallback: tri par created_at desc
      t.created_at DESC

    -- ==========================================================================
    -- PAGINATION
    -- ==========================================================================
    OFFSET p_offset
    LIMIT p_limit
  )
  SELECT
    id, title, description, ticket_type, status, priority,
    canal, jira_issue_key, origin, target_date, bug_type,
    created_at, updated_at, created_by, assigned_to, contact_user_id,
    product_id, module_id, submodule_id, feature_id, company_id,
    affects_all_companies, customer_context, duration_minutes,
    resolved_at, validated_by_manager, last_update_source,
    total_count
  FROM filtered_tickets;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- ============================================================================
-- MISE À JOUR DU COMMENTAIRE
-- ============================================================================

COMMENT ON FUNCTION public.list_tickets_with_user_context IS
'Fonction RPC optimisée pour lister les tickets avec contexte utilisateur.

✅ CORRECTION (2025-12-24):
- Le filtre "all" retourne maintenant TOUS les tickets accessibles via RLS
- Les RLS gèrent automatiquement les permissions selon le rôle de l''utilisateur
- Plus de filtre restrictif sur created_by/assigned_to/modules pour "all"

Avantages:
- Réduit 2-3 requêtes à 1 seule (modules affectés intégrés)
- Gère tous les quick filters en SQL (all, mine, unassigned, etc.)
- Support des filtres agent/company pour managers
- Tri dynamique optimisé
- Retourne le count total pour pagination

Performance:
- Utilise les index RLS créés précédemment
- STABLE PARALLEL SAFE pour optimisation query planner
- Évite les N+1 queries

Usage:
  SELECT * FROM list_tickets_with_user_context(
    p_user_id := ''user-uuid'',
    p_quick_filter := ''all'',
    p_offset := 0,
    p_limit := 25
  );
';

-- ============================================================================
-- ANALYSE POUR OPTIMISATION
-- ============================================================================

ANALYZE tickets;
ANALYZE user_module_assignments;

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction RPC list_tickets_with_user_context corrigée avec succès';
  RAISE NOTICE '📊 Filtre "all" retourne maintenant tous les tickets accessibles via RLS';
  RAISE NOTICE '🔐 Les permissions sont gérées automatiquement par les RLS';
END $$;

