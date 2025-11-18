-- Phase 4 : Workflow et Suivi - Extension de la synchronisation Jira
-- Date: 2025-01-18
-- Description: Ajout des champs workflow, test status, sprint, dates cibles et tickets liés

-- Extension de la table tickets
ALTER TABLE public.tickets
  -- Champs workflow
  ADD COLUMN IF NOT EXISTS workflow_status TEXT,
  ADD COLUMN IF NOT EXISTS test_status TEXT,
  ADD COLUMN IF NOT EXISTS issue_type TEXT, -- 'Bug', 'Impediment', 'Task', etc.
  
  -- Champs de suivi
  ADD COLUMN IF NOT EXISTS sprint_id TEXT, -- Ex: "Sprint 1 - Janvier 2024"
  ADD COLUMN IF NOT EXISTS related_ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_ticket_key TEXT, -- Clé Jira si ticket non dans Supabase (ex: "B-OD-029")
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_tickets_workflow_status ON public.tickets(workflow_status);
CREATE INDEX IF NOT EXISTS idx_tickets_test_status ON public.tickets(test_status);
CREATE INDEX IF NOT EXISTS idx_tickets_sprint_id ON public.tickets(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tickets_target_date ON public.tickets(target_date);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_related_ticket ON public.tickets(related_ticket_id);

-- Extension de la table jira_sync
ALTER TABLE public.jira_sync
  ADD COLUMN IF NOT EXISTS jira_sprint_id TEXT,
  ADD COLUMN IF NOT EXISTS jira_workflow_status TEXT,
  ADD COLUMN IF NOT EXISTS jira_test_status TEXT,
  ADD COLUMN IF NOT EXISTS jira_issue_type TEXT,
  ADD COLUMN IF NOT EXISTS jira_related_ticket_key TEXT,
  ADD COLUMN IF NOT EXISTS jira_target_date DATE,
  ADD COLUMN IF NOT EXISTS jira_resolved_at TIMESTAMPTZ;

-- Index pour jira_sync
CREATE INDEX IF NOT EXISTS idx_jira_sync_sprint ON public.jira_sync(jira_sprint_id);
CREATE INDEX IF NOT EXISTS idx_jira_sync_workflow_status ON public.jira_sync(jira_workflow_status);
CREATE INDEX IF NOT EXISTS idx_jira_sync_test_status ON public.jira_sync(jira_test_status);

-- Commentaires pour documentation
COMMENT ON COLUMN public.tickets.workflow_status IS 'Statut workflow Jira (ex: "Analyse terminée", "En développement")';
COMMENT ON COLUMN public.tickets.test_status IS 'Statut test Jira (ex: "Test Concluant", "Test en cours")';
COMMENT ON COLUMN public.tickets.issue_type IS 'Type d''issue Jira (Bug, Impediment, Task, Story)';
COMMENT ON COLUMN public.tickets.sprint_id IS 'Sprint Jira (ex: "Sprint 1 - Janvier 2024")';
COMMENT ON COLUMN public.tickets.related_ticket_id IS 'ID du ticket lié dans Supabase (si existe)';
COMMENT ON COLUMN public.tickets.related_ticket_key IS 'Clé Jira du ticket lié (ex: "B-OD-029")';
COMMENT ON COLUMN public.tickets.target_date IS 'Date cible de résolution';
COMMENT ON COLUMN public.tickets.resolved_at IS 'Date de résolution effective';

