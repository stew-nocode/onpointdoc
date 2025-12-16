/**
 * Gestion des préférences de colonnes pour le tableau des tâches
 * 
 * Pattern similaire à activity-column-preferences.ts pour cohérence
 */

export type TaskColumnId =
  | 'title'
  | 'status'
  | 'due_date'
  | 'assigned_to'
  | 'creator'
  | 'linked_tickets'
  | 'linked_activities'
  | 'created_at';

export type TaskColumnConfig = {
  id: TaskColumnId;
  label: string;
  required?: boolean;
};

export const AVAILABLE_TASK_COLUMNS: TaskColumnConfig[] = [
  { id: 'title', label: 'Titre', required: true },
  { id: 'status', label: 'Statut' },
  { id: 'due_date', label: 'Date d\'échéance' },
  { id: 'assigned_to', label: 'Assigné à' },
  { id: 'creator', label: 'Créateur' },
  { id: 'linked_tickets', label: 'Tickets liés' },
  { id: 'linked_activities', label: 'Activités liées' },
  { id: 'created_at', label: 'Date de création' }
];

const STORAGE_KEY = 'tasks-table-columns';

/**
 * Récupère les colonnes visibles depuis localStorage
 * 
 * @returns Set des IDs de colonnes visibles
 */
export function getVisibleTaskColumns(): Set<TaskColumnId> {
  if (typeof window === 'undefined') {
    // Valeur par défaut côté serveur
    return new Set(AVAILABLE_TASK_COLUMNS.map(col => col.id));
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return resetTaskColumnsToDefault();
    }

    const parsed = JSON.parse(stored) as TaskColumnId[];
    
    // Valider que toutes les colonnes requises sont présentes
    const requiredColumns = AVAILABLE_TASK_COLUMNS
      .filter(col => col.required)
      .map(col => col.id);
    
    const visibleSet = new Set(parsed);
    
    // S'assurer que les colonnes requises sont incluses
    requiredColumns.forEach(col => visibleSet.add(col));
    
    // Filtrer les colonnes invalides
    const validColumns = Array.from(visibleSet).filter(col =>
      AVAILABLE_TASK_COLUMNS.some(config => config.id === col)
    );
    
    if (validColumns.length === 0) {
      return resetTaskColumnsToDefault();
    }
    
    return new Set(validColumns);
  } catch {
    return resetTaskColumnsToDefault();
  }
}

/**
 * Sauvegarde les colonnes visibles dans localStorage
 * 
 * @param visibleColumns - Set des IDs de colonnes visibles
 */
export function saveVisibleTaskColumns(visibleColumns: Set<TaskColumnId>): void {
  if (typeof window === 'undefined') return;

  try {
    const array = Array.from(visibleColumns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des colonnes:', error);
  }
}

/**
 * Réinitialise les colonnes à leur configuration par défaut
 * 
 * @returns Set des IDs de colonnes par défaut
 */
export function resetTaskColumnsToDefault(): Set<TaskColumnId> {
  const defaultColumns = AVAILABLE_TASK_COLUMNS.map(col => col.id);
  const defaultSet = new Set<TaskColumnId>(defaultColumns);
  
  if (typeof window !== 'undefined') {
    saveVisibleTaskColumns(defaultSet);
  }
  
  return defaultSet;
}
