-- OnpointDoc - Ajout du champ job_title à la table profiles
-- Date: 2025-01-17
-- Permet de stocker la fonction/poste de travail des utilisateurs

-- Ajouter la colonne job_title (text, nullable)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Créer un index pour faciliter les recherches par fonction
CREATE INDEX IF NOT EXISTS idx_profiles_job_title 
ON public.profiles(job_title) 
WHERE job_title IS NOT NULL;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN public.profiles.job_title IS 'Fonction/poste de travail de l''utilisateur (ex: Chef comptable, Directeur Technique, Comptable)';

