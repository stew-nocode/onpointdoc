-- OnpointDoc - Correction des Clés Étrangères Manquantes sur la Table Tickets
-- Date: 2025-01-19
-- Objectif: Ajouter les contraintes FOREIGN KEY manquantes pour éviter les données orphelines et assurer l'intégrité référentielle
-- Priorité: 🔴 CRITIQUE

-------------------------------
-- 1. CLÉS ÉTRANGÈRES VERS PROFILES
-------------------------------

-- 1.1. assigned_to → profiles.id
-- Vérifier si la contrainte existe déjà avant de l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_assigned_to_fkey' 
    AND conrelid = 'public.tickets'::regclass
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_assigned_to_fkey
      FOREIGN KEY (assigned_to) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    
    RAISE NOTICE 'Contrainte tickets_assigned_to_fkey ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte tickets_assigned_to_fkey existe déjà';
  END IF;
END $$;

-- 1.2. created_by → profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_created_by_fkey' 
    AND conrelid = 'public.tickets'::regclass
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_created_by_fkey
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    
    RAISE NOTICE 'Contrainte tickets_created_by_fkey ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte tickets_created_by_fkey existe déjà';
  END IF;
END $$;

-------------------------------
-- 2. CLÉS ÉTRANGÈRES VERS PRODUCTS
-------------------------------

-- 2.1. product_id → products.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_product_id_fkey' 
    AND conrelid = 'public.tickets'::regclass
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_product_id_fkey
      FOREIGN KEY (product_id) 
      REFERENCES public.products(id) 
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    
    RAISE NOTICE 'Contrainte tickets_product_id_fkey ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte tickets_product_id_fkey existe déjà';
  END IF;
END $$;

-------------------------------
-- 3. CLÉS ÉTRANGÈRES VERS MODULES
-------------------------------

-- 3.1. module_id → modules.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_module_id_fkey' 
    AND conrelid = 'public.tickets'::regclass
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_module_id_fkey
      FOREIGN KEY (module_id) 
      REFERENCES public.modules(id) 
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    
    RAISE NOTICE 'Contrainte tickets_module_id_fkey ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte tickets_module_id_fkey existe déjà';
  END IF;
END $$;

-------------------------------
-- 4. CLÉS ÉTRANGÈRES VERS SUBMODULES (si colonne existe)
-------------------------------

-- 4.1. submodule_id → submodules.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tickets' 
    AND column_name = 'submodule_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'tickets_submodule_id_fkey' 
      AND conrelid = 'public.tickets'::regclass
    ) THEN
      ALTER TABLE public.tickets
        ADD CONSTRAINT tickets_submodule_id_fkey
        FOREIGN KEY (submodule_id) 
        REFERENCES public.submodules(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE;
      
      RAISE NOTICE 'Contrainte tickets_submodule_id_fkey ajoutée';
    ELSE
      RAISE NOTICE 'Contrainte tickets_submodule_id_fkey existe déjà';
    END IF;
  ELSE
    RAISE NOTICE 'Colonne submodule_id n''existe pas, contrainte ignorée';
  END IF;
END $$;

-------------------------------
-- 5. CLÉS ÉTRANGÈRES VERS FEATURES (si colonne existe)
-------------------------------

-- 5.1. feature_id → features.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tickets' 
    AND column_name = 'feature_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'tickets_feature_id_fkey' 
      AND conrelid = 'public.tickets'::regclass
    ) THEN
      ALTER TABLE public.tickets
        ADD CONSTRAINT tickets_feature_id_fkey
        FOREIGN KEY (feature_id) 
        REFERENCES public.features(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE;
      
      RAISE NOTICE 'Contrainte tickets_feature_id_fkey ajoutée';
    ELSE
      RAISE NOTICE 'Contrainte tickets_feature_id_fkey existe déjà';
    END IF;
  ELSE
    RAISE NOTICE 'Colonne feature_id n''existe pas, contrainte ignorée';
  END IF;
END $$;

-------------------------------
-- 6. CLÉS ÉTRANGÈRES VERS CONTACTS (si colonne existe)
-------------------------------

-- 6.1. contact_user_id → profiles.id (contact utilisateur)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tickets' 
    AND column_name = 'contact_user_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'tickets_contact_user_id_fkey' 
      AND conrelid = 'public.tickets'::regclass
    ) THEN
      ALTER TABLE public.tickets
        ADD CONSTRAINT tickets_contact_user_id_fkey
        FOREIGN KEY (contact_user_id) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE;
      
      RAISE NOTICE 'Contrainte tickets_contact_user_id_fkey ajoutée';
    ELSE
      RAISE NOTICE 'Contrainte tickets_contact_user_id_fkey existe déjà';
    END IF;
  ELSE
    RAISE NOTICE 'Colonne contact_user_id n''existe pas, contrainte ignorée';
  END IF;
END $$;

-------------------------------
-- 7. INDEX POUR PERFORMANCE
-------------------------------

-- Index sur assigned_to (si n'existe pas déjà)
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to 
  ON public.tickets(assigned_to) 
  WHERE assigned_to IS NOT NULL;

-- Index sur jira_issue_key (si n'existe pas déjà)
CREATE INDEX IF NOT EXISTS idx_tickets_jira_issue_key 
  ON public.tickets(jira_issue_key) 
  WHERE jira_issue_key IS NOT NULL;

-- Index composite pour requêtes fréquentes: (status, ticket_type, created_at)
CREATE INDEX IF NOT EXISTS idx_tickets_status_type_created 
  ON public.tickets(status, ticket_type, created_at DESC);

-- Index composite pour "mes tickets en cours": (assigned_to, status)
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status 
  ON public.tickets(assigned_to, status) 
  WHERE assigned_to IS NOT NULL;

-- Index composite pour filtres par produit/module: (product_id, module_id)
CREATE INDEX IF NOT EXISTS idx_tickets_product_module 
  ON public.tickets(product_id, module_id) 
  WHERE product_id IS NOT NULL AND module_id IS NOT NULL;

-------------------------------
-- 8. VALIDATION
-------------------------------

DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  -- Compter les contraintes FK sur la table tickets
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE conrelid = 'public.tickets'::regclass
    AND contype = 'f';
  
  RAISE NOTICE 'Nombre total de contraintes FOREIGN KEY sur tickets: %', fk_count;
  
  IF fk_count < 3 THEN
    RAISE WARNING 'Seulement % contraintes FK trouvées, au moins 3 attendues (assigned_to, created_by, product_id)', fk_count;
  ELSE
    RAISE NOTICE 'Migration réussie: % contraintes FOREIGN KEY présentes', fk_count;
  END IF;
END $$;

COMMENT ON CONSTRAINT tickets_assigned_to_fkey ON public.tickets IS 'FK vers profiles.id - Utilisateur assigné au ticket';
COMMENT ON CONSTRAINT tickets_created_by_fkey ON public.tickets IS 'FK vers profiles.id - Utilisateur créateur du ticket';
COMMENT ON CONSTRAINT tickets_product_id_fkey ON public.tickets IS 'FK vers products.id - Produit concerné par le ticket';

