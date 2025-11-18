-- OnpointDoc - Phase 1 : Mapping Champs Standards Jira ↔ Supabase
-- Date: 2025-01-18
-- Objectif: Ajouter les champs manquants et créer les tables de mapping pour la synchronisation Jira

-------------------------------
-- 1. EXTENSION TABLE tickets
-------------------------------
-- Ajouter les champs resolution et fix_version dans tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS fix_version TEXT;

COMMENT ON COLUMN public.tickets.resolution IS 'Résolution Jira (ex: "Terminé")';
COMMENT ON COLUMN public.tickets.fix_version IS 'Version de correction Jira (ex: "OBC V T1 2024")';

-------------------------------
-- 2. EXTENSION TABLE jira_sync
-------------------------------
-- Ajouter les métadonnées Jira dans jira_sync
ALTER TABLE public.jira_sync
  -- Métadonnées Jira originales
  ADD COLUMN IF NOT EXISTS jira_status TEXT,
  ADD COLUMN IF NOT EXISTS jira_priority TEXT,
  ADD COLUMN IF NOT EXISTS jira_assignee_account_id TEXT,
  ADD COLUMN IF NOT EXISTS jira_reporter_account_id TEXT,
  ADD COLUMN IF NOT EXISTS jira_resolution TEXT,
  ADD COLUMN IF NOT EXISTS jira_fix_version TEXT,
  ADD COLUMN IF NOT EXISTS jira_sprint_id TEXT,
  
  -- Timestamps de synchronisation
  ADD COLUMN IF NOT EXISTS last_status_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_priority_sync TIMESTAMPTZ,
  
  -- Métadonnées supplémentaires (JSONB)
  ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.jira_sync.jira_status IS 'Statut Jira original (ex: "Sprint Backlog", "Traitement en Cours")';
COMMENT ON COLUMN public.jira_sync.jira_priority IS 'Priorité Jira original (ex: "Priorité 1", "Priorité 2")';
COMMENT ON COLUMN public.jira_sync.jira_assignee_account_id IS 'AccountId Jira de l''assigné (ex: "712020:bb02e93b-c270-4c40-a166-a19a42e5629a")';
COMMENT ON COLUMN public.jira_sync.jira_reporter_account_id IS 'AccountId Jira du reporter';
COMMENT ON COLUMN public.jira_sync.jira_resolution IS 'Résolution Jira (ex: "Terminé")';
COMMENT ON COLUMN public.jira_sync.jira_fix_version IS 'Version de correction Jira (ex: "OBC V T1 2024")';
COMMENT ON COLUMN public.jira_sync.jira_sprint_id IS 'ID du sprint Jira (ex: "352")';
COMMENT ON COLUMN public.jira_sync.last_status_sync IS 'Dernière synchronisation du statut';
COMMENT ON COLUMN public.jira_sync.last_priority_sync IS 'Dernière synchronisation de la priorité';
COMMENT ON COLUMN public.jira_sync.sync_metadata IS 'Métadonnées supplémentaires Jira (labels, components, etc.)';

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_jira_sync_status ON public.jira_sync(jira_status) WHERE jira_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jira_sync_priority ON public.jira_sync(jira_priority) WHERE jira_priority IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jira_sync_metadata_gin ON public.jira_sync USING GIN (sync_metadata) WHERE sync_metadata IS NOT NULL;

