-- OnpointDoc - Mise à jour RLS pour utiliser la table departments
-- Date: 2025-01-17
-- Met à jour la fonction user_can_access_product pour utiliser department_id au lieu de department ENUM

-------------------------------
-- Mise à jour de la fonction user_can_access_product
-------------------------------
-- Supprimer l'ancienne fonction avec la signature department_t
DROP FUNCTION IF EXISTS public.user_can_access_product(UUID, department_t, UUID, UUID);

-- Créer la nouvelle fonction avec UUID pour department_id
CREATE OR REPLACE FUNCTION public.user_can_access_product(
  target_product_id UUID,
  target_department_id UUID, -- Changé de department_t à UUID
  target_created_by UUID DEFAULT NULL,
  target_assigned_to UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_profile public.profiles;
  is_owner_or_assigned BOOLEAN := false;
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
  IF current_user_profile.department_id IS NULL 
     OR current_user_profile.department_id != target_department_id THEN
    -- Si ce n'est pas le créateur/assigné, refuser
    IF NOT is_owner_or_assigned THEN
      RETURN false;
    END IF;
  END IF;

  -- Vérifier que l'utilisateur a accès au produit via ses modules affectés
  -- ET que le produit est accessible à son département
  RETURN (
    EXISTS (
      SELECT 1
      FROM public.user_module_assignments uma
      INNER JOIN public.modules m ON m.id = uma.module_id
      WHERE uma.user_id = current_user_profile.id
        AND m.product_id = target_product_id
    )
    AND
    -- Vérifier l'accès via product_department_link
    public.user_can_access_product_via_department(
      target_product_id,
      current_user_profile.department_id
    )
  ) OR is_owner_or_assigned;
END;
$$;

COMMENT ON FUNCTION public.user_can_access_product IS 
'Vérifie si l''utilisateur connecté peut accéder à un produit donné. 
Directeur (director) et Admin voient tout. 
Agents/Managers voient uniquement les produits de leurs modules affectés, 
dans leur département, ET si le produit est accessible à leur département via product_department_link.';

-------------------------------
-- Mise à jour de la policy tickets_read_department_product
-------------------------------
DROP POLICY IF EXISTS tickets_read_department_product ON public.tickets;

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
    (SELECT department_id FROM public.profiles WHERE id = created_by),
    created_by,
    assigned_to
  )
);

