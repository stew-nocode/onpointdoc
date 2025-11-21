import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';

/**
 * Map les colonnes de tri frontend vers les colonnes Supabase
 * @param column - Colonne de tri frontend
 * @returns Nom de colonne Supabase
 */
export function mapSortColumnToSupabase(column: TicketSortColumn): string {
  const columnMap: Record<TicketSortColumn, string> = {
    title: 'title',
    created_at: 'created_at',
    priority: 'priority',
    status: 'status',
    assigned_to: 'assigned_to'
  };

  return columnMap[column];
}

/**
 * Obtient l'indicateur de tri pour une colonne
 * @param currentColumn - Colonne actuellement triée
 * @param sortColumn - Colonne à vérifier
 * @param sortDirection - Direction du tri actuel
 * @returns Indicateur de tri ('↑', '↓', ou null)
 */
export function getSortIndicator(
  currentColumn: TicketSortColumn,
  sortColumn: TicketSortColumn,
  sortDirection: SortDirection
): '↑' | '↓' | null {
  if (currentColumn !== sortColumn) {
    return null;
  }

  return sortDirection === 'asc' ? '↑' : '↓';
}

/**
 * Obtient la direction de tri suivante pour une colonne
 * @param currentColumn - Colonne actuellement triée
 * @param sortColumn - Colonne à trier
 * @param currentDirection - Direction actuelle du tri
 * @returns Nouvelle direction de tri
 */
export function getNextSortDirection(
  currentColumn: TicketSortColumn,
  sortColumn: TicketSortColumn,
  currentDirection: SortDirection
): SortDirection {
  // Si on change de colonne, on commence par desc
  if (currentColumn !== sortColumn) {
    return 'desc';
  }

  // Si même colonne, on alterne entre desc et asc
  return currentDirection === 'desc' ? 'asc' : 'desc';
}

