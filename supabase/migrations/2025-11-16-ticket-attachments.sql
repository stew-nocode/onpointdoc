-- OnpointDoc - Ticket attachments (Storage + RLS côté DB)
-- Table des métadonnées pour fichiers stockés dans Storage (bucket: ticket-attachments)

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  file_path text not null,
  mime_type text,
  size_kb integer,
  stored_at timestamptz default now()
);

create index if not exists idx_ticket_attachments_ticket on public.ticket_attachments(ticket_id);

alter table if exists public.ticket_attachments enable row level security;

drop policy if exists ta_read_if_ticket_visible on public.ticket_attachments;
drop policy if exists ta_insert_if_ticket_visible on public.ticket_attachments;
drop policy if exists ta_delete_manager on public.ticket_attachments;

create policy ta_read_if_ticket_visible
on public.ticket_attachments for select to authenticated
using (
  exists (
    select 1 from public.tickets t
    join public.profiles p on p.id = auth.uid()
    where t.id = public.ticket_attachments.ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%') or p.role::text in ('director','daf'))
  )
);

create policy ta_insert_if_ticket_visible
on public.ticket_attachments for insert to authenticated
with check (
  exists (
    select 1 from public.tickets t
    join public.profiles p on p.id = auth.uid()
    where t.id = public.ticket_attachments.ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid() or (p.role::text like '%manager%'))
  )
);

create policy ta_delete_manager
on public.ticket_attachments for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    join public.tickets t on t.id = public.ticket_attachments.ticket_id
    where p.id = auth.uid() and p.role::text like '%manager%'
  )
);


