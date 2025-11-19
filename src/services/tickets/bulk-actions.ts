/**
 * Services pour les actions en masse sur les tickets
 * 
 * NOTE: Ce fichier est utilisé uniquement côté serveur (dans les routes API)
 * Les composants clients doivent utiliser les routes API au lieu d'importer ces fonctions
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TicketStatusFilter } from './index';
import type { BulkUpdateStatusInput, BulkUpdatePriorityInput, BulkReassignInput } from '@/lib/validators/bulk-actions';

/**
 * Met à jour le statut de plusieurs tickets en masse
 */
export async function bulkUpdateStatus(input: BulkUpdateStatusInput): Promise<{ updated: number; errors: string[] }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const errors: string[] = [];
  let updated = 0;

  // Mettre à jour les tickets par batch pour éviter les timeouts
  const batchSize = 50;
  for (let i = 0; i < input.ticketIds.length; i += batchSize) {
    const batch = input.ticketIds.slice(i, i + batchSize);
    
    // Récupérer les statuts actuels AVANT la mise à jour pour l'historique
    const { data: currentTickets } = await supabase
      .from('tickets')
      .select('id, status')
      .in('id', batch);

    const { error } = await supabase
      .from('tickets')
      .update({
        status: input.status,
        last_update_source: 'supabase'
      })
      .in('id', batch);

    if (error) {
      errors.push(`Erreur batch ${i / batchSize + 1}: ${error.message}`);
    } else {
      updated += batch.length;
      
      // Enregistrer dans l'historique pour chaque ticket
      if (currentTickets) {
        const historyEntries = currentTickets
          .filter(t => t.status !== input.status) // Ne pas créer d'historique si le statut est identique
          .map(ticket => ({
            ticket_id: ticket.id,
            status_from: ticket.status,
            status_to: input.status,
            source: 'supabase'
          }));

        if (historyEntries.length > 0) {
          await supabase.from('ticket_status_history').insert(historyEntries);
        }
      }
    }
  }

  return { updated, errors };
}

/**
 * Met à jour la priorité de plusieurs tickets en masse
 */
export async function bulkUpdatePriority(input: BulkUpdatePriorityInput): Promise<{ updated: number; errors: string[] }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const errors: string[] = [];
  let updated = 0;

  const batchSize = 50;
  for (let i = 0; i < input.ticketIds.length; i += batchSize) {
    const batch = input.ticketIds.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('tickets')
      .update({
        priority: input.priority,
        last_update_source: 'supabase'
      })
      .in('id', batch);

    if (error) {
      errors.push(`Erreur batch ${i / batchSize + 1}: ${error.message}`);
    } else {
      updated += batch.length;
    }
  }

  return { updated, errors };
}

/**
 * Réassigne plusieurs tickets en masse
 */
export async function bulkReassign(input: BulkReassignInput): Promise<{ updated: number; errors: string[] }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const errors: string[] = [];
  let updated = 0;

  const batchSize = 50;
  for (let i = 0; i < input.ticketIds.length; i += batchSize) {
    const batch = input.ticketIds.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('tickets')
      .update({
        assigned_to: input.assignedTo,
        last_update_source: 'supabase'
      })
      .in('id', batch);

    if (error) {
      errors.push(`Erreur batch ${i / batchSize + 1}: ${error.message}`);
    } else {
      updated += batch.length;
    }
  }

  return { updated, errors };
}

