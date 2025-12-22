/**
 * CRUD pour les commentaires d'activités
 * 
 * Pattern identique à src/services/tasks/comments/crud.ts
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import type { ActivityComment } from './types';

/**
 * Type du client Supabase serveur
 */
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Vérifie l'authentification de l'utilisateur et retourne son profil
 */
async function verifyUserAuthentication(): Promise<{ profileId: string; role: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw createError.unauthorized('Vous devez être connecté pour effectuer cette action');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_uid', user.id)
    .single();

  if (profileError || !profile) {
    throw createError.unauthorized('Profil utilisateur introuvable');
  }

  return { profileId: profile.id, role: profile.role };
}

/**
 * Vérifie que l'activité existe
 */
async function verifyActivityExists(activityId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: activity, error } = await supabase
    .from('activities')
    .select('id')
    .eq('id', activityId)
    .single();

  if (error || !activity) {
    throw createError.notFound('Activité introuvable');
  }
}

/**
 * Insère un nouveau commentaire en base de données
 */
async function insertComment(
  supabase: SupabaseServerClient,
  activityId: string,
  profileId: string,
  content: string,
  commentType: 'comment' | 'followup' = 'comment'
) {
  const { data: comment, error: insertError } = await supabase
    .from('activity_comments')
    .insert({
      activity_id: activityId,
      user_id: profileId,
      content,
      origin: 'app',
      comment_type: commentType
    })
    .select('id, activity_id, user_id, content, origin, comment_type, jira_comment_id, created_at')
    .single();

  if (insertError || !comment) {
    throw createError.supabaseError(
      'Erreur lors de la création du commentaire',
      insertError ? new Error(insertError.message) : undefined
    );
  }

  return comment;
}

/**
 * Construit la réponse du commentaire avec les données utilisateur
 */
async function buildCommentResponse(
  comment: {
    id: string;
    activity_id: string;
    user_id: string | null;
    content: string;
    origin: 'app' | 'jira_comment' | null;
    comment_type: 'comment' | 'followup' | null;
    jira_comment_id: string | null;
    created_at: string;
  },
  profileId: string
): Promise<ActivityComment> {
  const supabase = await createSupabaseServerClient();
  
  const { data: user } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', profileId)
    .single();

  return {
    ...comment,
    user: user ?? null
  };
}

/**
 * Crée un nouveau commentaire sur une activité
 * 
 * @param activityId - UUID de l'activité
 * @param content - Contenu du commentaire
 * @param commentType - Type de commentaire ('comment' ou 'followup')
 * @returns Le commentaire créé
 */
export async function createActivityComment(
  activityId: string,
  content: string,
  commentType: 'comment' | 'followup' = 'comment'
): Promise<ActivityComment> {
  const { profileId } = await verifyUserAuthentication();
  await verifyActivityExists(activityId);

  const supabase = await createSupabaseServerClient();
  const comment = await insertComment(supabase, activityId, profileId, content, commentType);

  return buildCommentResponse(comment, profileId);
}

/**
 * Récupère tous les commentaires d'une activité
 * 
 * @param activityId - UUID de l'activité
 * @returns Liste des commentaires
 */
export async function getActivityComments(activityId: string): Promise<ActivityComment[]> {
  await verifyUserAuthentication();
  await verifyActivityExists(activityId);

  const supabase = await createSupabaseServerClient();
  const { data: comments, error } = await supabase
    .from('activity_comments')
    .select(`
      id,
      activity_id,
      user_id,
      content,
      origin,
      comment_type,
      jira_comment_id,
      created_at,
      user:profiles!activity_comments_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('activity_id', activityId)
    .order('created_at', { ascending: true });

  if (error) {
    throw createError.supabaseError(
      'Erreur lors de la récupération des commentaires',
      new Error(error.message)
    );
  }

  // Normaliser les relations (peuvent être array ou object)
  return (comments || []).map((comment) => {
    const user = Array.isArray(comment.user) ? comment.user[0] : comment.user;
    return {
      ...comment,
      user: user ?? null
    };
  });
}

/**
 * Supprime un commentaire d'une activité
 * 
 * @param commentId - UUID du commentaire à supprimer
 */
export async function deleteActivityComment(commentId: string): Promise<void> {
  const { profileId, role } = await verifyUserAuthentication();
  const supabase = await createSupabaseServerClient();

  // Charger le commentaire pour vérifier les permissions
  const { data: comment, error: loadError } = await supabase
    .from('activity_comments')
    .select('id, user_id, origin')
    .eq('id', commentId)
    .single();

  if (loadError || !comment) {
    throw createError.notFound('Commentaire introuvable');
  }

  // Vérifier les permissions : auteur ou manager
  const isOwner = comment.user_id === profileId;
  const isManager = role?.includes('manager');
  const isFromJira = comment.origin === 'jira_comment';

  if (!isOwner && !isManager) {
    throw createError.forbidden('Vous n\'êtes pas autorisé à supprimer ce commentaire');
  }

  if (isFromJira) {
    throw createError.forbidden('Les commentaires synchronisés depuis JIRA ne peuvent pas être supprimés');
  }

  // Supprimer le commentaire
  const { error: deleteError } = await supabase
    .from('activity_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    throw createError.supabaseError(
      'Erreur lors de la suppression du commentaire',
      new Error(deleteError.message)
    );
  }
}

