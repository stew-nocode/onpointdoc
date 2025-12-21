-- Migration: Ajouter le support du filtre includeOld à get_tickets_evolution_stats
-- Date: 2025-01-20
-- Description: Modifie la fonction RPC pour filtrer les tickets selon le flag 'old'

-- Supprimer l'ancienne fonction pour éviter le conflit de signature
DROP FUNCTION IF EXISTS public.get_tickets_evolution_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT);

-- Modifier la fonction pour ajouter le paramètre p_include_old
CREATE OR REPLACE FUNCTION public.get_tickets_evolution_stats(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_granularity TEXT DEFAULT 'day',
  p_include_old BOOLEAN DEFAULT true
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
    AND (p_include_old = true OR t.old = false)  -- ✅ Filtre conditionnel sur old
  GROUP BY period_key
  ORDER BY period_key;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- Réattribuer les permissions
GRANT EXECUTE ON FUNCTION public.get_tickets_evolution_stats TO authenticated;

-- Mettre à jour le commentaire de la fonction
COMMENT ON FUNCTION public.get_tickets_evolution_stats IS
'Évolution des tickets avec granularité adaptative (jour/semaine/mois).
Utilise FILTER pour agréger tous les types en 1 seule requête.
Supporte le filtre p_include_old pour exclure les données anciennes (old = true).';

