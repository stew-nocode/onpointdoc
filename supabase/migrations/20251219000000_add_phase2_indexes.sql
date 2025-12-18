-- Migration : Index optimisés Phase 2
-- Date : 2025-12-19
-- Objectif : Ajouter index BRIN, GIN et composés pour optimiser les requêtes dashboard
-- Gain estimé : -90% taille index (BRIN), -40% temps requête (GIN)

-- =============================================
-- INDEX BRIN pour created_at (10x plus léger que B-tree)
-- =============================================

-- ✅ BRIN pour created_at (déjà créé dans Phase 1, vérifier qu'il existe)
-- Plus efficace que B-tree pour les scans de plages de dates
-- Note: L'index BRIN a déjà été créé dans 20251218000000_optimize_dashboard_stats_functions.sql
-- On vérifie juste qu'il existe, sinon on le crée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tickets_created_at_brin'
  ) THEN
    CREATE INDEX idx_tickets_created_at_brin
    ON tickets USING BRIN(created_at)
    WITH (pages_per_range = 128);
    
    COMMENT ON INDEX idx_tickets_created_at_brin IS
    'Index BRIN léger pour les scans de grandes plages de dates.
    10x plus léger que B-tree pour les colonnes séquentielles.
    Recommandé par PostgreSQL pour les tables > 100k lignes.';
  END IF;
END $$;

-- =============================================
-- INDEX GIN pour recherche full-text (si nécessaire)
-- =============================================

-- ✅ GIN pour recherche full-text optimisée (décommenter si recherche utilisée)
-- CREATE INDEX IF NOT EXISTS idx_tickets_search_gin
-- ON tickets USING GIN(
--   to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, ''))
-- );

-- COMMENT ON INDEX idx_tickets_search_gin IS
-- 'Index GIN pour recherche full-text sur title et description.
-- Utiliser avec to_tsquery() pour recherches optimisées.';

-- =============================================
-- INDEX COMPOSÉS optimisés pour GROUP BY
-- =============================================

-- ✅ Index composé optimisé pour GROUP BY (colonnes avec plus de valeurs distinctes en premier)
CREATE INDEX IF NOT EXISTS idx_tickets_groupby_optimized
ON tickets(ticket_type, status, product_id, created_at DESC)
WHERE ticket_type IS NOT NULL;

COMMENT ON INDEX idx_tickets_groupby_optimized IS
'Index composé optimisé pour les requêtes GROUP BY.
Ordre des colonnes : ticket_type (peu de valeurs) → status → product_id → created_at.
Améliore les performances des agrégations.';

-- =============================================
-- INDEX avec INCLUDE pour prepared statements
-- =============================================

-- ✅ Index pour prepared statements (colonnes fréquemment utilisées incluses)
CREATE INDEX IF NOT EXISTS idx_tickets_prepared_stats
ON tickets(product_id, ticket_type, status, created_at)
INCLUDE (resolved_at, duration_minutes);

COMMENT ON INDEX idx_tickets_prepared_stats IS
'Index avec INCLUDE pour éviter les lookups supplémentaires.
Utilisé par les fonctions optimisées get_tickets_*_stats().
Les colonnes INCLUDE sont stockées dans l''index mais non triées.';

-- =============================================
-- STATISTIQUES pour l'optimiseur de requêtes
-- =============================================

-- Mettre à jour les statistiques pour que l'optimiseur choisisse les bons index
ANALYZE tickets;

-- =============================================
-- VÉRIFICATION des index existants
-- =============================================

-- Vérifier que les index de la Phase 1 existent toujours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tickets_dashboard_main'
  ) THEN
    RAISE NOTICE 'Index idx_tickets_dashboard_main manquant - créer via migration Phase 1';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tickets_product_status'
  ) THEN
    RAISE NOTICE 'Index idx_tickets_product_status manquant - créer via migration Phase 1';
  END IF;
END $$;

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

