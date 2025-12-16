'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createTicket, validateTicket, updateTicket } from '@/services/tickets';
import { getTicketById } from '@/services/tickets/jira-transfer';
import { createComment } from '@/services/tickets/comments/crud';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validators/ticket';
import { onTicketCreated, onTicketStatusChanged } from '@/services/support';

/**
 * Server Action pour créer un ticket
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (créer un ticket)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * - Déclenche les notifications email (non-bloquant)
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
  
  // 📧 Notification email (non-bloquante)
  // Récupère le ticket complet pour les infos de notification
  getTicketById(created.id as string)
    .then(ticket => {
      if (ticket) {
        onTicketCreated({ ticket }).catch(console.error);
      }
    })
    .catch(console.error);
  
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
 * @param commentType - Type de commentaire ('comment' ou 'followup'), défaut: 'comment'
 * @returns ID du commentaire créé
 * @throws Error si la création échoue
 */
export async function addCommentAction(
  ticketId: string, 
  content: string, 
  commentType: 'comment' | 'followup' = 'comment'
): Promise<string> {
  const comment = await createComment(ticketId, content, commentType);
  
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
 * - Déclenche les notifications email si changement de statut
 * 
 * @param payload - Données de mise à jour du ticket (ID requis, autres champs optionnels)
 * @throws Error si la mise à jour échoue
 */
export async function updateTicketAction(payload: UpdateTicketInput): Promise<void> {
  // Récupérer le statut actuel avant mise à jour (pour détecter les changements)
  let previousStatus: string | undefined;
  if (payload.status) {
    const supabase = await createSupabaseServerClient();
    const { data: current } = await supabase
      .from('tickets')
      .select('status')
      .eq('id', payload.id)
      .single();
    previousStatus = current?.status;
  }

  await updateTicket(payload);

  // ✅ Revalider la page de détail du ticket et la liste
  revalidatePath(`/gestion/tickets/${payload.id}`);
  revalidatePath('/gestion/tickets');

  // 📧 Notification email si changement de statut (non-bloquante)
  if (payload.status && previousStatus && previousStatus !== payload.status) {
    getTicketById(payload.id)
      .then(ticket => {
        if (ticket) {
          onTicketStatusChanged(ticket, previousStatus!, payload.status!).catch(console.error);
        }
      })
      .catch(console.error);
  }
}

/**
 * Server Action pour dupliquer un ticket
 *
 * Crée une copie du ticket avec "(Copie)" ajouté au titre
 * Préserve tous les champs sauf l'ID et les timestamps
 *
 * @param ticketId - ID du ticket à dupliquer
 * @returns ID du ticket dupliqué
 * @throws Error si la duplication échoue
 */
export async function duplicateTicketAction(ticketId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();

  // Récupérer le ticket source
  const { data: sourceTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (fetchError || !sourceTicket) {
    throw new Error(`Ticket introuvable: ${fetchError?.message ?? 'Ticket non trouvé'}`);
  }

  // Récupérer le profil de l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_uid', user.id)
    .single();

  if (!profile) throw new Error('Profil utilisateur introuvable');

  // Créer le ticket dupliqué
  const { data: newTicket, error: createError } = await supabase
    .from('tickets')
    .insert({
      title: `${sourceTicket.title} (Copie)`,
      description: sourceTicket.description,
      ticket_type: sourceTicket.ticket_type,
      status: sourceTicket.status,
      priority: sourceTicket.priority,
      canal: sourceTicket.canal,
      product_id: sourceTicket.product_id,
      module_id: sourceTicket.module_id,
      submodule_id: sourceTicket.submodule_id,
      feature_id: sourceTicket.feature_id,
      customer_context: sourceTicket.customer_context,
      contact_user_id: sourceTicket.contact_user_id,
      company_id: sourceTicket.company_id,
      bug_type: sourceTicket.bug_type,
      created_by: profile.id,
      origin: 'supabase',
      // Ne PAS copier: jira_issue_key, jira_issue_id, validated_by_manager
    })
    .select('id')
    .single();

  if (createError || !newTicket) {
    throw new Error(`Erreur lors de la duplication: ${createError?.message ?? 'Erreur inconnue'}`);
  }

  // Revalider les pages
  revalidatePath('/gestion/tickets');
  revalidatePath(`/gestion/tickets/${newTicket.id}`);

  return newTicket.id;
}

/**
 * Server Action pour archiver un ticket
 *
 * NOTE: Currently uses status change to 'Archive' (no dedicated archived column in schema)
 * Future: Add dedicated 'archived' boolean column to tickets table
 *
 * @param ticketId - ID du ticket à archiver
 * @throws Error si l'archivage échoue
 */
export async function archiveTicketAction(ticketId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Mettre à jour le statut du ticket vers "Archive"
  // TODO: Ajouter une colonne 'archived' boolean dans le futur
  const { error } = await supabase
    .from('tickets')
    .update({ status: 'Archive' })
    .eq('id', ticketId);

  if (error) {
    throw new Error(`Erreur lors de l'archivage: ${error.message}`);
  }

  // Revalider les pages
  revalidatePath('/gestion/tickets');
  revalidatePath(`/gestion/tickets/${ticketId}`);
}
