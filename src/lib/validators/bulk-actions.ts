/**
 * Schémas Zod pour la validation des actions en masse sur les tickets
 */

import { z } from 'zod';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '@/lib/constants/tickets';

/**
 * Schéma pour la mise à jour en masse du statut
 */
export const bulkUpdateStatusSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1, 'Au moins un ticket doit être sélectionné'),
  status: z.enum(['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as [string, ...string[]])
});

/**
 * Schéma pour la mise à jour en masse de la priorité
 */
export const bulkUpdatePrioritySchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1, 'Au moins un ticket doit être sélectionné'),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low'] as [string, ...string[]])
});

/**
 * Schéma pour la réassignation en masse
 */
export const bulkReassignSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1, 'Au moins un ticket doit être sélectionné'),
  assignedTo: z.string().uuid().nullable()
});

/**
 * Types TypeScript dérivés des schémas
 */
export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;
export type BulkUpdatePriorityInput = z.infer<typeof bulkUpdatePrioritySchema>;
export type BulkReassignInput = z.infer<typeof bulkReassignSchema>;

