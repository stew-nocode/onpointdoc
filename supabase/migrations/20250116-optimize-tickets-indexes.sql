-- Migration : Optimisation des indexes pour améliorer les performances des requêtes tickets
-- Date : 2025-01-16
-- Objectif : Réduire le temps de requête TTFB en améliorant les performances DB

-- Index sur created_at (utilisé pour le tri par défaut)
CREATE INDEX IF NOT EXISTS idx_tickets_created_at_desc ON tickets(created_at DESC);

-- Index sur ticket_type (utilisé pour les filtres)
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON tickets(ticket_type) WHERE ticket_type IS NOT NULL;

-- Index sur status (utilisé pour les filtres)
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status) WHERE status IS NOT NULL;

-- Index sur assigned_to (utilisé pour les filtres et quick filters)
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to) WHERE assigned_to IS NOT NULL;

-- Index sur created_by (utilisé pour les relations)
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by) WHERE created_by IS NOT NULL;

-- Index composé pour les filtres fréquents (type + status)
CREATE INDEX IF NOT EXISTS idx_tickets_type_status ON tickets(ticket_type, status) 
WHERE ticket_type IS NOT NULL AND status IS NOT NULL;

-- Index sur jira_issue_key (utilisé pour le filtre JIRA sync)
CREATE INDEX IF NOT EXISTS idx_tickets_jira_issue_key ON tickets(jira_issue_key) 
WHERE jira_issue_key IS NOT NULL;

-- Index sur target_date (utilisé pour le quick filter "overdue")
CREATE INDEX IF NOT EXISTS idx_tickets_target_date ON tickets(target_date) 
WHERE target_date IS NOT NULL;

-- Index sur contact_user_id (utilisé pour les relations)
CREATE INDEX IF NOT EXISTS idx_tickets_contact_user_id ON tickets(contact_user_id) 
WHERE contact_user_id IS NOT NULL;

-- Index pour la recherche textuelle (GIN index pour ILIKE)
-- Note: PostgreSQL 12+ supporte les indexes GIN pour la recherche full-text
-- On peut utiliser un index trigram pour améliorer les recherches ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_tickets_title_trgm ON tickets USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickets_description_trgm ON tickets USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tickets_jira_key_trgm ON tickets USING gin(jira_issue_key gin_trgm_ops);

-- Commentaires pour documentation
COMMENT ON INDEX idx_tickets_created_at_desc IS 'Optimise le tri par date de création (tri par défaut)';
COMMENT ON INDEX idx_tickets_ticket_type IS 'Optimise les filtres par type de ticket';
COMMENT ON INDEX idx_tickets_status IS 'Optimise les filtres par statut';
COMMENT ON INDEX idx_tickets_assigned_to IS 'Optimise les filtres par assigné (quick filter "mine")';
COMMENT ON INDEX idx_tickets_type_status IS 'Index composé pour optimiser les filtres combinés type+status';
COMMENT ON INDEX idx_tickets_title_trgm IS 'Optimise la recherche textuelle dans les titres (ILIKE)';
COMMENT ON INDEX idx_tickets_description_trgm IS 'Optimise la recherche textuelle dans les descriptions (ILIKE)';

