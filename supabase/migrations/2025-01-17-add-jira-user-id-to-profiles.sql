-- OnpointDoc - Ajout du champ jira_user_id à la table profiles
-- Date: 2025-01-17
-- Permet de stocker l'ID JIRA des utilisateurs pour la synchronisation

-- Ajouter la colonne jira_user_id (text, nullable, unique)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS jira_user_id TEXT;

-- Créer un index unique pour éviter les doublons d'IDs JIRA
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_jira_user_id 
ON public.profiles(jira_user_id) 
WHERE jira_user_id IS NOT NULL;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN public.profiles.jira_user_id IS 'ID de l''utilisateur dans JIRA pour la synchronisation bidirectionnelle';

