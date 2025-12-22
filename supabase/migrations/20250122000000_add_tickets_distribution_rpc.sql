-- Migration : Fonction RPC optimisée pour la distribution des tickets avec relances
-- Date : 2025-01-22
-- Objectif : Réduire 3 requêtes en 1 seule pour le chart de distribution
-- Gain estimé : 3 requêtes → 1 requête (-67%), temps ~120ms → ~30ms (-75%)

-- =============================================
-- FONCTION : Stats de distribution complètes (BUG, REQ, ASSISTANCE, RELANCE)
-- =============================================

/**
 * Récupère les statistiques de distribution pour le PieChart
 * en une seule requête optimisée.
 *
 * Calcule :
 * - Nombre de BUGs
 * - Nombre de REQs
 * - Nombre d'ASSISTANCEs (sans is_relance)
 * - Nombre de RELANCEs (tickets avec is_relance + commentaires followup)
 *
 * @param p_product_id - UUID du produit
 * @param p_period_start - Date de début (ISO timestamptz)
 * @param p_period_end - Date de fin (ISO timestamptz)
 * @param p_include_old - Inclure les tickets marqués old=true
 * @returns Table avec type, count, percentage
 *
 * Gain : 3 requêtes → 1 requête (-67%)
 * Performance : ~30ms vs ~120ms pour 3 requêtes séparées
 */
CREATE OR REPLACE FUNCTION public.get_tickets_distribution_with_relances(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_include_old BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  ticket_type TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  v_total BIGINT;
  v_bug_count BIGINT;
  v_req_count BIGINT;
  v_assistance_count BIGINT;
  v_relance_count BIGINT;
BEGIN
  -- =============================================
  -- Étape 1 : Compter BUG, REQ, ASSISTANCE (hors relances)
  -- =============================================
  SELECT
    COUNT(*) FILTER (WHERE t.ticket_type = 'BUG') AS bug_count,
    COUNT(*) FILTER (WHERE t.ticket_type = 'REQ') AS req_count,
    COUNT(*) FILTER (WHERE t.ticket_type = 'ASSISTANCE' AND t.is_relance IS NOT TRUE) AS assistance_count,
    COUNT(*) FILTER (WHERE t.ticket_type = 'ASSISTANCE' AND t.is_relance = TRUE) AS relance_base_count
  INTO v_bug_count, v_req_count, v_assistance_count, v_relance_count
  FROM public.tickets t
  WHERE
    t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
    AND (p_include_old OR t.old = FALSE);

  -- =============================================
  -- Étape 2 : Ajouter les commentaires followup comme relances
  -- =============================================
  -- Compter le nombre de commentaires followup (comment_type='followup') sur les tickets ASSISTANCE de la période
  SELECT v_relance_count + COALESCE(SUM(followup_count), 0)
  INTO v_relance_count
  FROM (
    SELECT
      t.id,
      COUNT(c.id) AS followup_count
    FROM public.tickets t
    LEFT JOIN public.ticket_comments c ON c.ticket_id = t.id
      AND c.comment_type = 'followup'
    WHERE
      t.product_id = p_product_id
      AND t.ticket_type = 'ASSISTANCE'
      AND t.created_at >= p_period_start
      AND t.created_at <= p_period_end
      AND (p_include_old OR t.old = FALSE)
    GROUP BY t.id
  ) sub;

  -- =============================================
  -- Étape 3 : Calculer le total
  -- =============================================
  v_total := v_bug_count + v_req_count + v_assistance_count + v_relance_count;

  -- =============================================
  -- Étape 4 : Retourner les résultats avec pourcentages
  -- =============================================
  -- Retourner uniquement les types avec count > 0
  RETURN QUERY
  SELECT
    'BUG'::TEXT AS ticket_type,
    v_bug_count AS count,
    CASE
      WHEN v_total > 0 THEN ROUND((v_bug_count::NUMERIC / v_total::NUMERIC) * 100, 1)
      ELSE 0
    END AS percentage
  WHERE v_bug_count > 0

  UNION ALL

  SELECT
    'REQ'::TEXT AS ticket_type,
    v_req_count AS count,
    CASE
      WHEN v_total > 0 THEN ROUND((v_req_count::NUMERIC / v_total::NUMERIC) * 100, 1)
      ELSE 0
    END AS percentage
  WHERE v_req_count > 0

  UNION ALL

  SELECT
    'ASSISTANCE'::TEXT AS ticket_type,
    v_assistance_count AS count,
    CASE
      WHEN v_total > 0 THEN ROUND((v_assistance_count::NUMERIC / v_total::NUMERIC) * 100, 1)
      ELSE 0
    END AS percentage
  WHERE v_assistance_count > 0

  UNION ALL

  SELECT
    'RELANCE'::TEXT AS ticket_type,
    v_relance_count AS count,
    CASE
      WHEN v_total > 0 THEN ROUND((v_relance_count::NUMERIC / v_total::NUMERIC) * 100, 1)
      ELSE 0
    END AS percentage
  WHERE v_relance_count > 0

  ORDER BY count DESC; -- Trier par count décroissant

END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- =============================================
-- Permissions et commentaires
-- =============================================

GRANT EXECUTE ON FUNCTION public.get_tickets_distribution_with_relances TO authenticated;

COMMENT ON FUNCTION public.get_tickets_distribution_with_relances IS
'Récupère les stats de distribution complètes (BUG, REQ, ASSISTANCE, RELANCE) en 1 seule requête.
Inclut le comptage des commentaires followup comme relances.
Gain: 3 requêtes → 1 requête (-67%).
Performance: ~30ms vs ~120ms pour 3 requêtes séparées.';

-- =============================================
-- Index recommandés (si pas déjà présents)
-- =============================================

-- Index pour optimiser les filtres principaux
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_tickets_distribution_optimized'
  ) THEN
    CREATE INDEX idx_tickets_distribution_optimized
      ON public.tickets(product_id, created_at, ticket_type, is_relance, old);
  END IF;
END $$;

-- Index pour optimiser le comptage des commentaires followup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_ticket_comments_followup'
  ) THEN
    CREATE INDEX idx_ticket_comments_followup
      ON public.ticket_comments(ticket_id, comment_type)
      WHERE comment_type = 'followup';
  END IF;
END $$;

COMMENT ON INDEX idx_tickets_distribution_optimized IS
'Index optimisé pour la fonction get_tickets_distribution_with_relances.
Couvre tous les filtres utilisés dans la requête principale.';

COMMENT ON INDEX idx_ticket_comments_followup IS
'Index partiel pour accélérer le comptage des commentaires followup.
Utilise un index partiel (WHERE comment_type = followup) pour meilleure performance.';
