-- OnpointDoc - Transformation ENUM departments → Table departments
-- Date: 2025-01-17
-- Permet la création dynamique de départements et l'affectation aux produits

-------------------------------
-- ÉTAPE 1 : Créer la table departments
-------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- Code court (ex: 'SUP', 'IT', 'MKT')
  description TEXT,
  color TEXT, -- Pour l'UI (ex: '#3B82F6')
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active) WHERE is_active = true;

-- Commentaire
COMMENT ON TABLE public.departments IS 'Départements de l''entreprise (Support, IT, Marketing, etc.)';
COMMENT ON COLUMN public.departments.code IS 'Code court unique du département (ex: SUP, IT, MKT)';
COMMENT ON COLUMN public.departments.color IS 'Couleur pour l''affichage dans l''interface (format hex: #3B82F6)';

-------------------------------
-- ÉTAPE 2 : Migrer les départements existants depuis l'ENUM
-------------------------------
INSERT INTO public.departments (name, code, description, color) VALUES
  ('Support', 'SUP', 'Département Support client', '#10B981'),
  ('IT', 'IT', 'Département Informatique', '#3B82F6'),
  ('Marketing', 'MKT', 'Département Marketing', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-------------------------------
-- ÉTAPE 3 : Ajouter department_id dans profiles
-------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);

-------------------------------
-- ÉTAPE 4 : Migrer les données de department (ENUM) vers department_id (FK)
-------------------------------
UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE p.department::text = d.name
  AND p.department_id IS NULL;

-------------------------------
-- ÉTAPE 5 : Créer la table de liaison product_department_link
-------------------------------
CREATE TABLE IF NOT EXISTS public.product_department_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_product_department_link_product 
ON public.product_department_link(product_id);

CREATE INDEX IF NOT EXISTS idx_product_department_link_department 
ON public.product_department_link(department_id);

-- Commentaire
COMMENT ON TABLE public.product_department_link IS 'Liaison N:M entre produits et départements. Définit quels départements peuvent accéder à quels produits.';

-------------------------------
-- ÉTAPE 6 : Activer RLS sur les nouvelles tables
-------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_department_link ENABLE ROW LEVEL SECURITY;

-- RLS pour departments : Lecture pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS departments_read_all ON public.departments;
CREATE POLICY departments_read_all
ON public.departments FOR SELECT TO authenticated
USING (is_active = true);

-- RLS pour product_department_link : Lecture pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS product_department_link_read_all ON public.product_department_link;
CREATE POLICY product_department_link_read_all
ON public.product_department_link FOR SELECT TO authenticated
USING (true);

-- RLS pour departments : Admin peut créer/modifier/supprimer
DROP POLICY IF EXISTS departments_admin_all ON public.departments;
CREATE POLICY departments_admin_all
ON public.departments FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_uid = auth.uid()
      AND p.role IN ('admin', 'director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_uid = auth.uid()
      AND p.role IN ('admin', 'director')
  )
);

-- RLS pour product_department_link : Admin peut créer/modifier/supprimer
DROP POLICY IF EXISTS product_department_link_admin_all ON public.product_department_link;
CREATE POLICY product_department_link_admin_all
ON public.product_department_link FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_uid = auth.uid()
      AND p.role IN ('admin', 'director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_uid = auth.uid()
      AND p.role IN ('admin', 'director')
  )
);

-------------------------------
-- ÉTAPE 7 : Fonction helper pour vérifier l'accès produit × département
-------------------------------
CREATE OR REPLACE FUNCTION public.user_can_access_product_via_department(
  target_product_id UUID,
  user_department_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si pas de département, refuser
  IF user_department_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si le produit est accessible au département de l'utilisateur
  RETURN EXISTS (
    SELECT 1
    FROM public.product_department_link pdl
    WHERE pdl.product_id = target_product_id
      AND pdl.department_id = user_department_id
  );
END;
$$;

COMMENT ON FUNCTION public.user_can_access_product_via_department IS 
'Vérifie si un produit est accessible à un département donné via la table product_department_link.';

-------------------------------
-- NOTE IMPORTANTE
-------------------------------
-- L'ancienne colonne profiles.department (ENUM) est conservée temporairement
-- pour compatibilité. Elle sera supprimée dans une migration ultérieure
-- après vérification que tout fonctionne correctement.
--
-- Pour supprimer l'ancienne colonne (APRÈS TESTS) :
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS department;
--
-- Pour supprimer l'ENUM (APRÈS TESTS) :
-- DROP TYPE IF EXISTS department_t CASCADE;

