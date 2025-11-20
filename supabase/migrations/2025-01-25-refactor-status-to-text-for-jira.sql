-- OnpointDoc - Refactoring des statuts pour supporter les statuts JIRA bruts
-- Date: 2025-01-25
-- Objectif: Changer le champ status de ENUM à TEXT pour accepter les statuts JIRA originaux
-- 
-- Contexte:
-- - BUG et REQ: doivent stocker les statuts JIRA bruts (Sprint Backlog, Traitement en Cours, Test en Cours, Terminé(e))
-- - ASSISTANCE: statuts locaux (Nouveau, En_cours, Resolue) jusqu'au transfert, puis statuts JIRA après
--
-- Cette migration est sécurisée et préserve toutes les données existantes

-------------------------------
-- 1. SAUVEGARDE DES DONNÉES EXISTANTES
-------------------------------
-- Créer une table temporaire pour sauvegarder les statuts actuels
CREATE TABLE IF NOT EXISTS public._tickets_status_backup AS
SELECT id, status::text as status_backup
FROM public.tickets;

COMMENT ON TABLE public._tickets_status_backup IS 'Sauvegarde temporaire des statuts avant migration';

-------------------------------
-- 2. CHANGER LE TYPE DE COLONNE status
-------------------------------
-- Étape 1: Créer une nouvelle colonne TEXT temporaire
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS status_new TEXT;

-- Étape 2: Copier les valeurs de l'ENUM vers TEXT
UPDATE public.tickets
SET status_new = status::text;

-- Étape 3: Supprimer l'ancienne colonne ENUM
ALTER TABLE public.tickets
  DROP COLUMN IF EXISTS status;

-- Étape 4: Renommer la nouvelle colonne
ALTER TABLE public.tickets
  RENAME COLUMN status_new TO status;

-- Étape 5: Ajouter la contrainte NOT NULL et la valeur par défaut
ALTER TABLE public.tickets
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'Nouveau';

-- Étape 6: Recréer l'index (s'il existait)
DROP INDEX IF EXISTS idx_tickets_status;
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

COMMENT ON COLUMN public.tickets.status IS 'Statut du ticket. Pour BUG/REQ: statuts JIRA bruts (Sprint Backlog, Traitement en Cours, etc.). Pour ASSISTANCE: statuts locaux (Nouveau, En_cours, Resolue) ou JIRA après transfert.';

-------------------------------
-- 3. NETTOYER L'ENUM SI PLUS UTILISÉ
-------------------------------
-- Note: On garde l'ENUM ticket_status_t pour compatibilité avec d'autres tables si nécessaire
-- On ne le supprime pas pour éviter de casser d'autres dépendances potentielles

-------------------------------
-- 4. VALIDATION
-------------------------------
DO $$
DECLARE
  total_tickets INTEGER;
  tickets_with_status INTEGER;
  status_types_count INTEGER;
BEGIN
  -- Vérifier que tous les tickets ont un statut
  SELECT COUNT(*) INTO total_tickets FROM public.tickets;
  SELECT COUNT(*) INTO tickets_with_status FROM public.tickets WHERE status IS NOT NULL;
  
  IF tickets_with_status != total_tickets THEN
    RAISE WARNING 'Migration: % tickets sur % ont un statut NULL', tickets_with_status, total_tickets;
  ELSE
    RAISE NOTICE 'Migration réussie: Tous les % tickets ont un statut valide', total_tickets;
  END IF;
  
  -- Vérifier la diversité des statuts
  SELECT COUNT(DISTINCT status) INTO status_types_count FROM public.tickets;
  RAISE NOTICE 'Migration: % types de statuts différents trouvés', status_types_count;
  
  -- Afficher les statuts uniques
  RAISE NOTICE 'Statuts trouvés: %', (
    SELECT string_agg(DISTINCT status, ', ' ORDER BY status)
    FROM public.tickets
  );
END $$;

-------------------------------
-- 5. NETTOYAGE (optionnel, à faire après validation)
-------------------------------
-- La table de sauvegarde peut être supprimée après validation manuelle
-- DROP TABLE IF EXISTS public._tickets_status_backup;

