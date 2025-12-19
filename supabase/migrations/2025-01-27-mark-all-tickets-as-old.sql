-- OnpointDoc - Marquer tous les tickets existants comme "old"
-- Date: 2025-01-27
-- Description: Marque tous les tickets existants (ASSISTANCE, BUG, REQ) comme "old"
--              pour indiquer qu'ils ont été mis à jour lors de la migration des données historiques.
--              Cette migration est idempotente et ne modifie que les tickets non marqués.

-- ============================================
-- ÉTAPE 1: Vérifier que la colonne existe
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'old'
  ) THEN
    RAISE EXCEPTION 'La colonne "old" n''existe pas dans la table tickets. Veuillez d''abord exécuter la migration 2025-12-09-add-old-flag-to-tickets.sql';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Marquer tous les tickets non marqués comme "old"
-- ============================================
-- Mettre à jour uniquement les tickets qui ne sont pas encore marqués comme "old"
UPDATE public.tickets
SET old = true
WHERE old = false
  AND ticket_type IN ('ASSISTANCE', 'BUG', 'REQ');

-- ============================================
-- ÉTAPE 3: Afficher le résumé
-- ============================================
DO $$
DECLARE
  v_total_tickets INTEGER;
  v_total_old INTEGER;
  v_assistance_old INTEGER;
  v_bug_old INTEGER;
  v_req_old INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- Compter le total
  SELECT COUNT(*) INTO v_total_tickets
  FROM public.tickets
  WHERE ticket_type IN ('ASSISTANCE', 'BUG', 'REQ');
  
  -- Compter les tickets marqués comme "old"
  SELECT COUNT(*) INTO v_total_old
  FROM public.tickets
  WHERE old = true
    AND ticket_type IN ('ASSISTANCE', 'BUG', 'REQ');
  
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
  
  -- Calculer le nombre de tickets mis à jour
  v_updated_count := v_total_old;
  
  RAISE NOTICE '=== RÉSUMÉ MIGRATION "mark-all-tickets-as-old" ===';
  RAISE NOTICE 'Total de tickets (ASSISTANCE, BUG, REQ): %', v_total_tickets;
  RAISE NOTICE 'Total de tickets marqués comme "old": %', v_total_old;
  RAISE NOTICE '  - ASSISTANCE: %', v_assistance_old;
  RAISE NOTICE '  - BUG: %', v_bug_old;
  RAISE NOTICE '  - REQUÊTE: %', v_req_old;
  RAISE NOTICE 'Pourcentage de tickets marqués: %%%', ROUND((v_total_old::numeric / NULLIF(v_total_tickets, 0) * 100)::numeric, 2);
END $$;

