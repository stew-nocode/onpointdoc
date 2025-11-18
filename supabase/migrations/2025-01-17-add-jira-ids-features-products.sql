-- OnpointDoc - Ajout des champs JIRA pour features et products
-- Date: 2025-01-17
-- Permet de stocker les IDs JIRA pour la synchronisation

-- Ajouter jira_feature_id à features
ALTER TABLE public.features
ADD COLUMN IF NOT EXISTS jira_feature_id INTEGER;

-- Créer un index unique pour éviter les doublons d'IDs JIRA features
CREATE UNIQUE INDEX IF NOT EXISTS idx_features_jira_feature_id 
ON public.features(jira_feature_id) 
WHERE jira_feature_id IS NOT NULL;

-- Ajouter jira_product_id à products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS jira_product_id INTEGER;

-- Créer un index unique pour éviter les doublons d'IDs JIRA products
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_jira_product_id 
ON public.products(jira_product_id) 
WHERE jira_product_id IS NOT NULL;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN public.features.jira_feature_id IS 'ID de la fonctionnalité dans JIRA (customfield) pour la synchronisation bidirectionnelle';
COMMENT ON COLUMN public.products.jira_product_id IS 'ID du produit dans JIRA (customfield) pour la synchronisation bidirectionnelle';

