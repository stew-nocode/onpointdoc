/**
 * Types pour le tri des tableaux de companies
 */

export type CompanySortColumn = 
  | 'name'                    // Nom de l'entreprise
  | 'country'                 // Pays
  | 'created_at'              // Date de création
  | 'users_count'             // Nombre d'utilisateurs (insight)
  | 'tickets_count'           // Nombre de tickets (insight)
  | 'open_tickets_count'      // Nombre de tickets ouverts (insight)
  | 'assistance_duration';    // Durée d'assistance cumulée (insight)

export type SortDirection = 'asc' | 'desc';

export type CompanySort = {
  column: CompanySortColumn;
  direction: SortDirection;
};

/**
 * Vérifie si une colonne de tri est valide
 */
export function isValidCompanySortColumn(column: string): column is CompanySortColumn {
  return ['name', 'country', 'created_at', 'users_count', 'tickets_count', 'open_tickets_count', 'assistance_duration'].includes(column);
}

/**
 * Vérifie si une direction de tri est valide
 */
export function isValidSortDirection(direction: string): direction is SortDirection {
  return direction === 'asc' || direction === 'desc';
}

/**
 * Parse les paramètres de tri depuis l'URL
 */
export function parseCompanySort(
  sortColumn?: string,
  sortDirection?: string
): CompanySort {
  const DEFAULT_SORT: CompanySort = {
    column: 'name',
    direction: 'asc'
  };

  if (!sortColumn || !isValidCompanySortColumn(sortColumn)) {
    return DEFAULT_SORT;
  }

  const direction = isValidSortDirection(sortDirection || '') ? sortDirection : 'asc';

  return {
    column: sortColumn,
    direction: direction as SortDirection
  };
}

