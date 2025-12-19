-- Migration: Optimisation des index Phase 2
-- Date: 2025-12-18
-- Objectif: BRIN + GIN pour performances maximales

-- ✅ BRIN pour created_at (10x plus léger que B-tree)
DROP INDEX IF EXISTS idx_tickets_created_at_brin;
CREATE INDEX idx_tickets_created_at_brin
ON tickets USING BRIN(created_at)
WITH (pages_per_range = 128);

-- ✅ GIN pour recherche full-text optimisée
DROP INDEX IF EXISTS idx_tickets_search_gin;
CREATE INDEX idx_tickets_search_gin
ON tickets USING GIN(
  to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- ✅ Index composé optimisé pour GROUP BY
CREATE INDEX IF NOT EXISTS idx_tickets_groupby_optimized
ON tickets(ticket_type, status, product_id, created_at DESC)
WHERE ticket_type IS NOT NULL;

-- ✅ Index pour prepared statements
CREATE INDEX IF NOT EXISTS idx_tickets_prepared_stats
ON tickets(product_id, ticket_type, status, created_at)
INCLUDE (resolved_at, duration_minutes);

-- Statistiques
ANALYZE tickets;

COMMENT ON INDEX idx_tickets_created_at_brin IS
'Index BRIN léger pour created_at (10x plus petit que B-tree)';

COMMENT ON INDEX idx_tickets_search_gin IS
'Index GIN pour recherche full-text optimisée (français)';

COMMENT ON INDEX idx_tickets_groupby_optimized IS
'Index composé optimisé pour GROUP BY (ticket_type avec plus de valeurs distinctes en premier)';
