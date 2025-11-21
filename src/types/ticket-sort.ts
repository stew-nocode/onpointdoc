/**
 * Types pour le tri des tickets
 */

/**
 * Colonnes triables dans le tableau des tickets
 */
export type TicketSortColumn = 'title' | 'created_at' | 'priority' | 'status' | 'assigned_to';

/**
 * Direction du tri
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Configuration du tri
 */
export type TicketSort = {
  column: TicketSortColumn;
  direction: SortDirection;
};

/**
 * Colonne de tri par défaut
 */
export const DEFAULT_SORT_COLUMN: TicketSortColumn = 'created_at';

/**
 * Direction de tri par défaut
 */
export const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

/**
 * Tri par défaut
 */
export const DEFAULT_TICKET_SORT: TicketSort = {
  column: DEFAULT_SORT_COLUMN,
  direction: DEFAULT_SORT_DIRECTION
};

/**
 * Valide si une chaîne est une colonne de tri valide
 * @param value - Valeur à valider
 * @returns true si c'est une colonne de tri valide
 */
export function isValidSortColumn(value: string): value is TicketSortColumn {
  return ['title', 'created_at', 'priority', 'status', 'assigned_to'].includes(value);
}

/**
 * Valide si une chaîne est une direction de tri valide
 * @param value - Valeur à valider
 * @returns true si c'est une direction de tri valide
 */
export function isValidSortDirection(value: string): value is SortDirection {
  return value === 'asc' || value === 'desc';
}

/**
 * Parse les paramètres de tri depuis l'URL
 * @param sortColumnParam - Paramètre de colonne de tri (optionnel)
 * @param sortDirectionParam - Paramètre de direction de tri (optionnel)
 * @returns Configuration de tri valide
 */
export function parseTicketSort(
  sortColumnParam?: string,
  sortDirectionParam?: string
): TicketSort {
  const column: TicketSortColumn = isValidSortColumn(sortColumnParam || '')
    ? (sortColumnParam as TicketSortColumn)
    : DEFAULT_SORT_COLUMN;

  const direction: SortDirection = isValidSortDirection(sortDirectionParam || '')
    ? (sortDirectionParam as SortDirection)
    : DEFAULT_SORT_DIRECTION;

  return { column, direction };
}

