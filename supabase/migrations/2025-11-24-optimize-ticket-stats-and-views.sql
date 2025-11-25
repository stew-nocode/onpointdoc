-- Optimisation des statistiques tickets/utilisateurs et pré-calculs dashboard

-- Index sur tickets pour accélérer filtres et tris
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets (created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status_assigned ON public.tickets (status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON public.tickets (ticket_type);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets (priority);
CREATE INDEX IF NOT EXISTS idx_tickets_target_date ON public.tickets (target_date);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by_created_at ON public.tickets (created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_created_at ON public.tickets (assigned_to, created_at);

-- Index sur tables enfants utilisées par les stats
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON public.ticket_comments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON public.ticket_attachments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id ON public.ticket_status_history (ticket_id);

-- Materialized view : résumé des stats tickets
CREATE MATERIALIZED VIEW IF NOT EXISTS public.ticket_stats_summary
AS
SELECT
  t.id AS ticket_id,
  COALESCE(c.comments_count, 0) AS comments_count,
  COALESCE(a.attachments_count, 0) AS attachments_count,
  COALESCE(sh.status_changes_count, 0) AS status_changes_count,
  t.updated_at AS last_update_date,
  t.created_at AS created_at
FROM public.tickets t
LEFT JOIN (
  SELECT ticket_id, COUNT(*) AS comments_count
  FROM public.ticket_comments
  GROUP BY ticket_id
) c ON c.ticket_id = t.id
LEFT JOIN (
  SELECT ticket_id, COUNT(*) AS attachments_count
  FROM public.ticket_attachments
  GROUP BY ticket_id
) a ON a.ticket_id = t.id
LEFT JOIN (
  SELECT ticket_id, COUNT(*) AS status_changes_count
  FROM public.ticket_status_history
  GROUP BY ticket_id
) sh ON sh.ticket_id = t.id
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS ticket_stats_summary_ticket_id_idx
  ON public.ticket_stats_summary (ticket_id);

REFRESH MATERIALIZED VIEW public.ticket_stats_summary;

-- Materialized view : stats utilisateurs pour le mois courant
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_ticket_stats_current_month
AS
WITH params AS (
  SELECT date_trunc('month', timezone('UTC', now())) AS month_start,
         timezone('UTC', now())::date AS today
),
created_total AS (
  SELECT created_by AS profile_id, COUNT(*) AS total_created
  FROM public.tickets
  WHERE created_by IS NOT NULL
  GROUP BY created_by
),
created_month AS (
  SELECT created_by AS profile_id, COUNT(*) AS created_this_month
  FROM public.tickets, params
  WHERE created_by IS NOT NULL
    AND created_at >= params.month_start
  GROUP BY created_by
),
assigned_total AS (
  SELECT assigned_to AS profile_id, COUNT(*) AS total_assigned
  FROM public.tickets
  WHERE assigned_to IS NOT NULL
  GROUP BY assigned_to
),
assigned_month AS (
  SELECT assigned_to AS profile_id, COUNT(*) AS assigned_this_month
  FROM public.tickets, params
  WHERE assigned_to IS NOT NULL
    AND created_at >= params.month_start
  GROUP BY assigned_to
),
resolved_total AS (
  SELECT assigned_to AS profile_id, COUNT(*) AS resolved_total
  FROM public.tickets
  WHERE assigned_to IS NOT NULL
    AND status IN ('Resolue', 'Terminé', 'Terminé(e)')
  GROUP BY assigned_to
),
in_progress_total AS (
  SELECT assigned_to AS profile_id, COUNT(*) AS in_progress_total
  FROM public.tickets
  WHERE assigned_to IS NOT NULL
    AND status NOT IN ('Resolue', 'Terminé', 'Terminé(e)')
  GROUP BY assigned_to
),
overdue_total AS (
  SELECT assigned_to AS profile_id, COUNT(*) AS overdue_total
  FROM public.tickets, params
  WHERE assigned_to IS NOT NULL
    AND target_date IS NOT NULL
    AND target_date::date < params.today
    AND status NOT IN ('Resolue', 'Terminé', 'Terminé(e)')
  GROUP BY assigned_to
)
SELECT
  p.id AS profile_id,
  COALESCE(created_total.total_created, 0) AS total_created,
  COALESCE(created_month.created_this_month, 0) AS created_this_month,
  COALESCE(assigned_total.total_assigned, 0) AS total_assigned,
  COALESCE(assigned_month.assigned_this_month, 0) AS assigned_this_month,
  COALESCE(resolved_total.resolved_total, 0) AS resolved_total,
  COALESCE(in_progress_total.in_progress_total, 0) AS in_progress_total,
  COALESCE(overdue_total.overdue_total, 0) AS overdue_total
FROM public.profiles p
LEFT JOIN created_total ON created_total.profile_id = p.id
LEFT JOIN created_month ON created_month.profile_id = p.id
LEFT JOIN assigned_total ON assigned_total.profile_id = p.id
LEFT JOIN assigned_month ON assigned_month.profile_id = p.id
LEFT JOIN resolved_total ON resolved_total.profile_id = p.id
LEFT JOIN in_progress_total ON in_progress_total.profile_id = p.id
LEFT JOIN overdue_total ON overdue_total.profile_id = p.id
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS user_ticket_stats_current_month_profile_id_idx
  ON public.user_ticket_stats_current_month (profile_id);

REFRESH MATERIALIZED VIEW public.user_ticket_stats_current_month;
