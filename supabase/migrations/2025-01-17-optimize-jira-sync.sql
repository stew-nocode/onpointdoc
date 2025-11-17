-- OnpointDoc - Optimisation Synchronisation JIRA
-- Date: 2025-01-17
-- Objectif: Optimiser les index et contraintes pour la synchronisation complète JIRA ↔ Supabase

-------------------------------
-- 1. INDEX jira_sync pour recherches fréquentes
-------------------------------
-- Optimise les recherches par origine et clé JIRA lors de la synchronisation continue
CREATE INDEX IF NOT EXISTS idx_jira_sync_origin_key 
ON public.jira_sync(origin, jira_issue_key) 
WHERE jira_issue_key IS NOT NULL;

COMMENT ON INDEX idx_jira_sync_origin_key IS 
'Optimise les recherches par origine et clé JIRA lors de la synchronisation continue';

-------------------------------
-- 2. INDEX monitoring erreurs de synchronisation
-------------------------------
-- Optimise le monitoring des erreurs de synchronisation
CREATE INDEX IF NOT EXISTS idx_jira_sync_errors 
ON public.jira_sync(sync_error, last_synced_at) 
WHERE sync_error IS NOT NULL;

COMMENT ON INDEX idx_jira_sync_errors IS 
'Optimise le monitoring des erreurs de synchronisation (requêtes fréquentes)';

-------------------------------
-- 3. INDEX ticket_status_history
-------------------------------
-- Optimise les jointures pour récupérer l'historique des statuts
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket 
ON public.ticket_status_history(ticket_id);

-- Optimise les recherches par source et date
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_source 
ON public.ticket_status_history(source, changed_at);

COMMENT ON INDEX idx_ticket_status_history_ticket IS 
'Optimise les jointures pour récupérer l''historique des statuts d''un ticket';

COMMENT ON INDEX idx_ticket_status_history_source IS 
'Optimise les recherches par source (supabase/jira) et date de changement';

-------------------------------
-- 4. INDEX ticket_comments
-------------------------------
-- Optimise le filtrage des commentaires par origine
CREATE INDEX IF NOT EXISTS idx_ticket_comments_origin 
ON public.ticket_comments(ticket_id, origin, created_at);

COMMENT ON INDEX idx_ticket_comments_origin IS 
'Optimise le filtrage des commentaires par ticket, origine et date';

-------------------------------
-- 5. INDEX tickets.origin
-------------------------------
-- Optimise le filtrage des tickets par source (supabase/jira)
CREATE INDEX IF NOT EXISTS idx_tickets_origin 
ON public.tickets(origin) 
WHERE origin IS NOT NULL;

COMMENT ON INDEX idx_tickets_origin IS 
'Optimise le filtrage des tickets par source (supabase/jira)';

-------------------------------
-- 6. INDEX tickets.last_update_source
-------------------------------
-- Optimise les vérifications de source de dernière mise à jour (règles anti-boucle)
CREATE INDEX IF NOT EXISTS idx_tickets_update_source 
ON public.tickets(last_update_source) 
WHERE last_update_source IS NOT NULL;

COMMENT ON INDEX idx_tickets_update_source IS 
'Optimise les vérifications de source de dernière mise à jour (règles anti-boucle N8N)';

-------------------------------
-- 7. CONTRAINTE NOT NULL jira_sync.ticket_id
-------------------------------
-- Garantit l'intégrité : chaque entrée jira_sync doit avoir un ticket associé
-- ATTENTION: Vérifier qu'il n'y a pas de données NULL avant d'appliquer
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.jira_sync WHERE ticket_id IS NULL) THEN
    RAISE EXCEPTION 'Des enregistrements jira_sync ont ticket_id NULL. Corriger avant d''appliquer NOT NULL.';
  END IF;
END $$;

ALTER TABLE public.jira_sync 
ALTER COLUMN ticket_id SET NOT NULL;

COMMENT ON COLUMN public.jira_sync.ticket_id IS 
'ID du ticket associé (NOT NULL pour garantir l''intégrité)';

-------------------------------
-- VALIDATION
-------------------------------
-- Vérifier que tous les index sont créés
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('tickets', 'jira_sync', 'ticket_status_history', 'ticket_comments')
    AND indexname LIKE 'idx_%';
  
  IF index_count < 6 THEN
    RAISE WARNING 'Seulement % index créés sur 6 attendus. Vérifier manuellement.', index_count;
  ELSE
    RAISE NOTICE 'Migration réussie: % index créés/validés.', index_count;
  END IF;
END $$;

