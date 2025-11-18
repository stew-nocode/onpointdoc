-- OnpointDoc - Correction de la contrainte unique sur submodules
-- Date: 2025-01-17
-- Supprime la contrainte unique incorrecte sur module_id seul
-- La contrainte composite (module_id, name) est suffisante

-- Supprimer la contrainte unique incorrecte sur module_id seul
ALTER TABLE public.submodules
DROP CONSTRAINT IF EXISTS submodules_module_id_key;

-- La contrainte composite submodules_module_id_name_key reste active
-- Elle garantit qu'un module ne peut pas avoir deux sous-modules avec le même nom

