-- OnpointDoc - Ajout des champs is_relance et relance_type aux tickets
-- Date: 2025-12-11
-- Description: Ajoute les colonnes pour identifier et catégoriser les relances historiques
--              Les nouvelles relances seront gérées via related_ticket_id

-- ============================================
-- ÉTAPE 1: Ajouter la colonne "is_relance"
-- ============================================
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS is_relance BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.tickets.is_relance IS 'Indique si le ticket est une relance (pour données historiques uniquement)';

-- ============================================
-- ÉTAPE 2: Ajouter la colonne "relance_type"
-- ============================================
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS relance_type TEXT;

COMMENT ON COLUMN public.tickets.relance_type IS 'Type de relance: "bug" ou "requete" (pour données historiques uniquement)';

-- ============================================
-- ÉTAPE 3: Créer des index pour améliorer les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_is_relance ON public.tickets(is_relance) WHERE is_relance = TRUE;
CREATE INDEX IF NOT EXISTS idx_tickets_relance_type ON public.tickets(relance_type) WHERE relance_type IS NOT NULL;


