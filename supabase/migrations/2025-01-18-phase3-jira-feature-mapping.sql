-- OnpointDoc - Phase 3 : Mapping Structure Produit/Module/Fonctionnalité Jira ↔ Supabase
-- Date: 2025-01-18
-- Objectif: Créer la table de mapping des fonctionnalités Jira vers les features Supabase

-------------------------------
-- 1. TABLE jira_feature_mapping
-------------------------------
-- Table pour gérer les mappings dynamiques des fonctionnalités Jira → Supabase
CREATE TABLE IF NOT EXISTS public.jira_feature_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_feature_value TEXT NOT NULL,
  feature_id UUID REFERENCES public.features(id) ON DELETE SET NULL,
  jira_custom_field_id TEXT NOT NULL DEFAULT 'customfield_10052',
  jira_feature_id TEXT, -- ID de l'option Jira (ex: "10088")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jira_feature_value, jira_custom_field_id)
);

COMMENT ON TABLE public.jira_feature_mapping IS 'Mapping des fonctionnalités Jira vers les features Supabase';
COMMENT ON COLUMN public.jira_feature_mapping.jira_feature_value IS 'Valeur du champ Jira (ex: "Finance - Comptabilité Générale")';
COMMENT ON COLUMN public.jira_feature_mapping.feature_id IS 'ID de la feature Supabase correspondante';
COMMENT ON COLUMN public.jira_feature_mapping.jira_custom_field_id IS 'ID du champ personnalisé Jira (ex: "customfield_10052")';
COMMENT ON COLUMN public.jira_feature_mapping.jira_feature_id IS 'ID de l\'option Jira (pour traçabilité)';

CREATE INDEX IF NOT EXISTS idx_jira_feature_mapping_value ON public.jira_feature_mapping(jira_feature_value);
CREATE INDEX IF NOT EXISTS idx_jira_feature_mapping_feature ON public.jira_feature_mapping(feature_id);
CREATE INDEX IF NOT EXISTS idx_jira_feature_mapping_custom_field ON public.jira_feature_mapping(jira_custom_field_id);

-------------------------------
-- 2. FONCTION pour obtenir le feature_id depuis Jira
-------------------------------
CREATE OR REPLACE FUNCTION public.get_feature_id_from_jira(
  p_jira_feature_value TEXT,
  p_jira_custom_field_id TEXT DEFAULT 'customfield_10052'
) RETURNS UUID AS $$
DECLARE
  v_feature_id UUID;
BEGIN
  SELECT feature_id INTO v_feature_id
  FROM public.jira_feature_mapping
  WHERE jira_feature_value = p_jira_feature_value
    AND jira_custom_field_id = p_jira_custom_field_id
  LIMIT 1;
  
  -- Si aucun mapping trouvé, retourner NULL
  RETURN v_feature_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_feature_id_from_jira IS 'Retourne le feature_id Supabase correspondant à une valeur de fonctionnalité Jira';

-------------------------------
-- 3. FONCTION pour obtenir le submodule_id depuis feature_id
-------------------------------
-- Cette fonction permet de déduire le submodule_id depuis le feature_id
-- Utile pour mettre à jour tickets.submodule_id automatiquement
CREATE OR REPLACE FUNCTION public.get_submodule_id_from_feature_id(
  p_feature_id UUID
) RETURNS UUID AS $$
DECLARE
  v_submodule_id UUID;
BEGIN
  SELECT submodule_id INTO v_submodule_id
  FROM public.features
  WHERE id = p_feature_id
  LIMIT 1;
  
  RETURN v_submodule_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_submodule_id_from_feature_id IS 'Retourne le submodule_id depuis un feature_id';

-------------------------------
-- VALIDATION
-------------------------------
DO $$
DECLARE
  mapping_count INTEGER;
BEGIN
  -- Vérifier que la table est créée
  SELECT COUNT(*) INTO mapping_count
  FROM public.jira_feature_mapping;
  
  RAISE NOTICE 'Migration Phase 3 réussie: Table jira_feature_mapping créée (% mappings initiaux).', mapping_count;
END $$;

