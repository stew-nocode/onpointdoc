/**
 * Utilitaires pour les Server Actions de tickets
 *
 * Fonctions helper pour convertir les paramètres URL en input de Server Action
 */

import type { ListTicketsActionInput } from '../tickets';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';

/**
 * Convertit les URLSearchParams en input pour listTicketsAction
 * 
 * @param searchParams - Paramètres de l'URL
 * @param offset - Offset de pagination
 * @param limit - Nombre d'éléments par page
 * @param sortColumn - Colonne de tri
 * @param sortDirection - Direction de tri
 * @param type - Type de ticket (optionnel)
 * @param status - Statut de ticket (optionnel)
 * @param search - Recherche textuelle (optionnel)
 * @param quickFilter - Filtre rapide (optionnel)
 * @param currentProfileId - ID du profil actuel (optionnel)
 * @returns Input formaté pour la Server Action
 */
export function buildListTicketsActionInput(
  searchParams: URLSearchParams,
  offset: number,
  limit: number,
  sortColumn: TicketSortColumn,
  sortDirection: SortDirection,
  type?: string,
  status?: string,
  search?: string,
  quickFilter?: QuickFilter,
  currentProfileId?: string
): ListTicketsActionInput {
  const input: ListTicketsActionInput = {
    offset,
    limit,
    sortColumn,
    sortDirection
  };

  // Paramètres simples
  if (type) input.type = type as 'BUG' | 'REQ' | 'ASSISTANCE';
  if (status) input.status = status;
  if (search) input.search = search;
  if (quickFilter) input.quick = quickFilter;
  if (currentProfileId) input.currentProfileId = currentProfileId;

  // Filtres avancés depuis searchParams
  const types = searchParams.getAll('types');
  if (types.length > 0) {
    input.types = types as Array<'BUG' | 'REQ' | 'ASSISTANCE'>;
  }

  const statuses = searchParams.getAll('statuses');
  if (statuses.length > 0) {
    input.statuses = statuses;
  }

  const priorities = searchParams.getAll('priorities');
  if (priorities.length > 0) {
    input.priorities = priorities as Array<'Low' | 'Medium' | 'High' | 'Critical'>;
  }

  const assignedTo = searchParams.getAll('assignedTo');
  if (assignedTo.length > 0) {
    input.assignedTo = assignedTo;
  }

  const products = searchParams.getAll('products');
  if (products.length > 0) {
    input.products = products;
  }

  const modules = searchParams.getAll('modules');
  if (modules.length > 0) {
    input.modules = modules;
  }

  const channels = searchParams.getAll('channels');
  if (channels.length > 0) {
    input.channels = channels;
  }

  const origins = searchParams.getAll('origins');
  if (origins.length > 0) {
    input.origins = origins;
  }

  const hasJiraSync = searchParams.get('hasJiraSync');
  if (hasJiraSync !== null) {
    input.hasJiraSync = hasJiraSync === 'true';
  }

  // Filtres de date
  const createdAtPreset = searchParams.get('createdAtPreset');
  if (createdAtPreset) input.createdAtPreset = createdAtPreset;

  const createdAtStart = searchParams.get('createdAtStart');
  if (createdAtStart) input.createdAtStart = createdAtStart;

  const createdAtEnd = searchParams.get('createdAtEnd');
  if (createdAtEnd) input.createdAtEnd = createdAtEnd;

  const resolvedAtPreset = searchParams.get('resolvedAtPreset');
  if (resolvedAtPreset) input.resolvedAtPreset = resolvedAtPreset;

  const resolvedAtStart = searchParams.get('resolvedAtStart');
  if (resolvedAtStart) input.resolvedAtStart = resolvedAtStart;

  const resolvedAtEnd = searchParams.get('resolvedAtEnd');
  if (resolvedAtEnd) input.resolvedAtEnd = resolvedAtEnd;

  return input;
}

