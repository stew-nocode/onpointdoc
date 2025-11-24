/**
 * Utilitaires pour réinitialiser les tickets
 * 
 * Fonction extraite pour respecter Clean Code (SRP)
 */

import type { TicketWithRelations } from '@/types/ticket-with-relations';

/**
 * Compare deux listes de tickets par leurs IDs uniquement
 * 
 * @param tickets1 - Première liste de tickets
 * @param tickets2 - Deuxième liste de tickets
 * @returns true si les IDs sont identiques, false sinon
 */
export function areTicketIdsEqual(
  tickets1: TicketWithRelations[],
  tickets2: TicketWithRelations[]
): boolean {
  if (tickets1.length !== tickets2.length) {
    return false;
  }

  const ids1 = new Set(tickets1.map((t) => t.id));
  const ids2 = new Set(tickets2.map((t) => t.id));

  if (ids1.size !== ids2.size) {
    return false;
  }

  for (const id of ids1) {
    if (!ids2.has(id)) {
      return false;
    }
  }

  return true;
}

