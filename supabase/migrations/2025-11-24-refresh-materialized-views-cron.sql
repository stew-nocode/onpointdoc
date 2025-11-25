-- Fonction utilitaire pour rafraîchir les vues matérialisées critiques
create extension if not exists pg_cron with schema extensions;

create or replace function public.refresh_dashboard_materialized_views()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Rafraîchir les vues en mode CONCURRENT pour éviter les locks de lecture
  refresh materialized view concurrently public.ticket_stats_summary;
  refresh materialized view concurrently public.user_ticket_stats_current_month;
end;
$$;

comment on function public.refresh_dashboard_materialized_views()
  is 'Rafraîchit les vues matérialisées utilisées par les tooltips/stats dashboard.';

-- Planification toutes les 30 minutes
select
  cron.schedule(
    'refresh_dashboard_materialized_views_every_30min',
    '*/30 * * * *',
    $$select public.refresh_dashboard_materialized_views();$$
  )
on conflict (jobname) do update
  set schedule = excluded.schedule,
      command = excluded.command,
      nodename = excluded.nodename,
      nodeport = excluded.nodeport;
