-- Migration: Créer la fonction RPC get_followup_comments_count
-- Date: 2025-01-22
-- Description: Fonction optimisée pour compter les commentaires followup par ticket
-- Évite le problème HeadersOverflowError avec les requêtes .in() contenant de nombreux UUIDs

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.get_followup_comments_count(UUID, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_followup_comments_count(
  p_product_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_include_old BOOLEAN DEFAULT true
)
RETURNS TABLE (
  ticket_id UUID,
  followup_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS ticket_id,
    COUNT(tc.id)::BIGINT AS followup_count
  FROM public.tickets t
  LEFT JOIN public.ticket_comments tc ON (
    tc.ticket_id = t.id
    AND tc.comment_type = 'followup'
  )
  WHERE
    t.product_id = p_product_id
    AND t.created_at >= p_period_start
    AND t.created_at <= p_period_end
    AND t.ticket_type = 'ASSISTANCE'
    AND (p_include_old = true OR t.old = false)
  GROUP BY t.id
  HAVING COUNT(tc.id) > 0;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- Réattribuer les permissions
GRANT EXECUTE ON FUNCTION public.get_followup_comments_count TO authenticated;

-- Commentaire de la fonction
COMMENT ON FUNCTION public.get_followup_comments_count IS
'Compte les commentaires followup (relances) par ticket ASSISTANCE pour une période donnée.
Retourne uniquement les tickets qui ont au moins un commentaire followup.
Supporte le filtre p_include_old pour exclure les données anciennes (old = true).
Évite le problème HeadersOverflowError en faisant l''agrégation directement en base.';



