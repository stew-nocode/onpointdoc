-- OnpointDoc - Mise à jour de la capacité quotidienne pour le département CONSULTING
-- Date: 2025-12-23
-- Définit la capacité à 10h/jour pour tous les utilisateurs du département CONSULTING

-- ÉTAPE 1 : Créer le département CONSULTING dans la table departments s'il n'existe pas
INSERT INTO public.departments (name, code, description, color)
VALUES ('CONSULTING', 'CON', 'Département Consulting', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- ÉTAPE 2 : Mettre à jour les utilisateurs via department_id (si table departments utilisée)
UPDATE public.profiles p
SET daily_capacity_hours = 10
FROM public.departments d
WHERE p.department_id = d.id
  AND d.name = 'CONSULTING'
  AND p.is_active = true
  AND (p.daily_capacity_hours IS NULL OR p.daily_capacity_hours = 8);

-- ÉTAPE 3 : Mettre à jour les utilisateurs via department ENUM (si ENUM utilisé)
-- Note: CONSULTING n'existe pas encore dans l'ENUM, cette partie sera exécutée si l'ENUM est étendu plus tard
-- UPDATE public.profiles
-- SET daily_capacity_hours = 10
-- WHERE department = 'CONSULTING'::department_t
--   AND is_active = true
--   AND (daily_capacity_hours IS NULL OR daily_capacity_hours = 8);

-- Log pour vérification
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Mise à jour de % utilisateurs CONSULTING à 10h/jour', updated_count;
END $$;

