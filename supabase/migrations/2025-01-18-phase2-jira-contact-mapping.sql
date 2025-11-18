-- OnpointDoc - Phase 2 : Mapping Informations Client/Contact Jira ↔ Supabase
-- Date: 2025-01-18
-- Objectif: Créer la table de mapping des canaux de contact et préparer la synchronisation client/contact

-------------------------------
-- 1. TABLE jira_channel_mapping
-------------------------------
-- Table pour gérer les mappings dynamiques des canaux de contact Jira → Supabase
CREATE TABLE IF NOT EXISTS public.jira_channel_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_channel_value TEXT NOT NULL UNIQUE,
  supabase_channel TEXT NOT NULL CHECK (supabase_channel IN ('Whatsapp', 'Email', 'Appel', 'Autre')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.jira_channel_mapping IS 'Mapping des canaux de contact Jira vers les canaux Supabase';
COMMENT ON COLUMN public.jira_channel_mapping.jira_channel_value IS 'Valeur du canal Jira (ex: "Appel Téléphonique", "Appel WhatsApp")';
COMMENT ON COLUMN public.jira_channel_mapping.supabase_channel IS 'Canal Supabase correspondant (Whatsapp, Email, Appel, Autre)';

CREATE INDEX IF NOT EXISTS idx_jira_channel_mapping_value ON public.jira_channel_mapping(jira_channel_value);

-------------------------------
-- 2. DONNÉES INITIALES - Mapping des canaux
-------------------------------
-- Insérer les mappings de canaux trouvés dans l'analyse Jira (projet OD)
INSERT INTO public.jira_channel_mapping (jira_channel_value, supabase_channel)
VALUES
  ('Appel Téléphonique', 'Appel'),
  ('Appel WhatsApp', 'Whatsapp'),
  ('En présentiel', 'Autre'),
  ('Online (Google Meet, Teams...)', 'Autre'),
  ('Constat Interne', 'Autre')
ON CONFLICT (jira_channel_value) DO NOTHING;

-------------------------------
-- 3. FONCTION pour obtenir le canal Supabase depuis Jira
-------------------------------
CREATE OR REPLACE FUNCTION public.get_supabase_channel_from_jira(
  p_jira_channel TEXT
) RETURNS TEXT AS $$
DECLARE
  v_supabase_channel TEXT;
BEGIN
  SELECT supabase_channel INTO v_supabase_channel
  FROM public.jira_channel_mapping
  WHERE jira_channel_value = p_jira_channel
  LIMIT 1;
  
  -- Si aucun mapping trouvé, retourner NULL
  RETURN v_supabase_channel;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_supabase_channel_from_jira IS 'Retourne le canal Supabase correspondant à un canal Jira';

-------------------------------
-- VALIDATION
-------------------------------
DO $$
DECLARE
  channel_mapping_count INTEGER;
BEGIN
  -- Vérifier les mappings de canaux
  SELECT COUNT(*) INTO channel_mapping_count
  FROM public.jira_channel_mapping;
  
  IF channel_mapping_count < 5 THEN
    RAISE WARNING 'Seulement % mappings de canaux insérés sur 5 attendus.', channel_mapping_count;
  ELSE
    RAISE NOTICE 'Migration réussie: % mappings de canaux insérés.', channel_mapping_count;
  END IF;
END $$;

