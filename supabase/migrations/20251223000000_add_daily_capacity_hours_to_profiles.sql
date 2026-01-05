-- OnpointDoc - Ajout du champ daily_capacity_hours à la table profiles
-- Date: 2025-12-23
-- Permet de définir la capacité quotidienne en heures pour chaque utilisateur
-- Utilisé pour le calcul de disponibilité dans le planning

-- Ajouter la colonne daily_capacity_hours (integer, nullable, default 8)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_capacity_hours INTEGER DEFAULT 8;

-- Créer un index pour faciliter les recherches par capacité
CREATE INDEX IF NOT EXISTS idx_profiles_daily_capacity_hours 
ON public.profiles(daily_capacity_hours) 
WHERE daily_capacity_hours IS NOT NULL;

-- Ajouter une contrainte pour s'assurer que la capacité est positive
ALTER TABLE public.profiles
ADD CONSTRAINT check_daily_capacity_hours_positive 
CHECK (daily_capacity_hours IS NULL OR daily_capacity_hours > 0);

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN public.profiles.daily_capacity_hours IS 'Capacité quotidienne en heures pour le calcul de disponibilité dans le planning. Valeur par défaut: 8h/jour. Exemple: 10h pour les consultants.';

