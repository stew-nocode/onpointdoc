import type { CompanySortColumn, SortDirection } from '@/types/company-sort';

/**
 * Map les colonnes de tri frontend vers les colonnes Supabase pour companies
 */
export function mapCompanySortColumnToSupabase(column: CompanySortColumn): string {
  const columnMap: Record<CompanySortColumn, string> = {
    name: 'name',
    country: 'country_id',
    created_at: 'created_at'
  };

  return columnMap[column];
}

/**
 * Obtient l'indicateur de tri pour une colonne
 */
export function getCompanySortIndicator(
  currentColumn: CompanySortColumn,
  sortColumn: CompanySortColumn,
  sortDirection: SortDirection
): '↑' | '↓' | null {
  if (currentColumn !== sortColumn) {
    return null;
  }

  return sortDirection === 'asc' ? '↑' : '↓';
}

/**
 * Obtient la direction de tri suivante pour une colonne
 */
export function getNextCompanySortDirection(
  currentColumn: CompanySortColumn,
  sortColumn: CompanySortColumn,
  currentDirection: SortDirection
): SortDirection {
  if (currentColumn !== sortColumn) {
    return 'desc';
  }

  return currentDirection === 'desc' ? 'asc' : 'desc';
}

