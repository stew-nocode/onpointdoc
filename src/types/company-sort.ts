/**
 * Types pour le tri des tableaux de companies
 */

export type CompanySortColumn = 'name' | 'country' | 'created_at';

export type SortDirection = 'asc' | 'desc';

export type CompanySort = {
  column: CompanySortColumn;
  direction: SortDirection;
};

/**
 * Vérifie si une colonne de tri est valide
 */
export function isValidCompanySortColumn(column: string): column is CompanySortColumn {
  return ['name', 'country', 'created_at'].includes(column);
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
    direction: 'desc'
  };

  if (!sortColumn || !isValidCompanySortColumn(sortColumn)) {
    return DEFAULT_SORT;
  }

  const direction = isValidSortDirection(sortDirection || '') ? sortDirection : 'desc';

  return {
    column: sortColumn,
    direction: direction as SortDirection
  };
}

