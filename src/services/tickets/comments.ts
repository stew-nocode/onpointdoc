import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loadProfilesByIds } from './utils/load-profiles';
import {
  buildCreationInteraction,
  buildCommentInteraction,
  buildStatusChangeInteraction,
  sortInteractionsByDate
} from './utils/build-interactions';

/**
 * Type pour une pièce jointe de commentaire
 */
export type CommentAttachment = {
  id: string;
  comment_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_kb: number | null;
  stored_at: string;
};

/**
 * Type pour un commentaire de ticket
 */
export type TicketComment = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  content: string;
  origin: 'app' | 'jira' | null;
  comment_type?: 'comment' | 'followup';
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  attachments?: CommentAttachment[];
};

/**
 * Type pour un historique de statut
 */
export type TicketStatusHistory = {
  id: string;
  ticket_id: string;
  status_from: string | null;
  status_to: string;
  changed_by: string | null;
  source: 'supabase' | 'jira';
  changed_at: string;
  changed_by_user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
};

/**
 * Type pour une interaction dans la timeline
 */
export type TicketInteraction = {
  id: string;
  type: 'comment' | 'status_change' | 'creation';
  timestamp: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  content?: string;
  status_from?: string | null;
  status_to?: string | null;
  origin?: 'app' | 'jira';
};

/**
 * Charge les commentaires d'un ticket avec les informations des utilisateurs et leurs pièces jointes
 * 
 * @param ticketId - UUID du ticket
 * @returns Liste des commentaires avec les informations des utilisateurs et leurs pièces jointes
 */
export async function loadTicketComments(ticketId: string): Promise<TicketComment[]> {
  const supabase = await createSupabaseServerClient();

  const { data: comments, error: commentsError } = await supabase
    .from('ticket_comments')
    .select('id, ticket_id, user_id, content, origin, comment_type, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (commentsError) {
    return [];
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  // Charger les profils des utilisateurs
  const userIds = comments
    .map((c) => c.user_id)
    .filter((id): id is string => id !== null);
  
  const profilesMap = await loadProfilesByIds(userIds);

  // Charger les pièces jointes pour tous les commentaires
  const { loadCommentAttachmentsBatch } = await import('./comments/attachments/crud');
  const commentIds = comments.map((c) => c.id);
  const attachmentsMap = await loadCommentAttachmentsBatch(commentIds);

  return comments.map((comment) => ({
    id: comment.id,
    ticket_id: comment.ticket_id,
    user_id: comment.user_id,
    content: comment.content,
    origin: comment.origin as 'app' | 'jira' | null,
    comment_type: (comment.comment_type as 'comment' | 'followup' | undefined) || 'comment',
    created_at: comment.created_at,
    user: comment.user_id ? profilesMap.get(comment.user_id) : undefined,
    attachments: attachmentsMap.get(comment.id) || []
  }));
}

/**
 * Charge l'historique des statuts d'un ticket avec les informations des utilisateurs
 * 
 * @param ticketId - UUID du ticket
 * @returns Liste des changements de statut avec les informations des utilisateurs
 */
export async function loadTicketStatusHistory(
  ticketId: string
): Promise<TicketStatusHistory[]> {
  const supabase = await createSupabaseServerClient();

  const { data: history, error: historyError } = await supabase
    .from('ticket_status_history')
    .select('id, ticket_id, status_from, status_to, changed_by, source, changed_at')
    .eq('ticket_id', ticketId)
    .order('changed_at', { ascending: true });

  if (historyError) {
    console.error('Erreur lors du chargement de l\'historique des statuts:', historyError);
    return [];
  }

  if (!history || history.length === 0) {
    return [];
  }

  // Charger les profils des utilisateurs
  const userIds = history
    .map((h) => h.changed_by)
    .filter((id): id is string => id !== null);
  
  const profilesMap = await loadProfilesByIds(userIds);

  return history.map((h) => ({
    id: h.id,
    ticket_id: h.ticket_id,
    status_from: h.status_from,
    status_to: h.status_to,
    changed_by: h.changed_by,
    source: h.source as 'supabase' | 'jira',
    changed_at: h.changed_at,
    changed_by_user: h.changed_by ? profilesMap.get(h.changed_by) : undefined
  }));
}

/**
 * Charge toutes les interactions d'un ticket (commentaires + historique des statuts + création)
 * et les combine en une timeline chronologique
 * 
 * @param ticketId - UUID du ticket
 * @param ticketCreatedAt - Date de création du ticket
 * @param ticketCreatedBy - ID du créateur du ticket
 * @returns Liste des interactions triées par date
 */
export async function loadTicketInteractions(
  ticketId: string,
  ticketCreatedAt: string,
  ticketCreatedBy?: string | null
): Promise<TicketInteraction[]> {
  const [comments, statusHistory, creationInteraction] = await Promise.all([
    loadTicketComments(ticketId),
    loadTicketStatusHistory(ticketId),
    buildCreationInteraction(ticketId, ticketCreatedAt, ticketCreatedBy)
  ]);

  const interactions: TicketInteraction[] = [];

  if (creationInteraction) {
    interactions.push(creationInteraction);
  }

  comments.forEach((comment) => {
    interactions.push(buildCommentInteraction(comment));
  });

  statusHistory.forEach((history) => {
    interactions.push(buildStatusChangeInteraction(history));
  });

  return sortInteractionsByDate(interactions);
}

