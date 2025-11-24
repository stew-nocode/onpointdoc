/**
 * Utilitaires pour mettre à jour l'état des tickets
 * 
 * Extraits du composant TicketsInfiniteScroll pour respecter Clean Code
 */

import type { TicketWithRelations } from '@/types/ticket-with-relations';

/**
 * Filtre les doublons et ajoute les nouveaux tickets à la liste existante
 * 
 * @param existingTickets - Liste actuelle des tickets
 * @param newTickets - Nouveaux tickets à ajouter
 * @returns Liste mise à jour sans doublons
 */
export function mergeTicketsWithoutDuplicates(
  existingTickets: TicketWithRelations[],
  newTickets: TicketWithRelations[]
): TicketWithRelations[] {
  const existingIds = new Set(existingTickets.map((t) => t.id));
  const uniqueNewTickets = newTickets.filter((t) => !existingIds.has(t.id));
  return [...existingTickets, ...uniqueNewTickets];
}

/**
 * Vérifie si deux ensembles d'IDs de tickets sont identiques
 */
export function areTicketIdsEqual(
  ids1: Set<string>,
  ids2: Set<string>
): boolean {
  if (ids1.size !== ids2.size) return false;
  return Array.from(ids1).every((id) => ids2.has(id));
}

