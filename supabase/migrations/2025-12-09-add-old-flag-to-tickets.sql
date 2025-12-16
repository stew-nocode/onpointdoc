-- OnpointDoc - Ajout du champ booléen "old" aux tickets
-- Date: 2025-12-09
-- Description: Ajoute un champ booléen "old" pour marquer les tickets mis à jour aujourd'hui et hier
--              (assistance, BUG et REQUÊTE)
--              Hier est inclus pour récupérer les tickets BUG et REQUÊTE mis à jour hier

-- ============================================
-- ÉTAPE 1: Ajouter la colonne "old"
-- ============================================
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS old BOOLEAN NOT NULL DEFAULT false;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN public.tickets.old IS 'Indique si le ticket a été mis à jour lors de la migration des données historiques (2025-12-08 et 2025-12-09). Utilisé pour distinguer les anciens tickets des nouveaux.';

-- ============================================
-- ÉTAPE 2: Créer un index pour améliorer les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_old ON public.tickets(old);

-- ============================================
-- ÉTAPE 3: Marquer tous les tickets mis à jour aujourd'hui et hier
-- ============================================
-- Mettre à jour tous les tickets qui ont été créés ou mis à jour aujourd'hui ou hier
-- (assistance, BUG et REQUÊTE)
-- Note: Hier est inclus pour récupérer les tickets BUG et REQUÊTE mis à jour hier
UPDATE public.tickets
SET old = true
WHERE (
    DATE(updated_at) = CURRENT_DATE 
    OR DATE(created_at) = CURRENT_DATE
    OR DATE(updated_at) = CURRENT_DATE - INTERVAL '1 day'
    OR DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  )
  AND ticket_type IN ('ASSISTANCE', 'BUG', 'REQ');

-- ============================================
-- ÉTAPE 4: Afficher le résumé
-- ============================================
DO $$
DECLARE
  v_total_old INTEGER;
  v_assistance_old INTEGER;
  v_bug_old INTEGER;
  v_req_old INTEGER;
BEGIN
  -- Compter le total
  SELECT COUNT(*) INTO v_total_old
  FROM public.tickets
  WHERE old = true;
  
  -- Compter par type
  SELECT COUNT(*) INTO v_assistance_old
  FROM public.tickets
  WHERE old = true AND ticket_type = 'ASSISTANCE';
  
  SELECT COUNT(*) INTO v_bug_old
  FROM public.tickets
  WHERE old = true AND ticket_type = 'BUG';
  
  SELECT COUNT(*) INTO v_req_old
  FROM public.tickets
  WHERE old = true AND ticket_type = 'REQ';
  
  RAISE NOTICE '=== RÉSUMÉ MIGRATION "old" ===';
  RAISE NOTICE 'Total de tickets marqués comme "old": %', v_total_old;
  RAISE NOTICE '  - ASSISTANCE: %', v_assistance_old;
  RAISE NOTICE '  - BUG: %', v_bug_old;
  RAISE NOTICE '  - REQUÊTE: %', v_req_old;
END $$;

