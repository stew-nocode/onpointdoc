-- OnpointDoc - RLS Phase 1 (prudente)
-- Date: 2025-11-16
-- Scope: tickets, ticket_comments, link tables, activities, tasks, relations
-- Note: Ces scripts reflètent les migrations appliquées via MCP Supabase.
-- Ils sont idempotents autant que possible et documentent les règles.

-------------------------------
-- TICKETS
-------------------------------
-- Colonnes et index de base
alter table if exists public.tickets add column if not exists created_by uuid;
alter table if exists public.tickets add column if not exists team_id uuid;
alter table if exists public.tickets add column if not exists origin text;
alter table if exists public.tickets alter column created_by set default auth.uid();

create index if not exists idx_tickets_created_by on public.tickets(created_by);
create index if not exists idx_tickets_team_id on public.tickets(team_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_type on public.tickets(ticket_type);

-- Activer RLS
alter table if exists public.tickets enable row level security;

-- Nettoyage policies (si existent)
drop policy if exists tickets_read_owner on public.tickets;
drop policy if exists tickets_read_assigned on public.tickets;
drop policy if exists tickets_read_managers on public.tickets;
drop policy if exists tickets_insert_support_only on public.tickets;
drop policy if exists tickets_update_owner_assigned_manager on public.tickets;
drop policy if exists tickets_no_update_on_jira_origin on public.tickets;
drop policy if exists tickets_delete_managers_only on public.tickets;
drop policy if exists tickets_read_director on public.tickets;

-- Lecture: owner / assigné / managers / direction
create policy tickets_read_owner
on public.tickets for select to authenticated
using (created_by = auth.uid());

create policy tickets_read_assigned
on public.tickets for select to authenticated
using (assigned_to = auth.uid());

create policy tickets_read_managers
on public.tickets for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text like '%manager%'
  )
);

create policy tickets_read_director
on public.tickets for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text in ('director','daf')
  )
);

-- Insert: Support uniquement, ownership
create policy tickets_insert_support_only
on public.tickets for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('agent_support','manager_support')
  )
);

-- Update: owner / assigné / managers
create policy tickets_update_owner_assigned_manager
on public.tickets for update to authenticated
using (
  created_by = auth.uid()
  or assigned_to = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')
)
with check (
  created_by = auth.uid()
  or assigned_to = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')
);

-- Bloquer les updates client sur origin='jira'
create policy tickets_no_update_on_jira_origin
on public.tickets for update to authenticated
using (origin != 'jira')
with check (origin != 'jira');

-- Delete: managers
create policy tickets_delete_managers_only
on public.tickets for delete to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')
);

-------------------------------
-- TICKET COMMENTS
-------------------------------
alter table if exists public.ticket_comments add column if not exists user_id uuid;
alter table if exists public.ticket_comments add column if not exists origin public.comment_origin_t; -- adapter si type différent
create index if not exists idx_ticket_comments_ticket on public.ticket_comments(ticket_id);
create index if not exists idx_ticket_comments_user on public.ticket_comments(user_id);
alter table if exists public.ticket_comments enable row level security;

drop policy if exists comments_read_if_ticket_visible on public.ticket_comments;
drop policy if exists comments_insert_if_ticket_visible on public.ticket_comments;
drop policy if exists comments_update_owner_manager on public.ticket_comments;
drop policy if exists comments_delete_manager on public.ticket_comments;

create policy comments_read_if_ticket_visible
on public.ticket_comments for select to authenticated
using (
  exists (
    select 1 from public.tickets t
    where t.id = public.ticket_comments.ticket_id
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf')))
      )
  )
);

create policy comments_insert_if_ticket_visible
on public.ticket_comments for insert to authenticated
with check (
  exists (
    select 1 from public.tickets t
    where t.id = public.ticket_comments.ticket_id
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')
      )
  )
);

create policy comments_update_owner_manager
on public.ticket_comments for update to authenticated
using (
  (public.ticket_comments.user_id = auth.uid()
   or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'))
  and (public.ticket_comments.origin is null or public.ticket_comments.origin::text != 'jira')
)
with check (
  (public.ticket_comments.user_id = auth.uid()
   or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'))
  and (public.ticket_comments.origin is null or public.ticket_comments.origin::text != 'jira')
);

create policy comments_delete_manager
on public.ticket_comments for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));

