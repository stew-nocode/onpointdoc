'use server';

import { revalidatePath } from 'next/cache';
import { createTicket, validateTicket, updateTicket } from '@/services/tickets';
import { createComment } from '@/services/tickets/comments/crud';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validators/ticket';

/**
 * Server Action pour créer un ticket
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (créer un ticket)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * 
 * @param values - Données du formulaire de création de ticket
 * @returns ID du ticket créé
 * @throws Error si la création échoue ou si aucun ID n'est retourné
 */
export async function createTicketAction(values: CreateTicketInput): Promise<string> {
  const created = await createTicket(values);
  
  if (!created?.id) {
    throw new Error('Aucun ID de ticket retourné après création');
  }
  
  // ✅ Revalider uniquement la page tickets
  // Note : Pas de revalidateTag() car on utilise noStore() pour les tickets
  // (les tickets dépendent de cookies() donc ne peuvent pas utiliser unstable_cache())
  revalidatePath('/gestion/tickets');
  
  return created.id as string;
}

/**
 * Server Action pour valider un ticket
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (valider un ticket)
 * - Utilise directement le service validateTicket
 * - Revalide uniquement la page nécessaire
 * 
 * @param ticketId - ID du ticket à valider
 * @throws Error si la validation échoue
 */
export async function validateTicketAction(ticketId: string): Promise<void> {
  await validateTicket(ticketId);
  
  // ✅ Revalider uniquement la page tickets
  revalidatePath('/gestion/tickets');
}

/**
 * Server Action pour ajouter un commentaire
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (ajouter un commentaire)
 * - Utilise directement le service createComment
 * - Revalide uniquement la page nécessaire
 * 
 * @param ticketId - ID du ticket
 * @param content - Contenu du commentaire
 * @returns ID du commentaire créé
 * @throws Error si la création échoue
 */
export async function addCommentAction(ticketId: string, content: string): Promise<string> {
  const comment = await createComment(ticketId, content);
  
  // ✅ Revalider les pages concernées
  revalidatePath('/gestion/tickets');
  revalidatePath(`/gestion/tickets/${ticketId}`);
  
  return comment.id;
}

/**
 * Server Action pour transférer un ticket vers JIRA
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (transférer un ticket)
 * - Utilise directement le service transferTicketToJira
 * - Revalide les pages concernées
 * 
 * @param ticketId - ID du ticket à transférer
 * @throws Error si le transfert échoue
 */
export async function transferTicketAction(ticketId: string): Promise<void> {
  const { transferTicketToJira } = await import('@/services/tickets/jira-transfer');
  await transferTicketToJira(ticketId);
  
  // ✅ Revalider la page de détail du ticket et la liste
  revalidatePath(`/gestion/tickets/${ticketId}`);
  revalidatePath('/gestion/tickets');
}

/**
 * Server Action pour mettre à jour un ticket
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (mettre à jour un ticket)
 * - Utilise directement le service updateTicket
 * - Revalide uniquement les pages concernées
 * - Remplace router.refresh() côté client
 * 
 * @param payload - Données de mise à jour du ticket (ID requis, autres champs optionnels)
 * @throws Error si la mise à jour échoue
 */
export async function updateTicketAction(payload: UpdateTicketInput): Promise<void> {
  await updateTicket(payload);
  
  // ✅ Revalider la page de détail du ticket et la liste
  revalidatePath(`/gestion/tickets/${payload.id}`);
  revalidatePath('/gestion/tickets');
}