-------------------------------
-- 3. TABLE jira_status_mapping
-------------------------------
-- Table pour gérer les mappings dynamiques des statuts Jira → Supabase
CREATE TABLE IF NOT EXISTS public.jira_status_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_status_name TEXT NOT NULL UNIQUE,
  supabase_status TEXT NOT NULL,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('BUG', 'REQ', 'ASSISTANCE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.jira_status_mapping IS 'Mapping des statuts Jira vers les statuts Supabase';
COMMENT ON COLUMN public.jira_status_mapping.jira_status_name IS 'Nom du statut Jira (ex: "Sprint Backlog", "Traitement en Cours")';
COMMENT ON COLUMN public.jira_status_mapping.supabase_status IS 'Statut Supabase correspondant (ex: "Nouveau", "En_cours")';
COMMENT ON COLUMN public.jira_status_mapping.ticket_type IS 'Type de ticket concerné (BUG, REQ, ASSISTANCE)';

CREATE INDEX IF NOT EXISTS idx_jira_status_mapping_jira_status ON public.jira_status_mapping(jira_status_name);
CREATE INDEX IF NOT EXISTS idx_jira_status_mapping_ticket_type ON public.jira_status_mapping(ticket_type);

-------------------------------
-- 4. TABLE jira_priority_mapping
-------------------------------
-- Table pour gérer les mappings dynamiques des priorités Jira → Supabase
CREATE TABLE IF NOT EXISTS public.jira_priority_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_priority_name TEXT NOT NULL UNIQUE,
  supabase_priority TEXT NOT NULL CHECK (supabase_priority IN ('Low', 'Medium', 'High', 'Critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.jira_priority_mapping IS 'Mapping des priorités Jira vers les priorités Supabase';
COMMENT ON COLUMN public.jira_priority_mapping.jira_priority_name IS 'Nom de la priorité Jira (ex: "Priorité 1", "Priorité 2")';
COMMENT ON COLUMN public.jira_priority_mapping.supabase_priority IS 'Priorité Supabase correspondante (Low, Medium, High, Critical)';

CREATE INDEX IF NOT EXISTS idx_jira_priority_mapping_jira_priority ON public.jira_priority_mapping(jira_priority_name);

-------------------------------
-- 5. DONNÉES INITIALES - Mapping des statuts
-------------------------------
-- Insérer les mappings de statuts trouvés dans l'analyse Jira (projet OD)
INSERT INTO public.jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES
  ('Sprint Backlog', 'Nouveau', 'BUG'),
  ('Sprint Backlog', 'Nouveau', 'REQ'),
  ('Traitement en Cours', 'En_cours', 'BUG'),
  ('Traitement en Cours', 'En_cours', 'REQ'),
  ('Terminé(e)', 'Resolue', 'BUG'),
  ('Terminé(e)', 'Resolue', 'REQ')
ON CONFLICT (jira_status_name) DO NOTHING;

-------------------------------
-- 6. DONNÉES INITIALES - Mapping des priorités
-------------------------------
-- Insérer les mappings de priorités trouvés dans l'analyse Jira (projet OD)
INSERT INTO public.jira_priority_mapping (jira_priority_name, supabase_priority)
VALUES
  ('Priorité 1', 'Critical'),
  ('Priorité 2', 'High'),
  ('Priorité 3', 'Medium'),
  ('Priorité 4', 'Low')
ON CONFLICT (jira_priority_name) DO NOTHING;

-------------------------------
-- 7. FONCTION pour obtenir le statut Supabase depuis Jira
-------------------------------
CREATE OR REPLACE FUNCTION public.get_supabase_status_from_jira(
  p_jira_status TEXT,
  p_ticket_type TEXT
) RETURNS TEXT AS $$
DECLARE
  v_supabase_status TEXT;
BEGIN
  SELECT supabase_status INTO v_supabase_status
  FROM public.jira_status_mapping
  WHERE jira_status_name = p_jira_status
    AND ticket_type = p_ticket_type
  LIMIT 1;
  
  -- Si aucun mapping trouvé, retourner NULL
  RETURN v_supabase_status;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_supabase_status_from_jira IS 'Retourne le statut Supabase correspondant à un statut Jira pour un type de ticket donné';

-------------------------------
-- 8. FONCTION pour obtenir la priorité Supabase depuis Jira
-------------------------------
CREATE OR REPLACE FUNCTION public.get_supabase_priority_from_jira(
  p_jira_priority TEXT
) RETURNS TEXT AS $$
DECLARE
  v_supabase_priority TEXT;
BEGIN
  SELECT supabase_priority INTO v_supabase_priority
  FROM public.jira_priority_mapping
  WHERE jira_priority_name = p_jira_priority
  LIMIT 1;
  
  -- Si aucun mapping trouvé, retourner NULL
  RETURN v_supabase_priority;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_supabase_priority_from_jira IS 'Retourne la priorité Supabase correspondante à une priorité Jira';

-------------------------------
-- VALIDATION
-------------------------------
DO $$
DECLARE
  status_mapping_count INTEGER;
  priority_mapping_count INTEGER;
BEGIN
  -- Vérifier les mappings de statuts
  SELECT COUNT(*) INTO status_mapping_count
  FROM public.jira_status_mapping;
  
  IF status_mapping_count < 6 THEN
    RAISE WARNING 'Seulement % mappings de statuts insérés sur 6 attendus.', status_mapping_count;
  ELSE
    RAISE NOTICE 'Migration réussie: % mappings de statuts insérés.', status_mapping_count;
  END IF;
  
  -- Vérifier les mappings de priorités
  SELECT COUNT(*) INTO priority_mapping_count
  FROM public.jira_priority_mapping;
  
  IF priority_mapping_count < 4 THEN
    RAISE WARNING 'Seulement % mappings de priorités insérés sur 4 attendus.', priority_mapping_count;
  ELSE
    RAISE NOTICE 'Migration réussie: % mappings de priorités insérés.', priority_mapping_count;
  END IF;
END $$;

