import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import type { TicketComment } from '../comments';
import { verifyUserAuthentication, verifyUserAuthenticationWithRole } from './utils/auth';
import { verifyTicketExists, loadCommentForDeletion, checkDeletePermissions } from './utils/validation';
import { buildCommentResponse } from './utils/build-response';

/**
 * Insère un nouveau commentaire en base de données
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @param profileId - ID du profil utilisateur
 * @param content - Contenu du commentaire
 * @returns Données brutes du commentaire créé
 * @throws ApplicationError si l'insertion échoue
 */
async function insertComment(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string,
  profileId: string,
  content: string
) {
  const { data: comment, error: insertError } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      user_id: profileId,
      content,
      origin: 'app'
    })
    .select('id, ticket_id, user_id, content, origin, created_at')
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
 * Crée un nouveau commentaire sur un ticket
 * 
 * @param ticketId - UUID du ticket
 * @param content - Contenu du commentaire
 * @returns Le commentaire créé
 * @throws ApplicationError si l'utilisateur n'est pas authentifié ou si la création échoue
 */
export async function createComment(
  ticketId: string,
  content: string
): Promise<TicketComment> {
  const { profileId } = await verifyUserAuthentication();
  await verifyTicketExists(ticketId);

  const supabase = await createSupabaseServerClient();
  const comment = await insertComment(supabase, ticketId, profileId, content);

  return buildCommentResponse(comment, profileId);
}

/**
 * Supprime physiquement un commentaire de la base de données
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire à supprimer
 * @throws ApplicationError si la suppression échoue
 */
async function performCommentDeletion(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  commentId: string
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('ticket_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    throw createError.supabaseError(
      'Erreur lors de la suppression du commentaire',
      new Error(deleteError.message)
    );
  }
}

/**
 * Supprime un commentaire d'un ticket
 * 
 * @param commentId - UUID du commentaire à supprimer
 * @throws ApplicationError si l'utilisateur n'est pas autorisé ou si la suppression échoue
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { profileId, role } = await verifyUserAuthenticationWithRole();
  const comment = await loadCommentForDeletion(commentId);

  checkDeletePermissions(comment.user_id, profileId, role, comment.origin);

  const supabase = await createSupabaseServerClient();
  await performCommentDeletion(supabase, commentId);
}

