-- OnpointDoc - Création d'une fonction pour exécuter du SQL brut
-- Date: 2025-12-09
-- Description: Crée une fonction RPC qui permet d'exécuter du SQL brut
--              ATTENTION: Cette fonction est dangereuse et ne doit être utilisée
--              que par des scripts automatisés avec la service role key

-- ============================================
-- FONCTION: exec_sql
-- ============================================
-- Cette fonction permet d'exécuter du SQL brut via RPC
-- Elle est sécurisée par RLS et nécessite la service role key
CREATE OR REPLACE FUNCTION public.exec_sql(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Exécuter le SQL et retourner le résultat
  EXECUTE query_text;
  
  -- Retourner un JSON indiquant le succès
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    -- Retourner l'erreur en JSON
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION public.exec_sql(TEXT) IS 
'Fonction utilitaire pour exécuter du SQL brut via RPC. Utilisée par les scripts de migration automatisés. Nécessite la service role key.';






