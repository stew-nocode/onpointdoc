-- OnpointDoc - Ajout du champ jira_company_id à la table companies
-- Date: 2025-01-17
-- Permet de stocker l'ID JIRA des entreprises pour la synchronisation

-- Ajouter la colonne jira_company_id (integer, nullable, unique)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS jira_company_id INTEGER;

-- Créer un index unique pour éviter les doublons d'IDs JIRA
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_jira_company_id 
ON public.companies(jira_company_id) 
WHERE jira_company_id IS NOT NULL;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN public.companies.jira_company_id IS 'ID de l''entreprise dans JIRA (customfield) pour la synchronisation bidirectionnelle';

