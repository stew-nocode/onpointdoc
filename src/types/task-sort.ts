/**
 * Types pour le tri des tableaux de tâches
 */

export type TaskSortColumn = 
  | 'title'                  // Titre de la tâche
  | 'status'                 // Statut (à faire, en cours, terminée, annulée)
  | 'priority'               // Priorité (basse, normale, haute)
  | 'due_date'               // Date d'échéance
  | 'created_at'             // Date de création
  | 'updated_at';            // Date de mise à jour

export type SortDirection = 'asc' | 'desc';

export type TaskSort = {
  column: TaskSortColumn;
  direction: SortDirection;
};

/**
 * Vérifie si une colonne de tri est valide
 */
export function isValidTaskSortColumn(column: string): column is TaskSortColumn {
  return ['title', 'status', 'priority', 'due_date', 'created_at', 'updated_at'].includes(column);
}

/**
 * Vérifie si une direction de tri est valide
 */
export function isValidSortDirection(direction: string): direction is SortDirection {
  return direction === 'asc' || direction === 'desc';
}

/**
 * Parse les paramètres de tri depuis l'URL
 * 
 * Format attendu : "column:direction" (ex: "created_at:desc")
 * 
 * @param sortParam - Paramètre de tri depuis l'URL (format "column:direction")
 * @returns Configuration de tri ou tri par défaut
 */
export function parseTaskSort(sortParam?: string): TaskSort {
  const DEFAULT_SORT: TaskSort = {
    column: 'created_at',
    direction: 'desc'
  };

  if (!sortParam) {
    return DEFAULT_SORT;
  }

  const [column, direction] = sortParam.split(':');

  if (!column || !isValidTaskSortColumn(column)) {
    return DEFAULT_SORT;
  }

  const validDirection = isValidSortDirection(direction || '') ? direction : 'desc';

  return {
    column,
    direction: validDirection as SortDirection
  };
}

