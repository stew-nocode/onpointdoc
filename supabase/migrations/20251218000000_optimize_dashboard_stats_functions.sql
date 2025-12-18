-- Migration : Fonctions PostgreSQL optimisées pour le dashboard
-- Date : 2025-12-18
-- Objectif : Réduire 6+ requêtes en 1 seule pour les KPIs statiques
-- Gain estimé : 6 requêtes → 1 requête (-83%)

-- Extension pour les statistiques
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =============================================
-- FONCTION 1 : Stats agrégées pour tous les types de tickets
-- =============================================

/**
 * Récupère les statistiques pour BUG, REQ et ASSISTANCE en 1 seule requête
 *
 * @param p_product_id - UUID du produit (optionnel, NULL = tous les produits)
 * @returns Table avec stats par type de ticket
 *
 * Gain : 6 requêtes → 1 requête (-83%)
 * Temps estimé : 150ms → 25ms (-83%)
 */
CREATE OR REPLACE FUNCTION public.get_all_ticket_stats(
  p_product_id UUID DEFAULT NULL
)
RETURNS TABLE (
  ticket_type TEXT,
  total BIGINT,
  resolus BIGINT,
  ouverts BIGINT,
  taux_resolution INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.ticket_type::TEXT,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE t.status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')) AS resolus,
    COUNT(*) FILTER (WHERE t.status NOT IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')) AS ouverts,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE t.status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done'))::NUMERIC / COUNT(*)::NUMERIC) * 100)::INTEGER
      ELSE 0
    END AS taux_resolution
  FROM public.tickets t
  WHERE
    t.ticket_type IN ('BUG', 'REQ', 'ASSISTANCE')
    AND (p_product_id IS NULL OR t.product_id = p_product_id)
  GROUP BY t.ticket_type;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION public.get_all_ticket_stats TO authenticated;

COMMENT ON FUNCTION public.get_all_ticket_stats IS
'Récupère les stats pour BUG, REQ et ASSISTANCE en 1 seule requête.
Gain: 6 requêtes → 1 requête (-83%).
Performance: ~25ms vs ~150ms pour 6 requêtes séparées.';

-- =============================================
-- FONCTION 2 : Stats de distribution par type (pour chart)
-- =============================================

/**
 * Récupère les stats de distribution pour le chart
 *
 * @param p_product_id - UUID du produit
 * @param p_period_start - Date de début ISO
 * @param p_period_end - Date de fin ISO
 * @returns Table avec distribution par type
 */
