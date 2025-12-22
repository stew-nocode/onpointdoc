/**
 * CRUD pour les commentaires de tâches
 * 
 * Pattern identique à src/services/tickets/comments/crud.ts
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import type { TaskComment } from './types';

/**
 * Type du client Supabase serveur
 */
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Vérifie l'authentification de l'utilisateur et retourne son profil
 * 
 * @returns Profile ID de l'utilisateur connecté
 * @throws ApplicationError si non authentifié
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
 * Vérifie que la tâche existe
 * 
 * @param taskId - UUID de la tâche
 * @throws ApplicationError si la tâche n'existe pas
 */
async function verifyTaskExists(taskId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: task, error } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .single();

  if (error || !task) {
    throw createError.notFound('Tâche introuvable');
  }
}

/**
 * Insère un nouveau commentaire en base de données
 */
async function insertComment(
  supabase: SupabaseServerClient,
  taskId: string,
  profileId: string,
  content: string,
  commentType: 'comment' | 'followup' = 'comment'
) {
  const { data: comment, error: insertError } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: profileId,
      content,
      origin: 'app',
      comment_type: commentType
    })
    .select('id, task_id, user_id, content, origin, comment_type, jira_comment_id, created_at')
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
    task_id: string;
    user_id: string | null;
    content: string;
    origin: 'app' | 'jira_comment' | null;
    comment_type: 'comment' | 'followup' | null;
    jira_comment_id: string | null;
    created_at: string;
  },
  profileId: string
): Promise<TaskComment> {
  const supabase = await createSupabaseServerClient();
  
  // Récupérer les données utilisateur
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
 * Crée un nouveau commentaire sur une tâche
 * 
 * @param taskId - UUID de la tâche
 * @param content - Contenu du commentaire
 * @param commentType - Type de commentaire ('comment' ou 'followup')
 * @returns Le commentaire créé
 * @throws ApplicationError si l'utilisateur n'est pas authentifié ou si la création échoue
 */
export async function createTaskComment(
  taskId: string,
  content: string,
  commentType: 'comment' | 'followup' = 'comment'
): Promise<TaskComment> {
  const { profileId } = await verifyUserAuthentication();
  await verifyTaskExists(taskId);

  const supabase = await createSupabaseServerClient();
  const comment = await insertComment(supabase, taskId, profileId, content, commentType);

  return buildCommentResponse(comment, profileId);
}

/**
 * Récupère tous les commentaires d'une tâche
 * 
 * @param taskId - UUID de la tâche
 * @returns Liste des commentaires
 */
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  await verifyUserAuthentication();
  await verifyTaskExists(taskId);

  const supabase = await createSupabaseServerClient();
  const { data: comments, error } = await supabase
    .from('task_comments')
    .select(`
      id,
      task_id,
      user_id,
      content,
      origin,
      comment_type,
      jira_comment_id,
      created_at,
      user:profiles!task_comments_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('task_id', taskId)
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
 * Supprime un commentaire d'une tâche
 * 
 * @param commentId - UUID du commentaire à supprimer
 * @throws ApplicationError si l'utilisateur n'est pas autorisé ou si la suppression échoue
 */
export async function deleteTaskComment(commentId: string): Promise<void> {
  const { profileId, role } = await verifyUserAuthentication();
  const supabase = await createSupabaseServerClient();

  // Charger le commentaire pour vérifier les permissions
  const { data: comment, error: loadError } = await supabase
    .from('task_comments')
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
    .from('task_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    throw createError.supabaseError(
      'Erreur lors de la suppression du commentaire',
      new Error(deleteError.message)
    );
  }
}

