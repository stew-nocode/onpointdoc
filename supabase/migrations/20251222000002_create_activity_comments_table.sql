-- Migration: Création de la table activity_comments
-- Description: Table pour les commentaires sur les activités
-- Date: 2025-12-22

-- Créer la table activity_comments si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  content text NOT NULL,
  comment_type text CHECK (comment_type IN ('comment', 'followup')),
  origin public.comment_origin_t DEFAULT 'app'::public.comment_origin_t,
  jira_comment_id text, -- Pour éviter les doublons lors de la synchronisation JIRA
  created_at timestamptz DEFAULT now()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON public.activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON public.activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created_at ON public.activity_comments(created_at DESC);

-- Activer RLS
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS activity_comments_read_if_activity_visible ON public.activity_comments;
DROP POLICY IF EXISTS activity_comments_insert_if_activity_visible ON public.activity_comments;
DROP POLICY IF EXISTS activity_comments_update_owner_manager ON public.activity_comments;
DROP POLICY IF EXISTS activity_comments_delete_manager ON public.activity_comments;

-- Policy SELECT: Lecture des commentaires
-- Accessible par: créateur de l'activité, participants, managers, admin, director, daf
CREATE POLICY activity_comments_read_if_activity_visible
ON public.activity_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.profiles p_auth ON p_auth.auth_uid = auth.uid()
    WHERE a.id = public.activity_comments.activity_id
      AND (
        a.created_by = p_auth.id
        OR EXISTS (SELECT 1 FROM public.activity_participants ap WHERE ap.activity_id = a.id AND ap.user_id = p_auth.id)
        OR (p_auth.role::text LIKE '%manager%')
        OR p_auth.role::text IN ('admin', 'director', 'daf')
      )
  )
);

-- Policy INSERT: Création de commentaires
-- Accessible par: créateur de l'activité, participants, managers, admin, director, daf
CREATE POLICY activity_comments_insert_if_activity_visible
ON public.activity_comments FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.profiles p_auth ON p_auth.auth_uid = auth.uid()
    WHERE a.id = public.activity_comments.activity_id
      AND (
        a.created_by = p_auth.id
        OR EXISTS (SELECT 1 FROM public.activity_participants ap WHERE ap.activity_id = a.id AND ap.user_id = p_auth.id)
        OR (p_auth.role::text LIKE '%manager%')
        OR p_auth.role::text IN ('admin', 'director', 'daf')
      )
  )
);

-- Policy UPDATE: Modification des commentaires
-- Accessible par: auteur du commentaire ou managers
CREATE POLICY activity_comments_update_owner_manager
ON public.activity_comments FOR UPDATE TO authenticated
USING (
  (public.activity_comments.user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_uid = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_uid = auth.uid() AND p.role::text LIKE '%manager%')
)
WITH CHECK (
  (public.activity_comments.user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_uid = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_uid = auth.uid() AND p.role::text LIKE '%manager%')
);

-- Policy DELETE: Suppression des commentaires
-- Accessible uniquement par les managers
CREATE POLICY activity_comments_delete_manager
ON public.activity_comments FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_uid = auth.uid() AND p.role::text LIKE '%manager%')
);

-- Commentaire sur la table
COMMENT ON TABLE public.activity_comments IS 'Commentaires sur les activités - Pattern identique à ticket_comments';

