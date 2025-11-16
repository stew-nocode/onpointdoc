-- OnpointDoc - RLS Phase 2 (team scope minimal)
-- Date: 2025-11-16
-- Adds team_id columns + durcit les policies par équipe

-- Tables et colonnes
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists team_id uuid references public.teams(id) on update cascade on delete set null;
create index if not exists idx_profiles_team_id on public.profiles(team_id);

alter table public.tickets add column if not exists team_id uuid;
create index if not exists idx_tickets_team_id on public.tickets(team_id);

alter table public.activities add column if not exists team_id uuid;
create index if not exists idx_activities_team_id on public.activities(team_id);

alter table public.tasks add column if not exists team_id uuid;
create index if not exists idx_tasks_team_id on public.tasks(team_id);

-- Policies resserrées par équipe
-- Tickets
drop policy if exists tickets_read_manager_team on public.tickets;
drop policy if exists tickets_update_manager_team on public.tickets;
drop policy if exists tickets_delete_manager_team on public.tickets;
drop policy if exists tickets_read_managers on public.tickets;
drop policy if exists tickets_update_owner_assigned_manager on public.tickets;
drop policy if exists tickets_delete_managers_only on public.tickets;

create policy tickets_read_manager_team
on public.tickets for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tickets.team_id));

create policy tickets_update_manager_team
on public.tickets for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tickets.team_id))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tickets.team_id));

create policy tickets_delete_manager_team
on public.tickets for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tickets.team_id));

-- ticket_comments
drop policy if exists comments_read_if_ticket_visible on public.ticket_comments;
drop policy if exists comments_insert_if_ticket_visible on public.ticket_comments;
drop policy if exists comments_update_owner_manager on public.ticket_comments;
drop policy if exists comments_delete_manager on public.ticket_comments;

create policy comments_read_if_ticket_visible
on public.ticket_comments for select to authenticated
using (
  exists (\n    select 1 from public.tickets t join public.profiles p on p.id = auth.uid()\n    where t.id = public.ticket_comments.ticket_id\n      and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%' and p.team_id = t.team_id) or p.role::text in ('director','daf'))\n  )
);

create policy comments_insert_if_ticket_visible
on public.ticket_comments for insert to authenticated
with check (
  exists (\n    select 1 from public.tickets t join public.profiles p on p.id = auth.uid()\n    where t.id = public.ticket_comments.ticket_id\n      and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%' and p.team_id = t.team_id))\n  )
);

create policy comments_update_owner_manager
on public.ticket_comments for update to authenticated
using ((public.ticket_comments.user_id = auth.uid() or exists (select 1 from public.profiles p join public.tickets t on t.id = public.ticket_comments.ticket_id where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = t.team_id)) and (public.ticket_comments.origin is null or public.ticket_comments.origin::text != 'jira'))
with check ((public.ticket_comments.user_id = auth.uid() or exists (select 1 from public.profiles p join public.tickets t on t.id = public.ticket_comments.ticket_id where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = t.team_id)) and (public.ticket_comments.origin is null or public.ticket_comments.origin::text != 'jira'));

create policy comments_delete_manager
on public.ticket_comments for delete to authenticated
using (exists (select 1 from public.profiles p join public.tickets t on t.id = public.ticket_comments.ticket_id where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = t.team_id));

-- ticket_activity_link
drop policy if exists link_read_visible_if_ticket_visible on public.ticket_activity_link;
drop policy if exists link_insert_if_ticket_visible on public.ticket_activity_link;
drop policy if exists link_delete_manager on public.ticket_activity_link;

create policy link_read_visible_if_ticket_visible
on public.ticket_activity_link for select to authenticated
using (exists (select 1 from public.tickets t join public.profiles p on p.id = auth.uid() where t.id = public.ticket_activity_link.ticket_id and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%' and p.team_id = t.team_id) or p.role::text in ('director','daf'))));

create policy link_insert_if_ticket_visible
on public.ticket_activity_link for insert to authenticated
with check (exists (select 1 from public.tickets t join public.profiles p on p.id = auth.uid() where t.id = public.ticket_activity_link.ticket_id and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%' and p.team_id = t.team_id))));

create policy link_delete_manager
on public.ticket_activity_link for delete to authenticated
using (exists (select 1 from public.profiles p join public.tickets t on t.id = public.ticket_activity_link.ticket_id where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = t.team_id));

-- ticket_task_link
drop policy if exists link_task_read_visible_if_ticket_visible on public.ticket_task_link;
drop policy if exists link_task_insert_if_ticket_visible on public.ticket_task_link;
drop policy if exists link_task_delete_manager on public.ticket_task_link;

create policy link_task_read_visible_if_ticket_visible
on public.ticket_task_link for select to authenticated
using (exists (select 1 from public.tickets t join public.profiles p on p.id = auth.uid() where t.id = public.ticket_task_link.ticket_id and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%' and p.team_id = t.team_id) or p.role::text in ('director','daf'))));

create policy link_task_insert_if_ticket_visible
on public.ticket_task_link for insert to authenticated
with check (exists (select 1 from public.tickets t join public.profiles p on p.id = auth.uid() where t.id = public.ticket_task_link.ticket_id and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%' and p.team_id = t.team_id))));

create policy link_task_delete_manager
on public.ticket_task_link for delete to authenticated
using (exists (select 1 from public.profiles p join public.tickets t on t.id = public.ticket_task_link.ticket_id where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = t.team_id));

-- Activities (resserré par team)
drop policy if exists activities_read_manager_team on public.activities;
drop policy if exists activities_update_manager_team on public.activities;
drop policy if exists activities_delete_manager_team on public.activities;

create policy activities_read_manager_team
on public.activities for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.activities.team_id) or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('director','daf')));

create policy activities_update_manager_team
on public.activities for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.activities.team_id))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.activities.team_id));

create policy activities_delete_manager_team
on public.activities for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.activities.team_id));

-- Tasks (resserré par team)
drop policy if exists tasks_read_manager_team on public.tasks;
drop policy if exists tasks_update_manager_team on public.tasks;
drop policy if exists tasks_delete_manager_team on public.tasks;

create policy tasks_read_manager_team
on public.tasks for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tasks.team_id) or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('director','daf')));

create policy tasks_update_manager_team
on public.tasks for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tasks.team_id))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tasks.team_id));

create policy tasks_delete_manager_team
on public.tasks for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%' and p.team_id = public.tasks.team_id));


