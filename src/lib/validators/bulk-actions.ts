import { z } from 'zod';
import { ticketPriorities } from './ticket';
import { ASSISTANCE_LOCAL_STATUSES } from '@/lib/constants/tickets';

/**
 * Schéma pour les actions en masse sur les tickets
 */
export const bulkActionBaseSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1, 'Au moins un ticket doit être sélectionné')
});

/**
 * Schéma pour changer le statut en masse
 */
export const bulkUpdateStatusSchema = bulkActionBaseSchema.extend({
  status: z.enum(ASSISTANCE_LOCAL_STATUSES, {
    message: 'Statut invalide'
  })
});

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;

/**
 * Schéma pour réassigner en masse
 */
export const bulkReassignSchema = bulkActionBaseSchema.extend({
  assignedTo: z.string().uuid('ID utilisateur invalide').nullable()
});

export type BulkReassignInput = z.infer<typeof bulkReassignSchema>;

/**
 * Schéma pour changer la priorité en masse
 */
export const bulkUpdatePrioritySchema = bulkActionBaseSchema.extend({
  priority: z.enum(ticketPriorities, {
    message: 'Priorité invalide'
  })
});

export type BulkUpdatePriorityInput = z.infer<typeof bulkUpdatePrioritySchema>;

/**
 * Schéma pour l'export en masse
 */
export const bulkExportSchema = bulkActionBaseSchema.extend({
  format: z.enum(['csv', 'excel']).default('csv')
});

export type BulkExportInput = z.infer<typeof bulkExportSchema>;
