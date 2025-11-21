import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  BulkUpdateStatusInput,
  BulkReassignInput,
  BulkUpdatePriorityInput
} from '@/lib/validators/bulk-actions';

/**
 * Résultat d'une action en masse
 */
export type BulkActionResult = {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors?: string[];
};

/**
 * Met à jour le statut de plusieurs tickets en masse
 * Vérifie que tous les tickets sont de type ASSISTANCE et non transférés
 * 
 * @param payload - IDs des tickets et nouveau statut
 * @returns Résultat de l'opération
 */
export const bulkUpdateStatus = async (
  payload: BulkUpdateStatusInput
): Promise<BulkActionResult> => {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Vérifier que tous les tickets sont de type ASSISTANCE et non transférés
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('id, ticket_type, status')
    .in('id', payload.ticketIds);

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération des tickets: ${fetchError.message}`);
  }

  if (!tickets || tickets.length === 0) {
    throw new Error('Aucun ticket trouvé');
  }

  // Filtrer les tickets valides (ASSISTANCE non transférés)
  const validTickets = tickets.filter(
    (ticket) => ticket.ticket_type === 'ASSISTANCE' && ticket.status !== 'Transfere'
  );

  if (validTickets.length === 0) {
    throw new Error('Aucun ticket ASSISTANCE non transféré trouvé parmi la sélection');
  }

  const validTicketIds = validTickets.map((t) => t.id);

  // Mettre à jour le statut
  const { data: updatedTickets, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: payload.status,
      last_update_source: 'supabase'
    })
    .in('id', validTicketIds)
    .select('id, status');

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
  }

  // Enregistrer l'historique des changements de statut
  if (updatedTickets && updatedTickets.length > 0) {
    const historyEntries = validTickets
      .map((ticket) => ({
        ticket_id: ticket.id,
        status_from: ticket.status,
        status_to: payload.status,
        source: 'supabase'
      }))
      .filter((entry) => entry.status_from !== entry.status_to);

    if (historyEntries.length > 0) {
      await supabase.from('ticket_status_history').insert(historyEntries);
    }
  }

  const updatedCount = updatedTickets?.length || 0;
  const failedCount = payload.ticketIds.length - updatedCount;

  return {
    success: true,
    updatedCount,
    failedCount,
    errors: failedCount > 0 ? [`${failedCount} ticket(s) n'ont pas pu être mis à jour`] : undefined
  };
};

/**
 * Réassigne plusieurs tickets en masse
 * 
 * @param payload - IDs des tickets et nouvel assigné (peut être null)
 * @returns Résultat de l'opération
 */
export const bulkReassign = async (payload: BulkReassignInput): Promise<BulkActionResult> => {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Vérifier que l'utilisateur assigné existe (si fourni)
  if (payload.assignedTo !== null) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', payload.assignedTo)
      .single();

    if (profileError || !profile) {
      throw new Error(`Utilisateur introuvable: ${profileError?.message ?? 'Utilisateur introuvable'}`);
    }
  }

  // Mettre à jour l'assignation
  const { data: updatedTickets, error: updateError } = await supabase
    .from('tickets')
    .update({
      assigned_to: payload.assignedTo,
      last_update_source: 'supabase'
    })
    .in('id', payload.ticketIds)
    .select('id');

  if (updateError) {
    throw new Error(`Erreur lors de la réassignation: ${updateError.message}`);
  }

  const updatedCount = updatedTickets?.length || 0;
  const failedCount = payload.ticketIds.length - updatedCount;

  return {
    success: true,
    updatedCount,
    failedCount,
    errors: failedCount > 0 ? [`${failedCount} ticket(s) n'ont pas pu être réassignés`] : undefined
  };
};

/**
 * Met à jour la priorité de plusieurs tickets en masse
 * 
 * @param payload - IDs des tickets et nouvelle priorité
 * @returns Résultat de l'opération
 */
export const bulkUpdatePriority = async (
  payload: BulkUpdatePriorityInput
): Promise<BulkActionResult> => {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Mettre à jour la priorité
  const { data: updatedTickets, error: updateError } = await supabase
    .from('tickets')
    .update({
      priority: payload.priority,
      last_update_source: 'supabase'
    })
    .in('id', payload.ticketIds)
    .select('id');

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour de la priorité: ${updateError.message}`);
  }

  const updatedCount = updatedTickets?.length || 0;
  const failedCount = payload.ticketIds.length - updatedCount;

  return {
    success: true,
    updatedCount,
    failedCount,
    errors: failedCount > 0 ? [`${failedCount} ticket(s) n'ont pas pu être mis à jour`] : undefined
  };
};

