-- OnpointDoc - Comment attachments (Storage + RLS côté DB)
-- Table des métadonnées pour fichiers stockés dans Storage (bucket: comment-attachments)

-- Créer le bucket Storage pour les pièces jointes des commentaires
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'comment-attachments',
  'comment-attachments',
  false, -- Bucket privé (accès via RLS)
  20971520 -- 20MB max par fichier
)
on conflict (id) do nothing;

-- Table des métadonnées pour les pièces jointes
create table if not exists public.comment_attachments (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.ticket_comments(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_kb integer,
  stored_at timestamptz default now()
);

create index if not exists idx_comment_attachments_comment on public.comment_attachments(comment_id);

alter table if exists public.comment_attachments enable row level security;

drop policy if exists ca_read_if_comment_visible on public.comment_attachments;
drop policy if exists ca_insert_if_comment_visible on public.comment_attachments;
drop policy if exists ca_delete_owner on public.comment_attachments;

-- Policy : Lecture si le ticket associé au commentaire est visible
create policy ca_read_if_comment_visible
on public.comment_attachments for select to authenticated
using (
  exists (
    select 1 from public.ticket_comments tc
    join public.tickets t on t.id = tc.ticket_id
    join public.profiles p on p.auth_uid = auth.uid()
    where tc.id = public.comment_attachments.comment_id
      and (
        t.created_by = p.id 
        or t.assigned_to = p.id 
        or (p.role::text like '%manager%') 
        or p.role::text in ('director', 'daf')
      )
  )
);

-- Policy : Insertion si l'utilisateur peut voir le ticket associé au commentaire
create policy ca_insert_if_comment_visible
on public.comment_attachments for insert to authenticated
with check (
  exists (
    select 1 from public.ticket_comments tc
    join public.tickets t on t.id = tc.ticket_id
    join public.profiles p on p.auth_uid = auth.uid()
    where tc.id = public.comment_attachments.comment_id
      and (
        t.created_by = p.id 
        or t.assigned_to = p.id 
        or (p.role::text like '%manager%')
      )
  )
);

-- Policy : Suppression si l'utilisateur est l'auteur du commentaire ou un admin
create policy ca_delete_owner
on public.comment_attachments for delete to authenticated
using (
  exists (
    select 1 from public.ticket_comments tc
    join public.profiles p on p.auth_uid = auth.uid()
    where tc.id = public.comment_attachments.comment_id
      and (
        tc.user_id = p.id 
        or p.role::text = 'admin'
      )
      and tc.origin = 'app'
  )
);

-- Policies RLS pour le storage.objects (accès aux fichiers)
-- Supprimer les policies existantes si elles existent
drop policy if exists "ca_storage_read" on storage.objects;
drop policy if exists "ca_storage_insert" on storage.objects;
drop policy if exists "ca_storage_delete" on storage.objects;

-- Permettre la lecture des fichiers pour les utilisateurs autorisés
create policy "ca_storage_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'comment-attachments'
  and exists (
    select 1 from public.comment_attachments ca
    join public.ticket_comments tc on tc.id = ca.comment_id
    join public.tickets t on t.id = tc.ticket_id
    join public.profiles p on p.auth_uid = auth.uid()
    where ca.file_path = name
      and (
        t.created_by = p.id 
        or t.assigned_to = p.id 
        or (p.role::text like '%manager%') 
        or p.role::text in ('director', 'daf')
      )
  )
);

-- Permettre l'upload de fichiers pour les utilisateurs authentifiés (contrôlé par la table comment_attachments)
create policy "ca_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'comment-attachments'
);

-- Permettre la suppression de fichiers pour l'auteur du commentaire ou un admin
create policy "ca_storage_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'comment-attachments'
  and exists (
    select 1 from public.comment_attachments ca
    join public.ticket_comments tc on tc.id = ca.comment_id
    join public.profiles p on p.auth_uid = auth.uid()
    where ca.file_path = name
      and (
        tc.user_id = p.id 
        or p.role::text = 'admin'
      )
      and tc.origin = 'app'
  )
);
