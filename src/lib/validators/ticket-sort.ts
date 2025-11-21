import { z } from 'zod';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';

/**
 * Schéma Zod pour valider une colonne de tri
 */
export const ticketSortColumnSchema = z.enum(
  ['title', 'created_at', 'priority', 'status', 'assigned_to'],
  {
    message: 'Colonne de tri invalide'
  }
);

/**
 * Schéma Zod pour valider une direction de tri
 */
export const sortDirectionSchema = z.enum(['asc', 'desc'], {
  message: 'Direction de tri invalide'
});

/**
 * Schéma Zod pour valider les paramètres de tri dans l'URL
 */
export const ticketSortParamsSchema = z.object({
  sortColumn: ticketSortColumnSchema.optional(),
  sortDirection: sortDirectionSchema.optional()
});

export type TicketSortParams = z.infer<typeof ticketSortParamsSchema>;

