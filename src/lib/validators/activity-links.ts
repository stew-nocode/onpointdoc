/**
 * Validators pour la recherche d'entités liables aux activités
 */

import { z } from 'zod';

/**
 * Types d'entités pouvant être liées
 */
export const linkableEntityTypes = ['task', 'bug', 'assistance', 'request', 'followup', 'activity'] as const;

/**
 * Schéma de validation pour la recherche d'entités liables
 */
export const searchLinkableEntitiesSchema = z.object({
  entityType: z.enum(linkableEntityTypes, {
    errorMap: () => ({ message: 'Type d\'entité invalide' })
  }),
  searchKey: z.string().min(2, 'La recherche doit contenir au moins 2 caractères').max(200, 'La recherche ne peut pas dépasser 200 caractères'),
  limit: z.number().int().min(1).max(20).optional().default(10)
});

export type SearchLinkableEntitiesInput = z.infer<typeof searchLinkableEntitiesSchema>;
