-- Migration: Optimisation des index pour la table activities
-- Date: 2025-12-15
-- Objectif: Améliorer les performances des requêtes sur les activités (-40% estimé)

-- Index pour la liste paginée (order by created_at DESC)
-- Utilisé par: listActivitiesPaginated
CREATE INDEX IF NOT EXISTS idx_activities_created_at_desc
ON public.activities(created_at DESC);

-- Index pour filtres par statut
-- Utilisé par: tous les quick filters + KPIs
CREATE INDEX IF NOT EXISTS idx_activities_status
ON public.activities(status);

-- Index composite pour "mes activités planifiées ce mois"
-- Combinaison très fréquente dans les KPIs
CREATE INDEX IF NOT EXISTS idx_activities_created_by_status_created_at
ON public.activities(created_by, status, created_at DESC);

-- Index pour activités à venir (avec condition partielle)
-- Utilisé par: getUpcomingActivitiesThisWeek
CREATE INDEX IF NOT EXISTS idx_activities_planned_start
ON public.activities(planned_start)
WHERE planned_start IS NOT NULL;

-- Index pour activités planifiées (avec condition partielle)
-- Utilisé par: quick filter 'planned'
CREATE INDEX IF NOT EXISTS idx_activities_planned_dates
ON public.activities(planned_start, planned_end)
WHERE planned_start IS NOT NULL AND planned_end IS NOT NULL;

-- Index composite pour updated_at (utilisé pour activités en cours)
CREATE INDEX IF NOT EXISTS idx_activities_status_updated_at
ON public.activities(status, updated_at DESC)
WHERE status = 'En_cours';

-- Index sur activity_participants pour les KPIs
-- Très utilisé pour trouver les activités où un utilisateur participe
CREATE INDEX IF NOT EXISTS idx_activity_participants_user_id
ON public.activity_participants(user_id);

-- Index composite pour activity_participants
CREATE INDEX IF NOT EXISTS idx_activity_participants_user_activity
ON public.activity_participants(user_id, activity_id);

-- Index pour recherche textuelle full-text sur le titre
-- Améliore les performances de la recherche avec ilike
CREATE INDEX IF NOT EXISTS idx_activities_title_gin
ON public.activities USING gin(to_tsvector('french', title));

-- Index pour ticket_activity_link (améliore les JOINs)
CREATE INDEX IF NOT EXISTS idx_ticket_activity_link_activity_id
ON public.ticket_activity_link(activity_id);

CREATE INDEX IF NOT EXISTS idx_ticket_activity_link_ticket_id
ON public.ticket_activity_link(ticket_id);

-- Commentaires pour documentation
COMMENT ON INDEX idx_activities_created_at_desc IS 'Index pour tri par date de création DESC (liste paginée)';
COMMENT ON INDEX idx_activities_status IS 'Index pour filtres par statut';
COMMENT ON INDEX idx_activities_created_by_status_created_at IS 'Index composite pour "mes activités" filtrées par statut et date';
COMMENT ON INDEX idx_activities_planned_start IS 'Index partiel pour activités planifiées à venir';
COMMENT ON INDEX idx_activities_title_gin IS 'Index GIN pour recherche full-text sur le titre';
