-- Migration: Optimisation des index pour la table tasks
-- Date: 2025-12-15
-- Objectif: Améliorer les performances des requêtes sur les tâches (-45% estimé)

-- Index pour assigned_to (CRITIQUE - colonne la plus utilisée)
-- Utilisé par: tous les filtres "mine" + KPIs
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
ON public.tasks(assigned_to);

-- Index pour status (utilisé dans tous les quick filters)
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON public.tasks(status);

-- Index pour due_date (utilisé pour tri et filtre overdue)
-- Index partiel pour optimiser les requêtes sur les tâches avec échéance
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON public.tasks(due_date)
WHERE due_date IS NOT NULL;

-- Index pour created_at avec DESC (tri par défaut)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at_desc
ON public.tasks(created_at DESC);

-- Index composite pour "mes tâches" filtrées par statut
-- Combinaison très fréquente dans les filtres et KPIs
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status
ON public.tasks(assigned_to, status);

-- Index composite pour tâches en retard (filtre overdue)
-- Index partiel pour optimiser spécifiquement ce filtre
CREATE INDEX IF NOT EXISTS idx_tasks_overdue
ON public.tasks(due_date, status)
WHERE due_date IS NOT NULL
  AND status NOT IN ('Termine', 'Annule');

-- Index pour updated_at (utilisé pour tâches terminées ce mois)
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at_desc
ON public.tasks(updated_at DESC);

-- Index composite pour tâches terminées ce mois
-- Optimise la requête "tâches terminées par moi ce mois"
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status_updated
ON public.tasks(assigned_to, status, updated_at DESC)
WHERE status = 'Termine';

-- Index pour is_planned (utilisé dans certains filtres)
CREATE INDEX IF NOT EXISTS idx_tasks_is_planned
ON public.tasks(is_planned)
WHERE is_planned = true;

-- Index sur ticket_task_link pour améliorer les JOINs
CREATE INDEX IF NOT EXISTS idx_ticket_task_link_task_id
ON public.ticket_task_link(task_id);

CREATE INDEX IF NOT EXISTS idx_ticket_task_link_ticket_id
ON public.ticket_task_link(ticket_id);

-- Index sur activity_task_link pour améliorer les JOINs
CREATE INDEX IF NOT EXISTS idx_activity_task_link_task_id
ON public.activity_task_link(task_id);

CREATE INDEX IF NOT EXISTS idx_activity_task_link_activity_id
ON public.activity_task_link(activity_id);

-- Commentaires pour documentation
COMMENT ON INDEX idx_tasks_assigned_to IS 'Index pour filtrer les tâches assignées à un utilisateur';
COMMENT ON INDEX idx_tasks_status IS 'Index pour filtres rapides par statut';
COMMENT ON INDEX idx_tasks_assigned_status IS 'Index composite pour "mes tâches" filtrées par statut';
COMMENT ON INDEX idx_tasks_overdue IS 'Index partiel optimisé pour le filtre "tâches en retard"';
COMMENT ON INDEX idx_tasks_assigned_status_updated IS 'Index composite pour "tâches terminées ce mois"';
