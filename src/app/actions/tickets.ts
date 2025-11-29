'use server';

/**
 * Server Actions pour les tickets
 * 
 * Utilise les meilleures pratiques Next.js 16 :
 * - Type safety end-to-end
 * - Validation Zod intégrée
 * - Gestion d'erreur centralisée
 * - Progressive Enhancement
 * 
 * @module actions/tickets
 */

import { z } from 'zod';
import { listTicketsPaginated } from '@/services/tickets';
import { ticketsListParamsSchema } from '@/lib/validators/api-params';
import { parseAdvancedFiltersFromParams } from '@/lib/validators/advanced-filters';
import { handleServerActionError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import type { TicketsPaginatedResult } from '@/types/ticket-with-relations';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';
import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';

/**
 * Schéma de validation pour les paramètres de la Server Action
 * Plus strict que l'API route car on peut valider directement les types
 */
const listTicketsActionSchema = ticketsListParamsSchema.extend({
  // Paramètres de filtres avancés (optionnels, seront parsés séparément)
  types: z.array(z.enum(['BUG', 'REQ', 'ASSISTANCE'])).optional(),
  statuses: z.array(z.string()).optional(),
  priorities: z.array(z.enum(['Low', 'Medium', 'High', 'Critical'])).optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  products: z.array(z.string().uuid()).optional(),
  modules: z.array(z.string().uuid()).optional(),
  channels: z.array(z.string()).optional(),
  origins: z.array(z.string()).optional(),
  hasJiraSync: z.boolean().optional(),
  createdAtPreset: z.string().optional(),
  createdAtStart: z.string().optional(),
  createdAtEnd: z.string().optional(),
  resolvedAtPreset: z.string().optional(),
  resolvedAtStart: z.string().optional(),
  resolvedAtEnd: z.string().optional()
});

export type ListTicketsActionInput = z.infer<typeof listTicketsActionSchema>;

/**
 * Type de retour pour la Server Action
 * Utilise un Result pattern pour une meilleure gestion d'erreur
 */
export type ListTicketsActionResult =
  | { success: true; data: TicketsPaginatedResult }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Server Action pour lister les tickets avec pagination et filtres
 * 
 * Remplace l'API route `/api/tickets/list` avec les avantages suivants :
 * - Pas de sérialisation HTTP (meilleure performance)
 * - Type safety end-to-end
 * - Validation Zod intégrée
 * - Gestion d'erreur simplifiée
 * 
 * @param input - Paramètres de recherche et filtres
 * @returns Résultat paginé des tickets ou erreur
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { listTicketsAction } from '@/app/actions/tickets';
 * 
 * const result = await listTicketsAction({
 *   offset: 0,
 *   limit: 25,
 *   type: 'BUG',
 *   sortColumn: 'created_at',
 *   sortDirection: 'desc'
 * });
 * 
 * if (result.success) {
 *   console.log(result.data.tickets);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function listTicketsAction(
  input: ListTicketsActionInput
): Promise<ListTicketsActionResult> {
  try {
    // Validation des paramètres avec Zod
    const validationResult = listTicketsActionSchema.safeParse(input);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Paramètres invalides',
          details: validationResult.error.issues
        }
      };
    }

    const params = validationResult.data;

    // Extraire les paramètres de base
    const type = params.type;
    const status = params.status;
    const search = params.search;
    const quickFilter = params.quick as QuickFilter | undefined;
    const currentProfileId = params.currentProfileId || null;
    const offset = params.offset;
    const limit = params.limit;
    const sortColumn = params.sortColumn as TicketSortColumn | undefined;
    const sortDirection = params.sortDirection as SortDirection | undefined;

    // Parser les filtres avancés depuis les paramètres
    // Construire un Record compatible avec parseAdvancedFiltersFromParams
    const advancedFiltersParams: Record<string, string | string[] | undefined> = {};
    
    if (params.types) advancedFiltersParams.types = params.types;
    if (params.statuses) advancedFiltersParams.statuses = params.statuses;
    if (params.priorities) advancedFiltersParams.priorities = params.priorities;
    if (params.assignedTo) advancedFiltersParams.assignedTo = params.assignedTo;
    if (params.products) advancedFiltersParams.products = params.products;
    if (params.modules) advancedFiltersParams.modules = params.modules;
    if (params.channels) advancedFiltersParams.channels = params.channels;
    if (params.origins) advancedFiltersParams.origins = params.origins;
    if (params.hasJiraSync !== undefined) {
      advancedFiltersParams.hasJiraSync = params.hasJiraSync ? 'true' : 'false';
    }
    if (params.createdAtPreset) advancedFiltersParams.createdAtPreset = params.createdAtPreset;
    if (params.createdAtStart) advancedFiltersParams.createdAtStart = params.createdAtStart;
    if (params.createdAtEnd) advancedFiltersParams.createdAtEnd = params.createdAtEnd;
    if (params.resolvedAtPreset) advancedFiltersParams.resolvedAtPreset = params.resolvedAtPreset;
    if (params.resolvedAtStart) advancedFiltersParams.resolvedAtStart = params.resolvedAtStart;
    if (params.resolvedAtEnd) advancedFiltersParams.resolvedAtEnd = params.resolvedAtEnd;

    const advancedFilters: AdvancedFiltersInput | null = parseAdvancedFiltersFromParams(advancedFiltersParams);

    // Appeler le service existant (réutilisation de la logique métier)
    const result = await listTicketsPaginated(
      type,
      status,
      offset,
      limit,
      search || undefined,
      quickFilter,
      currentProfileId,
      sortColumn,
      sortDirection,
      advancedFilters || undefined
    );

    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    // Utiliser la gestion d'erreur centralisée
    const errorResult = handleServerActionError(error);
    
    return {
      success: false,
      error: {
        code: errorResult.error.code,
        message: errorResult.error.message,
        details: errorResult.error.details
      }
    };
  }
}