CREATE OR REPLACE FUNCTION public.get_tickets_distribution_stats(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  ticket_type TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  v_total BIGINT;
BEGIN
  -- Calculer le total d'abord
  SELECT COUNT(*) INTO v_total
  FROM public.tickets
  WHERE
    product_id = p_product_id
    AND created_at >= p_period_start
    AND created_at <= p_period_end;

  -- Retourner les stats par type avec pourcentage
  RETURN QUERY
  SELECT
    t.ticket_type::TEXT,
    COUNT(*) AS count,
    CASE
      WHEN v_total > 0 THEN
        ROUND((COUNT(*)::NUMERIC / v_total::NUMERIC) * 100, 1)
      ELSE 0
    END AS percentage
  FROM public.tickets t
  WHERE
    t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
    AND t.ticket_type IN ('BUG', 'REQ', 'ASSISTANCE')
  GROUP BY t.ticket_type;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION public.get_tickets_distribution_stats TO authenticated;

COMMENT ON FUNCTION public.get_tickets_distribution_stats IS
'Stats de distribution optimisées pour le chart Distribution.
Calcul du total + pourcentages en 1 seule fonction.';

-- =============================================
-- FONCTION 3 : Top companies par nombre de tickets
-- =============================================

/**
 * Récupère les N entreprises avec le plus de tickets
 *
 * @param p_product_id - UUID du produit
 * @param p_period_start - Date de début
 * @param p_period_end - Date de fin
 * @param p_limit - Nombre de résultats (défaut 10)
 * @returns Table avec top companies
 */
CREATE OR REPLACE FUNCTION public.get_top_companies_by_tickets(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  bug_count BIGINT,
  req_count BIGINT,
  assistance_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS company_id,
    c.name AS company_name,
    COUNT(*) FILTER (WHERE t.ticket_type = 'BUG') AS bug_count,
    COUNT(*) FILTER (WHERE t.ticket_type = 'REQ') AS req_count,
    COUNT(*) FILTER (WHERE t.ticket_type = 'ASSISTANCE') AS assistance_count,
    COUNT(*) AS total_count
  FROM public.tickets t
  INNER JOIN public.companies c ON t.company_id = c.id
  WHERE
    t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
  GROUP BY c.id, c.name
  ORDER BY total_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION public.get_top_companies_by_tickets TO authenticated;

COMMENT ON FUNCTION public.get_top_companies_by_tickets IS
'Récupère les top N entreprises par nombre de tickets.
Agrège BUG, REQ et ASSISTANCE en 1 seule requête avec FILTER.';

-- =============================================
-- FONCTION 4 : Stats des agents support
-- =============================================

/**
 * Récupère les stats de tous les agents support
 *
 * @param p_product_id - UUID du produit
 * @param p_period_start - Date de début
 * @param p_period_end - Date de fin
 * @returns Table avec stats par agent
 */
CREATE OR REPLACE FUNCTION public.get_support_agents_stats(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  agent_email TEXT,
  total_tickets BIGINT,
  resolved_tickets BIGINT,
  in_progress_tickets BIGINT,
  assistance_hours NUMERIC,
  resolution_rate INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS agent_id,
    p.full_name AS agent_name,
    p.email AS agent_email,
    COUNT(DISTINCT t.id) AS total_tickets,
    COUNT(DISTINCT t.id) FILTER (
      WHERE t.status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')
    ) AS resolved_tickets,
    COUNT(DISTINCT t.id) FILTER (
      WHERE t.status NOT IN ('Terminé(e)', 'Resolue', 'Closed', 'Done', 'Annulé')
    ) AS in_progress_tickets,
    COALESCE(
      ROUND(
        SUM(CASE
          WHEN t.ticket_type = 'ASSISTANCE' AND t.duration_minutes IS NOT NULL
          THEN t.duration_minutes::NUMERIC / 60
          ELSE 0
        END),
        1
      ),
      0
    ) AS assistance_hours,
    CASE
      WHEN COUNT(t.id) > 0 THEN
        ROUND((
          COUNT(*) FILTER (WHERE t.status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done'))::NUMERIC
          / COUNT(*)::NUMERIC
        ) * 100)::INTEGER
      ELSE 0
    END AS resolution_rate
  FROM public.profiles p
  LEFT JOIN public.tickets t ON (
    t.assigned_to = p.id
    AND t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
  )
  WHERE
    p.role IN ('agent_support', 'manager', 'direction')
    AND EXISTS (
      SELECT 1
      FROM public.tickets t2
      WHERE t2.assigned_to = p.id
        AND t2.product_id = p_product_id
    )
  GROUP BY p.id, p.full_name, p.email
  HAVING COUNT(t.id) > 0
  ORDER BY total_tickets DESC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.get_support_agents_stats TO authenticated;

COMMENT ON FUNCTION public.get_support_agents_stats IS
'Stats complètes des agents support avec tickets + heures assistance.
Optimisé avec FILTER pour éviter les sous-requêtes multiples.';

-- =============================================
-- FONCTION 5 : Évolution des tickets par granularité
-- =============================================

/**
 * Récupère l'évolution des tickets avec granularité adaptative
 *
 * @param p_product_id - UUID du produit
 * @param p_period_start - Date de début
 * @param p_period_end - Date de fin
 * @param p_granularity - 'day' | 'week' | 'month'
 * @returns Table avec évolution par période
 */
CREATE OR REPLACE FUNCTION public.get_tickets_evolution_stats(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_granularity TEXT DEFAULT 'day'
)
RETURNS TABLE (
  period_key TEXT,
  bug_count BIGINT,
  req_count BIGINT,
  assistance_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_granularity
      WHEN 'day' THEN TO_CHAR(t.created_at, 'YYYY-MM-DD')
      WHEN 'week' THEN TO_CHAR(DATE_TRUNC('week', t.created_at), 'YYYY-MM-DD')
      WHEN 'month' THEN TO_CHAR(t.created_at, 'YYYY-MM')
      ELSE TO_CHAR(t.created_at, 'YYYY-MM-DD')
    END AS period_key,
    COUNT(*) FILTER (WHERE t.ticket_type = 'BUG') AS bug_count,
    COUNT(*) FILTER (WHERE t.ticket_type = 'REQ') AS req_count,
    COUNT(*) FILTER (WHERE t.ticket_type = 'ASSISTANCE') AS assistance_count,
    COUNT(*) AS total_count
  FROM public.tickets t
  WHERE
    t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
  GROUP BY period_key
  ORDER BY period_key;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION public.get_tickets_evolution_stats TO authenticated;

COMMENT ON FUNCTION public.get_tickets_evolution_stats IS
'Évolution des tickets avec granularité adaptative (jour/semaine/mois).
Utilise FILTER pour agréger tous les types en 1 seule requête.';

-- =============================================
-- INDEX OPTIMISÉS pour ces fonctions
-- =============================================

-- Index composé optimisé pour les requêtes du dashboard
CREATE INDEX IF NOT EXISTS idx_tickets_dashboard_main
ON tickets(product_id, created_at DESC, ticket_type)
WHERE created_at IS NOT NULL;

-- Index pour le calcul des stats par status
CREATE INDEX IF NOT EXISTS idx_tickets_product_status
ON tickets(product_id, status)
WHERE status IS NOT NULL;

-- Index pour les requêtes d'agrégation par company
CREATE INDEX IF NOT EXISTS idx_tickets_company_date
ON tickets(company_id, created_at DESC, ticket_type)
WHERE company_id IS NOT NULL AND created_at IS NOT NULL;

-- Index pour les requêtes par agent assigné
CREATE INDEX IF NOT EXISTS idx_tickets_agent_stats
ON tickets(assigned_to, product_id, created_at, status)
WHERE assigned_to IS NOT NULL;

-- Index BRIN pour les grandes tables (>100k tickets)
-- Plus léger que B-tree pour les colonnes séquentielles
DROP INDEX IF EXISTS idx_tickets_created_at_brin;
CREATE INDEX idx_tickets_created_at_brin
ON tickets USING BRIN(created_at)
WITH (pages_per_range = 128);

-- Statistiques pour l'optimiseur de requêtes
ANALYZE tickets;

-- =============================================
-- COMMENTAIRES sur les index
-- =============================================

COMMENT ON INDEX idx_tickets_dashboard_main IS
'Index principal pour toutes les requêtes dashboard (product + date + type).
Utilisé par get_all_ticket_stats, get_tickets_distribution_stats, etc.';

COMMENT ON INDEX idx_tickets_product_status IS
'Index pour le calcul des taux de résolution (filtres par statut).
Optimise les COUNT(*) FILTER (WHERE status IN (...))';

COMMENT ON INDEX idx_tickets_company_date IS
'Index pour les stats par entreprise (top companies).
Utilisé par get_top_companies_by_tickets.';

COMMENT ON INDEX idx_tickets_agent_stats IS
'Index pour les stats des agents support.
Utilisé par get_support_agents_stats.';

COMMENT ON INDEX idx_tickets_created_at_brin IS
'Index BRIN léger pour les scans de grandes plages de dates.
Plus performant que B-tree pour les colonnes séquentielles.';

-- =============================================
-- VUES MATÉRIALISÉES (Optionnel - pour stats historiques)
-- =============================================

-- Vue matérialisée pour stats quotidiennes (rafraîchie 1x/jour)
-- Décommenter si besoin de performances extrêmes sur données historiques

/*
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_ticket_stats AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS stat_date,
  product_id,
  ticket_type,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE status IN ('Terminé(e)', 'Resolue', 'Closed', 'Done')) AS resolved_count
FROM tickets
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY stat_date, product_id, ticket_type;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX idx_mv_daily_stats_unique
ON mv_daily_ticket_stats(stat_date, product_id, ticket_type);

-- Rafraîchir automatiquement chaque nuit (via cron ou pg_cron)
-- SELECT cron.schedule('refresh-daily-stats', '0 1 * * *', $$
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_ticket_stats;
-- $$);

COMMENT ON MATERIALIZED VIEW mv_daily_ticket_stats IS
'Stats quotidiennes pré-calculées pour accélérer les requêtes sur données historiques.
Rafraîchir 1x/jour via REFRESH MATERIALIZED VIEW CONCURRENTLY.';
*/

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================
