import { loadProfilesByIds } from './load-profiles';
import type { TicketInteraction, TicketComment, TicketStatusHistory } from '../comments';

/**
 * Construit une interaction de création à partir des données du ticket
 * 
 * @param ticketId - UUID du ticket
 * @param ticketCreatedAt - Date de création
 * @param ticketCreatedBy - ID du créateur
 * @returns Interaction de création ou null
 */
export async function buildCreationInteraction(
  ticketId: string,
  ticketCreatedAt: string,
  ticketCreatedBy?: string | null
): Promise<TicketInteraction | null> {
  if (!ticketCreatedBy) {
    return null;
  }

  const profilesMap = await loadProfilesByIds([ticketCreatedBy]);
  const creator = profilesMap.get(ticketCreatedBy);

  return {
    id: `creation-${ticketId}`,
    type: 'creation',
    timestamp: ticketCreatedAt,
    user: creator || undefined
  };
}

/**
 * Transforme un commentaire en interaction
 * 
 * @param comment - Commentaire à transformer
 * @returns Interaction de type comment
 */
export function buildCommentInteraction(comment: TicketComment): TicketInteraction {
  return {
    id: `comment-${comment.id}`,
    type: 'comment',
    timestamp: comment.created_at,
    user: comment.user,
    content: comment.content,
    origin: comment.origin || undefined
  };
}

/**
 * Transforme un historique de statut en interaction
 * 
 * @param history - Historique de statut à transformer
 * @returns Interaction de type status_change
 */
export function buildStatusChangeInteraction(history: TicketStatusHistory): TicketInteraction {
  return {
    id: `status-${history.id}`,
    type: 'status_change',
    timestamp: history.changed_at,
    user: history.changed_by_user,
    status_from: history.status_from,
    status_to: history.status_to || null,
    origin: history.source === 'jira' ? 'jira' : 'app'
  };
}

/**
 * Trie les interactions par date croissante
 * 
 * @param interactions - Liste des interactions à trier
 * @returns Interactions triées par date
 */
export function sortInteractionsByDate(interactions: TicketInteraction[]): TicketInteraction[] {
  return interactions.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

