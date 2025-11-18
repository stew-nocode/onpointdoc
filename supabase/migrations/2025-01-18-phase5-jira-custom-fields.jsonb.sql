-- Phase 5 : Champs Spécifiques par Produit - JSONB
-- Date: 2025-01-18
-- Description: Ajout de la colonne custom_fields (JSONB) pour stocker les champs Jira conditionnels par produit

-- Extension de la table tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Index GIN pour recherche efficace dans JSONB
CREATE INDEX IF NOT EXISTS idx_tickets_custom_fields_gin ON public.tickets USING GIN (custom_fields);

-- Index spécifique pour les champs product_specific (optionnel, pour performance)
CREATE INDEX IF NOT EXISTS idx_tickets_custom_fields_product_specific ON public.tickets 
  USING GIN ((custom_fields->'product_specific'));

-- Commentaire
COMMENT ON COLUMN public.tickets.custom_fields IS 'Champs personnalisés Jira spécifiques par produit (JSONB). Structure: {"product_specific": {"customfield_10297": "...", ...}, "metadata": {...}}';

