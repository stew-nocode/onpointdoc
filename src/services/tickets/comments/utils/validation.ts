import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';

/**
 * Vérifie qu'un ticket existe
 * 
 * @param ticketId - UUID du ticket à vérifier
 * @throws ApplicationError si le ticket n'existe pas
 */
export async function verifyTicketExists(ticketId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    throw createError.notFound('Ticket');
  }
}

/**
 * Vérifie qu'un commentaire existe et récupère ses informations
 * 
 * @param commentId - UUID du commentaire
 * @returns Informations du commentaire (user_id, origin)
 * @throws ApplicationError si le commentaire n'existe pas
 */
export async function loadCommentForDeletion(
  commentId: string
): Promise<{ user_id: string | null; origin: string | null }> {
  const supabase = await createSupabaseServerClient();

  const { data: comment, error: commentError } = await supabase
    .from('ticket_comments')
    .select('id, user_id, origin')
    .eq('id', commentId)
    .single();

  if (commentError || !comment) {
    throw createError.notFound('Commentaire');
  }

  return {
    user_id: comment.user_id,
    origin: comment.origin
  };
}

/**
 * Vérifie les permissions de suppression d'un commentaire
 * 
 * @param commentUserId - ID de l'utilisateur propriétaire du commentaire
 * @param currentProfileId - ID du profil de l'utilisateur actuel
 * @param currentUserRole - Rôle de l'utilisateur actuel
 * @param commentOrigin - Origine du commentaire (app/jira)
 * @throws ApplicationError si l'utilisateur n'a pas les permissions
 */
export function checkDeletePermissions(
  commentUserId: string | null,
  currentProfileId: string,
  currentUserRole: string | null,
  commentOrigin: string | null
): void {
  const isOwner = commentUserId === currentProfileId;
  const isAdmin = currentUserRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw createError.forbidden('Vous ne pouvez supprimer que vos propres commentaires');
  }

  if (commentOrigin === 'jira') {
    throw createError.forbidden('Les commentaires JIRA ne peuvent pas être supprimés');
  }
}

