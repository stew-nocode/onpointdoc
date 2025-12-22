-- Migration : Correction de la fonction get_tickets_by_company_stats
-- Date : 2025-01-23
-- Objectif : Corriger l'erreur "structure of query does not match function result type"
-- 
-- Problème identifié : 
-- 1. Le calcul de relance peut retourner un type incompatible
-- 2. company_id peut être NULL dans certains cas

-- Supprimer et recréer la fonction avec la correction
DROP FUNCTION IF EXISTS public.get_tickets_by_company_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, BOOLEAN) CASCADE;

CREATE OR REPLACE FUNCTION public.get_tickets_by_company_stats(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10,
  p_include_old BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  bug BIGINT,
  req BIGINT,
  assistance BIGINT,
  relance BIGINT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH ticket_company_mapping AS (
    -- Mapper tickets → companies (priorité: company_id direct, sinon via ticket_company_link)
    SELECT DISTINCT ON (t.id)
      t.id AS ticket_id,
      COALESCE(t.company_id, tcl.company_id) AS company_id
    FROM public.tickets t
    LEFT JOIN public.ticket_company_link tcl ON tcl.ticket_id = t.id
    WHERE
      t.product_id = p_product_id
      AND t.created_at >= p_period_start
      AND t.created_at <= p_period_end
      AND (p_include_old OR t.old = FALSE)
      AND COALESCE(t.company_id, tcl.company_id) IS NOT NULL -- ✅ Filtrer les tickets sans entreprise
  ),
  followup_counts AS (
    -- Compter les commentaires followup par ticket
    SELECT
      tc.ticket_id,
      COUNT(*)::BIGINT AS followup_count -- ✅ S'assurer que c'est BIGINT
    FROM ticket_company_mapping tc
    INNER JOIN public.tickets t ON t.id = tc.ticket_id
    INNER JOIN public.ticket_comments c ON c.ticket_id = t.id
    WHERE
      t.ticket_type = 'ASSISTANCE'
      AND c.comment_type = 'followup'
    GROUP BY tc.ticket_id
  ),
  company_stats AS (
    -- Agrégation par entreprise
    SELECT
      tcm.company_id,
      COALESCE(c.name, 'Inconnu') AS company_name,
      COUNT(*) FILTER (WHERE t.ticket_type = 'BUG') AS bug,
      COUNT(*) FILTER (WHERE t.ticket_type = 'REQ') AS req,
      COUNT(*) FILTER (
        WHERE t.ticket_type = 'ASSISTANCE'
          AND t.is_relance IS NOT TRUE
      ) AS assistance,
      -- Relances = tickets avec is_relance=true + commentaires followup
      -- ✅ CORRECTION : Calculer séparément puis additionner
      COUNT(*) FILTER (WHERE t.ticket_type = 'ASSISTANCE' AND t.is_relance = TRUE) AS relance_tickets,
      COALESCE(SUM(fc.followup_count), 0) AS relance_followups,
      COUNT(*) AS total
    FROM ticket_company_mapping tcm
    INNER JOIN public.tickets t ON t.id = tcm.ticket_id
    INNER JOIN public.companies c ON c.id = tcm.company_id
    LEFT JOIN followup_counts fc ON fc.ticket_id = t.id
    GROUP BY tcm.company_id, c.name
  )
  SELECT
    cs.company_id::UUID,
    cs.company_name::TEXT,
    cs.bug::BIGINT,
    cs.req::BIGINT,
    cs.assistance::BIGINT,
    (cs.relance_tickets::BIGINT + cs.relance_followups::BIGINT)::BIGINT AS relance,
    cs.total::BIGINT
  FROM company_stats cs
  ORDER BY cs.total DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION public.get_tickets_by_company_stats TO authenticated;

COMMENT ON FUNCTION public.get_tickets_by_company_stats IS
'Récupère les stats tickets par entreprise en 1 seule requête optimisée.
CORRIGÉ : Types explicites BIGINT pour correspondre à la déclaration RETURNS TABLE.';

