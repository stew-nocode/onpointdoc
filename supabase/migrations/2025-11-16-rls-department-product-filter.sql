-- OnpointDoc - RLS Department × Product Filter
-- Date: 2025-11-16
-- Scope: Filtrage par département ET produit pour Agents/Managers
-- Principe: Un membre d'un département ne voit que les infos de son produit (via modules affectés)
-- Exception: DG/DAF voient tout (tous départements, tous produits)

-------------------------------
-- HELPER FUNCTION: Vérifie si l'utilisateur a accès au produit d'un ticket/activité/tâche
-------------------------------
-- Cette fonction vérifie si l'utilisateur connecté :
-- 1. Est DG/DAF (voit tout) OU
-- 2. Est dans le même département ET a accès au produit via ses modules affectés
CREATE OR REPLACE FUNCTION public.user_can_access_product(
  target_product_id uuid,
  target_department department_t,
  target_created_by uuid DEFAULT NULL,
  target_assigned_to uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_profile public.profiles;
  is_owner_or_assigned boolean := false;
BEGIN
  -- Récupérer le profil de l'utilisateur connecté
  SELECT * INTO current_user_profile
  FROM public.profiles
  WHERE auth_uid = auth.uid()
  LIMIT 1;

  -- Si pas de profil, refuser
  IF current_user_profile IS NULL THEN
    RETURN false;
  END IF;

  -- DG/DAF (director) et Admin voient tout
  IF current_user_profile.role IN ('director', 'admin') THEN
    RETURN true;
  END IF;

  -- Si l'utilisateur est le créateur ou l'assigné, il peut voir
  IF target_created_by IS NOT NULL AND target_created_by = current_user_profile.id THEN
    is_owner_or_assigned := true;
  END IF;
  IF target_assigned_to IS NOT NULL AND target_assigned_to = current_user_profile.id THEN
    is_owner_or_assigned := true;
  END IF;

  -- Vérifier que l'utilisateur est dans le même département
  IF current_user_profile.department IS NULL OR current_user_profile.department != target_department THEN
    -- Si ce n'est pas le créateur/assigné, refuser
    IF NOT is_owner_or_assigned THEN
      RETURN false;
    END IF;
  END IF;

  -- Vérifier que l'utilisateur a accès au produit via ses modules affectés
  RETURN EXISTS (
    SELECT 1
    FROM public.user_module_assignments uma
    INNER JOIN public.modules m ON m.id = uma.module_id
    WHERE uma.user_id = current_user_profile.id
      AND m.product_id = target_product_id
  ) OR is_owner_or_assigned;
END;
$$;

-------------------------------
-- TICKETS: RLS par département × produit
-------------------------------
-- Supprimer les anciennes policies qui ne filtrent pas par département/produit
DROP POLICY IF EXISTS tickets_read_owner ON public.tickets;
DROP POLICY IF EXISTS tickets_read_assigned ON public.tickets;
DROP POLICY IF EXISTS tickets_read_managers ON public.tickets;
DROP POLICY IF EXISTS tickets_read_director ON public.tickets;

-- Nouvelle policy: Lecture avec filtre département × produit
CREATE POLICY tickets_read_department_product
ON public.tickets FOR SELECT TO authenticated
USING (
  -- DG/DAF (director) et Admin voient tout
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_uid = auth.uid()
      AND p.role IN ('director', 'admin')
  )
  OR
  -- Sinon, vérifier département × produit
  public.user_can_access_product(
    product_id,
    (SELECT department FROM public.profiles WHERE id = created_by),
    created_by,
    assigned_to
  )
);

-------------------------------
-- ACTIVITIES: RLS par département × produit
-------------------------------
-- Note: Les activités n'ont pas de product_id direct, mais peuvent être liées à des tickets
-- Pour simplifier, on filtre par département du créateur
-- TODO: Si les activités ont un product_id, adapter la logique

DROP POLICY IF EXISTS activities_read_owner ON public.activities;
DROP POLICY IF EXISTS activities_read_managers ON public.activities;
DROP POLICY IF EXISTS activities_read_director ON public.activities;

CREATE POLICY activities_read_department
ON public.activities FOR SELECT TO authenticated
USING (
  -- DG/DAF (director) et Admin voient tout
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_uid = auth.uid()
      AND p.role IN ('director', 'admin')
  )
  OR
  -- Créateur peut voir
  created_by = (SELECT id FROM public.profiles WHERE auth_uid = auth.uid())
  OR
  -- Même département que le créateur
  EXISTS (
    SELECT 1
    FROM public.profiles p_current
    INNER JOIN public.profiles p_creator ON p_creator.id = public.activities.created_by
    WHERE p_current.auth_uid = auth.uid()
      AND p_current.department IS NOT NULL
      AND p_creator.department IS NOT NULL
      AND p_current.department = p_creator.department
  )
);

-------------------------------
-- TASKS: RLS par département × produit
-------------------------------
-- Même logique que les activités

DROP POLICY IF EXISTS tasks_read_owner ON public.tasks;
DROP POLICY IF EXISTS tasks_read_managers ON public.tasks;
DROP POLICY IF EXISTS tasks_read_director ON public.tasks;

CREATE POLICY tasks_read_department
ON public.tasks FOR SELECT TO authenticated
USING (
  -- DG/DAF (director) et Admin voient tout
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_uid = auth.uid()
      AND p.role IN ('director', 'admin')
  )
  OR
  -- Créateur ou assigné peut voir
  created_by = (SELECT id FROM public.profiles WHERE auth_uid = auth.uid())
  OR
  assigned_to = (SELECT id FROM public.profiles WHERE auth_uid = auth.uid())
  OR
  -- Même département que le créateur
  EXISTS (
    SELECT 1
    FROM public.profiles p_current
    INNER JOIN public.profiles p_creator ON p_creator.id = public.tasks.created_by
    WHERE p_current.auth_uid = auth.uid()
      AND p_current.department IS NOT NULL
      AND p_creator.department IS NOT NULL
      AND p_current.department = p_creator.department
  )
);

-- Commentaire explicatif
COMMENT ON FUNCTION public.user_can_access_product IS 
'Vérifie si l''utilisateur connecté peut accéder à un produit donné. 
Directeur (director) et Admin voient tout. 
Agents/Managers voient uniquement les produits de leurs modules affectés ET dans leur département.';

