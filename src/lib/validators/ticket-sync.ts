/**
 * Schémas de validation Zod pour la synchronisation de tickets
 */

import { z } from 'zod';

/**
 * Schéma pour synchroniser un ticket depuis JIRA
 */
export const ticketSyncJiraParamsSchema = z.object({
  id: z.string().uuid()
});

export type TicketSyncJiraParams = z.infer<typeof ticketSyncJiraParamsSchema>;

