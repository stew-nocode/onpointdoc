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
 * @param commentType - Type de commentaire ('comment' ou 'followup')
 * @returns Données brutes du commentaire créé
 * @throws ApplicationError si l'insertion échoue
 */
async function insertComment(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string,
  profileId: string,
  content: string,
  commentType: 'comment' | 'followup' = 'comment'
) {
  const { data: comment, error: insertError } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      user_id: profileId,
      content,
      origin: 'app',
      comment_type: commentType
    })
    .select('id, ticket_id, user_id, content, origin, comment_type, created_at')
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
 * Si le ticket est lié à JIRA (a une jira_issue_key), le commentaire
 * est également créé dans JIRA pour maintenir la synchronisation bidirectionnelle.
 * 
 * @param ticketId - UUID du ticket
 * @param content - Contenu du commentaire
 * @param commentType - Type de commentaire ('comment' ou 'followup'), défaut: 'comment'
 * @returns Le commentaire créé
 * @throws ApplicationError si l'utilisateur n'est pas authentifié ou si la création échoue
 */
export async function createComment(
  ticketId: string,
  content: string,
  commentType: 'comment' | 'followup' = 'comment'
): Promise<TicketComment> {
  const { profileId } = await verifyUserAuthentication();
  await verifyTicketExists(ticketId);

  const supabase = await createSupabaseServerClient();
  
  // Vérifier si le ticket est lié à JIRA
  const { data: ticket } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .eq('id', ticketId)
    .single();

  // Créer le commentaire dans Supabase
  const comment = await insertComment(supabase, ticketId, profileId, content, commentType);

  // Si le ticket est lié à JIRA, créer aussi le commentaire dans JIRA
  if (ticket?.jira_issue_key) {
    try {
      const { createJiraComment } = await import('@/services/jira/comments/create');
      await createJiraComment(ticket.jira_issue_key, content, comment.id);
    } catch (jiraError) {
      // Ne pas faire échouer la création Supabase si JIRA échoue
      // Le commentaire a été créé avec succès dans Supabase
      // Logger l'erreur pour diagnostic
      console.error(
        `Erreur lors de la création du commentaire JIRA pour le ticket ${ticketId}:`,
        jiraError
      );
    }
  }

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

