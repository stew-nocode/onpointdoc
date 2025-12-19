-- Migration : Assigner le produit OBC à tous les tickets sans produit
-- 
-- Description : Tous les tickets actuels sont du produit OBC.
-- Cette migration assigne le produit OBC (id: 91304e02-2ce6-4811-b19d-1cae091a6fde)
-- à tous les tickets qui n'ont pas encore de produit assigné (product_id IS NULL).

BEGIN;

-- Vérifier que le produit OBC existe
DO $$
DECLARE
  obc_product_id UUID := '91304e02-2ce6-4811-b19d-1cae091a6fde';
  obc_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM products WHERE id = obc_product_id) INTO obc_exists;
  
  IF NOT obc_exists THEN
    RAISE EXCEPTION 'Le produit OBC (id: %) n''existe pas dans la table products', obc_product_id;
  END IF;
END $$;

-- Compter les tickets à mettre à jour
DO $$
DECLARE
  tickets_to_update INTEGER;
BEGIN
  SELECT COUNT(*) INTO tickets_to_update
  FROM tickets
  WHERE product_id IS NULL;
  
  RAISE NOTICE 'Nombre de tickets à mettre à jour : %', tickets_to_update;
END $$;

-- Mettre à jour tous les tickets sans produit pour leur assigner OBC
UPDATE tickets
SET 
  product_id = '91304e02-2ce6-4811-b19d-1cae091a6fde',
  updated_at = NOW()
WHERE product_id IS NULL;

-- Vérification finale
DO $$
DECLARE
  remaining_null INTEGER;
  total_tickets INTEGER;
  obc_tickets INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_null FROM tickets WHERE product_id IS NULL;
  SELECT COUNT(*) INTO total_tickets FROM tickets;
  SELECT COUNT(*) INTO obc_tickets FROM tickets WHERE product_id = '91304e02-2ce6-4811-b19d-1cae091a6fde';
  
  RAISE NOTICE 'Vérification après migration :';
  RAISE NOTICE '  - Total de tickets : %', total_tickets;
  RAISE NOTICE '  - Tickets avec OBC : %', obc_tickets;
  RAISE NOTICE '  - Tickets sans produit restants : %', remaining_null;
  
  IF remaining_null > 0 THEN
    RAISE WARNING 'Il reste % tickets sans produit après la migration', remaining_null;
  END IF;
END $$;

COMMIT;

