/**
 * Utilitaires pour construire les paramètres de filtrage
 * 
 * Extraits du composant TicketsInfiniteScroll pour respecter Clean Code :
 * - Fonctions courtes et focalisées
 * - Pas de duplication
 * - Types explicites
 */

import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';

/**
 * Clés des filtres avancés utilisées dans l'URL
 */
const ADVANCED_FILTER_KEYS = [
  'types',
  'statuses',
  'priorities',
  'assignedTo',
  'products',
  'modules',
  'channels',
  'createdAtPreset',
  'createdAtStart',
  'createdAtEnd',
  'resolvedAtPreset',
  'resolvedAtStart',
  'resolvedAtEnd',
  'origins',
  'hasJiraSync',
] as const;

/**
 * Construit les paramètres de base pour la requête de tickets
 */
export function buildBaseParams(
  offset: number,
  limit: number,
  sortColumn: TicketSortColumn,
  sortDirection: SortDirection
): URLSearchParams {
  return new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
    sortColumn,
    sortDirection,
  });
}

/**
 * Ajoute les filtres simples aux paramètres
 */
export function addSimpleFilters(
  params: URLSearchParams,
  type?: string,
  status?: string,
  search?: string,
  quickFilter?: QuickFilter,
  currentProfileId?: string
): void {
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  if (quickFilter) params.set('quick', quickFilter);
  if (currentProfileId) params.set('currentProfileId', currentProfileId);
}

/**
 * Ajoute les filtres avancés depuis les searchParams aux paramètres
 */
export function addAdvancedFilters(
  params: URLSearchParams,
  searchParams: URLSearchParams
): void {
  ADVANCED_FILTER_KEYS.forEach((key) => {
    const values = searchParams.getAll(key);
    values.forEach((value) => params.append(key, value));
  });
}

/**
 * Construit les paramètres complets pour charger les tickets
 */
export function buildTicketListParams(
  offset: number,
  limit: number,
  sortColumn: TicketSortColumn,
  sortDirection: SortDirection,
  type: string | undefined,
  status: string | undefined,
  search: string | undefined,
  quickFilter: QuickFilter | undefined,
  currentProfileId: string | undefined,
  searchParams: URLSearchParams
): URLSearchParams {
  const params = buildBaseParams(offset, limit, sortColumn, sortDirection);
  addSimpleFilters(params, type, status, search, quickFilter, currentProfileId);
  addAdvancedFilters(params, searchParams);
  return params;
}