-------------------------------
-- LINKS: ticket_activity_link / ticket_task_link
-------------------------------
alter table if exists public.ticket_activity_link enable row level security;
drop policy if exists link_read_visible_if_ticket_visible on public.ticket_activity_link;
drop policy if exists link_insert_if_ticket_visible on public.ticket_activity_link;
drop policy if exists link_delete_manager on public.ticket_activity_link;

create policy link_read_visible_if_ticket_visible
on public.ticket_activity_link for select to authenticated
using (
  exists (select 1 from public.tickets t where t.id = public.ticket_activity_link.ticket_id
          and (t.created_by = auth.uid() or t.assigned_to = auth.uid()
               or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf')))))
);

create policy link_insert_if_ticket_visible
on public.ticket_activity_link for insert to authenticated
with check (
  exists (select 1 from public.tickets t where t.id = public.ticket_activity_link.ticket_id
          and (t.created_by = auth.uid() or t.assigned_to = auth.uid()
               or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')))
);

create policy link_delete_manager
on public.ticket_activity_link for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));

alter table if exists public.ticket_task_link enable row level security;
drop policy if exists link_task_read_visible_if_ticket_visible on public.ticket_task_link;
drop policy if exists link_task_insert_if_ticket_visible on public.ticket_task_link;
drop policy if exists link_task_delete_manager on public.ticket_task_link;

create policy link_task_read_visible_if_ticket_visible
on public.ticket_task_link for select to authenticated
using (
  exists (select 1 from public.tickets t where t.id = public.ticket_task_link.ticket_id
          and (t.created_by = auth.uid() or t.assigned_to = auth.uid()
               or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf')))))
);

create policy link_task_insert_if_ticket_visible
on public.ticket_task_link for insert to authenticated
with check (
  exists (select 1 from public.tickets t where t.id = public.ticket_task_link.ticket_id
          and (t.created_by = auth.uid() or t.assigned_to = auth.uid()
               or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')))
);

create policy link_task_delete_manager
on public.ticket_task_link for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));

-------------------------------
-- ACTIVITIES / TASKS (base)
-------------------------------
alter table if exists public.activities enable row level security;
create index if not exists idx_activities_created_by on public.activities(created_by);

drop policy if exists activities_read_owner on public.activities;
drop policy if exists activities_read_managers on public.activities;
drop policy if exists activities_insert_owner on public.activities;
drop policy if exists activities_update_owner_manager on public.activities;
drop policy if exists activities_delete_manager on public.activities;
drop policy if exists activities_read_director on public.activities;

create policy activities_read_owner on public.activities for select to authenticated using (created_by = auth.uid());
create policy activities_read_managers on public.activities for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf'))));
create policy activities_insert_owner on public.activities for insert to authenticated with check (created_by = auth.uid());
create policy activities_update_owner_manager on public.activities for update to authenticated using (created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')) with check (created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));
create policy activities_delete_manager on public.activities for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));
create policy activities_read_director on public.activities for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('director','daf')));

alter table if exists public.tasks enable row level security;
create index if not exists idx_tasks_created_by on public.tasks(created_by);

drop policy if exists tasks_read_owner on public.tasks;
drop policy if exists tasks_read_managers on public.tasks;
drop policy if exists tasks_insert_owner on public.tasks;
drop policy if exists tasks_update_owner_manager on public.tasks;
drop policy if exists tasks_delete_manager on public.tasks;
drop policy if exists tasks_read_director on public.tasks;

create policy tasks_read_owner on public.tasks for select to authenticated using (created_by = auth.uid());
create policy tasks_read_managers on public.tasks for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf'))));
create policy tasks_insert_owner on public.tasks for insert to authenticated with check (created_by = auth.uid());
create policy tasks_update_owner_manager on public.tasks for update to authenticated using (created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%')) with check (created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));
create policy tasks_delete_manager on public.tasks for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));
create policy tasks_read_director on public.tasks for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('director','daf')));

-------------------------------
-- RELATIONS ACTIVITIES/TASKS
-------------------------------
alter table if exists public.activity_participants enable row level security;
create index if not exists idx_activity_participants_activity on public.activity_participants(activity_id);
create index if not exists idx_activity_participants_user on public.activity_participants(user_id);

