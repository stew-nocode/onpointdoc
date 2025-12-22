-- Migration: Ajouter champs durée réelle pour comparaison estimé vs réel dans les reportings
-- Date: 2025-01-23
-- Description:
--   - Ajouter actual_duration_hours à tasks (durée réelle pour comparer avec estimated_duration_hours)
--   - Ajouter estimated_duration_hours à activities (durée estimée)
--   - Ajouter actual_duration_hours à activities (durée réelle pour comparer avec estimated_duration_hours)
--
-- Objectif: Permettre la comparaison estimé vs réel dans les reportings pour améliorer les estimations futures
--
-- Principe Clean Code :
--   - Champs optionnels (NULL autorisé)
--   - Index pour performance des requêtes planning et reporting
--   - Commentaires pour documentation

-- ============================================================================
-- TASKS: Ajouter actual_duration_hours
-- ============================================================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS actual_duration_hours NUMERIC;

-- Commentaire pour documentation
COMMENT ON COLUMN public.tasks.actual_duration_hours IS
  'Durée réelle de la tâche en heures (renseignée après exécution). Permet de comparer avec estimated_duration_hours dans les reportings pour améliorer les estimations futures. Utilisée pour le planning si disponible (priorité sur estimated_duration_hours). NULL si pas encore renseignée.';

-- Index pour requêtes de planning et reporting (seulement sur valeurs non NULL)
CREATE INDEX IF NOT EXISTS idx_tasks_actual_duration_hours
ON public.tasks(actual_duration_hours)
WHERE actual_duration_hours IS NOT NULL;

-- ============================================================================
-- ACTIVITIES: Ajouter estimated_duration_hours et actual_duration_hours
-- ============================================================================

ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS estimated_duration_hours NUMERIC;

-- Commentaire pour documentation
COMMENT ON COLUMN public.activities.estimated_duration_hours IS
  'Durée estimée de l''activité en heures. Utilisée pour le calcul de disponibilité dans le planning et pour comparer avec actual_duration_hours dans les reportings. Si NULL, la durée est calculée depuis planned_end - planned_start (fallback).';

-- Index pour requêtes de planning (seulement sur valeurs non NULL)
CREATE INDEX IF NOT EXISTS idx_activities_estimated_duration_hours
ON public.activities(estimated_duration_hours)
WHERE estimated_duration_hours IS NOT NULL;

ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS actual_duration_hours NUMERIC;

-- Commentaire pour documentation
COMMENT ON COLUMN public.activities.actual_duration_hours IS
  'Durée réelle de l''activité en heures (renseignée après exécution). Permet de comparer avec estimated_duration_hours dans les reportings pour améliorer les estimations futures. Utilisée pour le planning si disponible (priorité sur estimated_duration_hours). NULL si pas encore renseignée.';

-- Index pour requêtes de planning et reporting (seulement sur valeurs non NULL)
CREATE INDEX IF NOT EXISTS idx_activities_actual_duration_hours
ON public.activities(actual_duration_hours)
WHERE actual_duration_hours IS NOT NULL;



