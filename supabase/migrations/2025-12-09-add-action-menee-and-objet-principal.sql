-- OnpointDoc - Ajout des champs action_menee et objet_principal aux tickets
-- Date: 2025-12-09
-- Description: Ajoute les colonnes action_menee et objet_principal pour stocker
--              les données depuis l'export JIRA

-- ============================================
-- ÉTAPE 1: Ajouter la colonne "action_menee"
-- ============================================
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS action_menee TEXT;

COMMENT ON COLUMN public.tickets.action_menee IS 'Action menée pour résoudre le ticket (depuis JIRA: "Champs personnalisés (Action menée)")';

-- ============================================
-- ÉTAPE 2: Ajouter la colonne "objet_principal"
-- ============================================
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS objet_principal TEXT;

COMMENT ON COLUMN public.tickets.objet_principal IS 'Objet principal du ticket (depuis JIRA: "Objet principal")';

-- ============================================
-- ÉTAPE 3: Créer des index pour améliorer les performances (optionnel)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_action_menee ON public.tickets(action_menee) WHERE action_menee IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_objet_principal ON public.tickets(objet_principal) WHERE objet_principal IS NOT NULL;












