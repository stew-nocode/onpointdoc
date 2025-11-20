/**
 * Schémas de validation Zod pour les paramètres d'API routes
 */

import { z } from 'zod';

/**
 * Schéma de validation pour les paramètres de recherche de tickets
 */
export const ticketsListParamsSchema = z.object({
  type: z.enum(['BUG', 'REQ', 'ASSISTANCE']).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  quick: z.enum(['mine', 'unassigned', 'overdue', 'to_validate', 'week', 'month']).optional(),
  currentProfileId: z.string().uuid().optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export type TicketsListParams = z.infer<typeof ticketsListParamsSchema>;

