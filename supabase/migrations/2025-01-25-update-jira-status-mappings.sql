-- OnpointDoc - Mise à jour des mappings de statuts JIRA pour BUG et REQ
-- Date: 2025-01-25
-- Objectif: Ajouter les mappings exacts des statuts utilisés par les développeurs
--
-- Statuts JIRA réels utilisés:
-- - Sprint Backlog (statut initial)
-- - Traitement en Cours (en développement)
-- - Test en Cours (en test)
-- - Terminé(e) (résolu)

-------------------------------
-- 1. SUPPRIMER LES ANCIENS MAPPINGS OBSOLÈTES
-------------------------------
-- Supprimer les mappings qui ne correspondent pas aux statuts réels
DELETE FROM public.jira_status_mapping
WHERE (jira_status_name, ticket_type) IN (
  -- Mappings obsolètes pour BUG/REQ (on garde ceux pour ASSISTANCE)
  SELECT jira_status_name, ticket_type
  FROM public.jira_status_mapping
  WHERE ticket_type IN ('BUG', 'REQ')
    AND jira_status_name NOT IN ('Sprint Backlog', 'Traitement en Cours', 'Test en Cours', 'Terminé(e)', 'Terminé')
);

-------------------------------
-- 2. AJOUTER LES MAPPINGS CORRECTS POUR BUG
-------------------------------
INSERT INTO public.jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES
  -- Statut initial
  ('Sprint Backlog', 'Sprint Backlog', 'BUG'),
  
  -- Statuts en cours
  ('Traitement en Cours', 'Traitement en Cours', 'BUG'),
  ('Test en Cours', 'Test en Cours', 'BUG'),
  
  -- Statut final
  ('Terminé(e)', 'Terminé(e)', 'BUG'),
  ('Terminé', 'Terminé(e)', 'BUG') -- Variante sans parenthèse
ON CONFLICT (jira_status_name, ticket_type) 
DO UPDATE SET 
  supabase_status = EXCLUDED.supabase_status,
  updated_at = NOW();

-------------------------------
-- 3. AJOUTER LES MAPPINGS CORRECTS POUR REQ
-------------------------------
INSERT INTO public.jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES
  -- Statut initial
  ('Sprint Backlog', 'Sprint Backlog', 'REQ'),
  
  -- Statuts en cours
  ('Traitement en Cours', 'Traitement en Cours', 'REQ'),
  ('Test en Cours', 'Test en Cours', 'REQ'),
  
  -- Statut final
  ('Terminé(e)', 'Terminé(e)', 'REQ'),
  ('Terminé', 'Terminé(e)', 'REQ') -- Variante sans parenthèse
ON CONFLICT (jira_status_name, ticket_type) 
DO UPDATE SET 
  supabase_status = EXCLUDED.supabase_status,
  updated_at = NOW();

-------------------------------
-- 4. MAPPINGS POUR ASSISTANCE (après transfert)
-------------------------------
-- Les ASSISTANCE transférés utilisent les mêmes statuts JIRA que BUG/REQ
INSERT INTO public.jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES
  ('Sprint Backlog', 'Sprint Backlog', 'ASSISTANCE'),
  ('Traitement en Cours', 'Traitement en Cours', 'ASSISTANCE'),
  ('Test en Cours', 'Test en Cours', 'ASSISTANCE'),
  ('Terminé(e)', 'Terminé(e)', 'ASSISTANCE'),
  ('Terminé', 'Terminé(e)', 'ASSISTANCE')
ON CONFLICT (jira_status_name, ticket_type) 
DO UPDATE SET 
  supabase_status = EXCLUDED.supabase_status,
  updated_at = NOW();

-------------------------------
-- 5. VALIDATION
-------------------------------
DO $$
DECLARE
  bug_mappings_count INTEGER;
  req_mappings_count INTEGER;
  assistance_mappings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bug_mappings_count
  FROM public.jira_status_mapping
  WHERE ticket_type = 'BUG';
  
  SELECT COUNT(*) INTO req_mappings_count
  FROM public.jira_status_mapping
  WHERE ticket_type = 'REQ';
  
  SELECT COUNT(*) INTO assistance_mappings_count
  FROM public.jira_status_mapping
  WHERE ticket_type = 'ASSISTANCE';
  
  RAISE NOTICE 'Mappings BUG: %', bug_mappings_count;
  RAISE NOTICE 'Mappings REQ: %', req_mappings_count;
  RAISE NOTICE 'Mappings ASSISTANCE: %', assistance_mappings_count;
  
  -- Afficher les mappings par type
  RAISE NOTICE 'Mappings BUG:';
  FOR bug_mappings_count IN 
    SELECT jira_status_name || ' → ' || supabase_status
    FROM public.jira_status_mapping
    WHERE ticket_type = 'BUG'
    ORDER BY jira_status_name
  LOOP
    RAISE NOTICE '  - %', bug_mappings_count;
  END LOOP;
END $$;

