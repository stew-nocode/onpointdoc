-- Migration: Créer la fonction RPC get_assistance_time_by_company_stats
-- Date: 2025-01-21
-- Description: Fonction optimisée pour calculer le temps d'interactions par entreprise
-- Les interactions = BUG + REQ + ASSISTANCE + RELANCES (toutes les communications entrantes)

-- Supprimer l'ancienne fonction si elle existe pour permettre la modification du type de retour
DROP FUNCTION IF EXISTS public.get_assistance_time_by_company_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_assistance_time_by_company_stats(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10,
  p_include_old BOOLEAN DEFAULT true
)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  total_minutes NUMERIC,
  total_hours NUMERIC,
  ticket_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH ticket_durations AS (
    -- Récupérer tous les tickets (BUG, REQ, ASSISTANCE) avec leur durée calculée
    SELECT
      t.id AS ticket_id,
      COALESCE(tcl.company_id, t.company_id) AS company_id,
      -- Calculer la durée : utiliser duration_minutes si disponible, limité à 480 minutes (8h)
      LEAST(
        COALESCE(
          NULLIF(t.duration_minutes, 0),
          0
        ),
        480
      ) AS duration_minutes
    FROM public.tickets t
    LEFT JOIN public.ticket_company_link tcl ON t.id = tcl.ticket_id
    WHERE
      t.product_id = p_product_id
      AND t.created_at >= p_period_start
      AND t.created_at <= p_period_end
      AND t.ticket_type IN ('BUG', 'REQ', 'ASSISTANCE')
      AND (p_include_old = true OR t.old = false)
      AND COALESCE(tcl.company_id, t.company_id) IS NOT NULL
  ),
  company_aggregates AS (
    -- Agréger par entreprise
    SELECT
      td.company_id,
      SUM(td.duration_minutes)::NUMERIC AS total_minutes,
      COUNT(*) AS ticket_count
    FROM ticket_durations td
    GROUP BY td.company_id
  ),
  company_names AS (
    -- Récupérer les noms des entreprises
    SELECT
      ca.company_id,
      COALESCE(c.name, 'Inconnu') AS company_name,
      ca.total_minutes,
      ca.ticket_count
    FROM company_aggregates ca
    LEFT JOIN public.companies c ON ca.company_id = c.id
  )
  SELECT
    cn.company_id,
    cn.company_name,
    cn.total_minutes,
    ROUND((cn.total_minutes / 60.0)::NUMERIC, 1) AS total_hours,
    cn.ticket_count
  FROM company_names cn
  ORDER BY cn.total_minutes DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- Réattribuer les permissions
GRANT EXECUTE ON FUNCTION public.get_assistance_time_by_company_stats TO authenticated;

-- Commentaire de la fonction
COMMENT ON FUNCTION public.get_assistance_time_by_company_stats IS
'Calcule le temps d''interactions par entreprise (Top N).
Les interactions = BUG + REQ + ASSISTANCE (durée basée sur duration_minutes, limitée à 480 minutes).
Utilise ticket_company_link si disponible, sinon company_id direct du ticket.
Supporte le filtre p_include_old pour exclure les données anciennes (old = true).';