drop policy if exists ap_read_if_activity_visible on public.activity_participants;
drop policy if exists ap_insert_if_activity_owner_or_manager on public.activity_participants;
drop policy if exists ap_delete_manager on public.activity_participants;

create policy ap_read_if_activity_visible on public.activity_participants for select to authenticated using (exists (select 1 from public.activities a where a.id = public.activity_participants.activity_id and (a.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf'))))));
create policy ap_insert_if_activity_owner_or_manager on public.activity_participants for insert to authenticated with check (exists (select 1 from public.activities a where a.id = public.activity_participants.activity_id and (a.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'))));
create policy ap_delete_manager on public.activity_participants for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));

alter table if exists public.activity_report_attachments enable row level security;
create index if not exists idx_activity_attach_activity on public.activity_report_attachments(activity_id);

drop policy if exists ara_read_if_activity_visible on public.activity_report_attachments;
drop policy if exists ara_insert_if_activity_owner_or_manager on public.activity_report_attachments;
drop policy if exists ara_delete_manager on public.activity_report_attachments;

create policy ara_read_if_activity_visible on public.activity_report_attachments for select to authenticated using (exists (select 1 from public.activities a where a.id = public.activity_report_attachments.activity_id and (a.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf'))))));
create policy ara_insert_if_activity_owner_or_manager on public.activity_report_attachments for insert to authenticated with check (exists (select 1 from public.activities a where a.id = public.activity_report_attachments.activity_id and (a.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'))));
create policy ara_delete_manager on public.activity_report_attachments for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));

alter table if exists public.activity_report_history enable row level security;
create index if not exists idx_activity_history_activity on public.activity_report_history(activity_id);
create index if not exists idx_activity_history_author on public.activity_report_history(author_id);

drop policy if exists arh_read_if_activity_visible on public.activity_report_history;
drop policy if exists arh_insert_owner_or_manager on public.activity_report_history;
drop policy if exists arh_delete_manager on public.activity_report_history;

create policy arh_read_if_activity_visible on public.activity_report_history for select to authenticated using (exists (select 1 from public.activities a where a.id = public.activity_report_history.activity_id and (a.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf'))))));
create policy arh_insert_owner_or_manager on public.activity_report_history for insert to authenticated with check (public.activity_report_history.author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));
create policy arh_delete_manager on public.activity_report_history for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));

alter table if exists public.activity_task_link enable row level security;
create index if not exists idx_activity_task_link_activity on public.activity_task_link(activity_id);
create index if not exists idx_activity_task_link_task on public.activity_task_link(task_id);

drop policy if exists atl_read_if_activity_visible on public.activity_task_link;
drop policy if exists atl_insert_if_activity_owner_or_manager on public.activity_task_link;
drop policy if exists atl_delete_manager on public.activity_task_link;

create policy atl_read_if_activity_visible on public.activity_task_link for select to authenticated using (exists (select 1 from public.activities a where a.id = public.activity_task_link.activity_id and (a.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf'))))));
create policy atl_insert_if_activity_owner_or_manager on public.activity_task_link for insert to authenticated with check (exists (select 1 from public.activities a where a.id = public.activity_task_link.activity_id and (a.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'))));
create policy atl_delete_manager on public.activity_task_link for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));

alter table if exists public.task_attachments enable row level security;
create index if not exists idx_task_attachments_task on public.task_attachments(task_id);

drop policy if exists ta_read_if_task_visible on public.task_attachments;
drop policy if exists ta_insert_if_task_owner_or_manager on public.task_attachments;
drop policy if exists ta_delete_manager on public.task_attachments;

create policy ta_read_if_task_visible on public.task_attachments for select to authenticated using (exists (select 1 from public.tasks t where t.id = public.task_attachments.task_id and (t.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and (p.role::text like '%manager%' or p.role::text in ('director','daf'))))));
create policy ta_insert_if_task_owner_or_manager on public.task_attachments for insert to authenticated with check (exists (select 1 from public.tasks t where t.id = public.task_attachments.task_id and (t.created_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'))));
create policy ta_delete_manager on public.task_attachments for delete to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text like '%manager%'));


