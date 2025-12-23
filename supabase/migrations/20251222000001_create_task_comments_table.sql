-- Migration: Création de la table task_comments
-- Description: Table pour les commentaires sur les tâches
-- Date: 2025-12-22

-- Créer la table task_comments si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  content text NOT NULL,
  comment_type text CHECK (comment_type IN ('comment', 'followup')),
  origin public.comment_origin_t DEFAULT 'app'::public.comment_origin_t,
  jira_comment_id text, -- Pour éviter les doublons lors de la synchronisation JIRA
  created_at timestamptz DEFAULT now()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON public.task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at DESC);

-- Activer RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS task_comments_read_if_task_visible ON public.task_comments;
DROP POLICY IF EXISTS task_comments_insert_if_task_visible ON public.task_comments;
DROP POLICY IF EXISTS task_comments_update_owner_manager ON public.task_comments;
DROP POLICY IF EXISTS task_comments_delete_manager ON public.task_comments;

-- Policy SELECT: Lecture des commentaires
-- Accessible par: créateur de la tâche, assigné, managers, admin, director, daf
CREATE POLICY task_comments_read_if_task_visible
ON public.task_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.profiles p_auth ON p_auth.auth_uid = auth.uid()
    WHERE t.id = public.task_comments.task_id
      AND (
        t.created_by = p_auth.id
        OR t.assigned_to = p_auth.id
        OR (p_auth.role::text LIKE '%manager%')
        OR p_auth.role::text IN ('admin', 'director', 'daf')
      )
  )
);

-- Policy INSERT: Création de commentaires
-- Accessible par: créateur de la tâche, assigné, managers, admin, director, daf
CREATE POLICY task_comments_insert_if_task_visible
ON public.task_comments FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.profiles p_auth ON p_auth.auth_uid = auth.uid()
    WHERE t.id = public.task_comments.task_id
      AND (
        t.created_by = p_auth.id
        OR t.assigned_to = p_auth.id
        OR (p_auth.role::text LIKE '%manager%')
        OR p_auth.role::text IN ('admin', 'director', 'daf')
      )
  )
);

-- Policy UPDATE: Modification des commentaires
-- Accessible par: auteur du commentaire ou managers
CREATE POLICY task_comments_update_owner_manager
ON public.task_comments FOR UPDATE TO authenticated
USING (
  (public.task_comments.user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_uid = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_uid = auth.uid() AND p.role::text LIKE '%manager%')
)
WITH CHECK (
  (public.task_comments.user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_uid = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_uid = auth.uid() AND p.role::text LIKE '%manager%')
);

-- Policy DELETE: Suppression des commentaires
-- Accessible uniquement par les managers
CREATE POLICY task_comments_delete_manager
ON public.task_comments FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_uid = auth.uid() AND p.role::text LIKE '%manager%')
);

-- Commentaire sur la table
COMMENT ON TABLE public.task_comments IS 'Commentaires sur les tâches - Pattern identique à ticket_comments';

