/**
 * Gestion des préférences de colonnes pour le tableau des activités
 * Sauvegarde dans localStorage avec une clé distincte de celle des tickets
 */

export type ActivityColumnId = 
  | 'title' 
  | 'type' 
  | 'status' 
  | 'planned_dates'
  | 'creator'
  | 'participants'
  | 'linked_tickets'
  | 'created_at';

export type ActivityColumnConfig = {
  id: ActivityColumnId;
  label: string;
  required?: boolean; // Colonne qui ne peut pas être masquée
};

export const AVAILABLE_ACTIVITY_COLUMNS: ActivityColumnConfig[] = [
  { id: 'title', label: 'Titre', required: true },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Statut' },
  { id: 'planned_dates', label: 'Dates planifiées' },
  { id: 'creator', label: 'Créateur' },
  { id: 'participants', label: 'Participants' },
  { id: 'linked_tickets', label: 'Tickets liés' },
  { id: 'created_at', label: 'Date de création' }
];

const STORAGE_KEY = 'activities-table-columns';

/**
 * Récupère les colonnes visibles depuis localStorage
 * Retourne toutes les colonnes par défaut si aucune préférence n'est sauvegardée
 */
export function getVisibleActivityColumns(): Set<ActivityColumnId> {
  if (typeof window === 'undefined') {
    // Retourner toutes les colonnes par défaut côté serveur
    return new Set(AVAILABLE_ACTIVITY_COLUMNS.map(col => col.id));
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ActivityColumnId[];
      const visible = new Set(parsed);
      
      // S'assurer que les colonnes requises sont toujours visibles
      AVAILABLE_ACTIVITY_COLUMNS.forEach(col => {
        if (col.required) {
          visible.add(col.id);
        }
      });
      
      return visible;
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des préférences de colonnes d\'activités:', error);
  }

  // Par défaut, toutes les colonnes sont visibles
  return new Set(AVAILABLE_ACTIVITY_COLUMNS.map(col => col.id));
}

/**
 * Sauvegarde les colonnes visibles dans localStorage
 */
export function saveVisibleActivityColumns(visibleColumns: Set<ActivityColumnId>): void {
  if (typeof window === 'undefined') return;

  try {
    // S'assurer que les colonnes requises sont toujours incluses
    const toSave = new Set(visibleColumns);
    AVAILABLE_ACTIVITY_COLUMNS.forEach(col => {
      if (col.required) {
        toSave.add(col.id);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(toSave)));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences de colonnes d\'activités:', error);
  }
}

/**
 * Réinitialise les colonnes aux valeurs par défaut
 */
export function resetActivityColumnsToDefault(): Set<ActivityColumnId> {
  const defaultColumns = new Set(AVAILABLE_ACTIVITY_COLUMNS.map(col => col.id));
  saveVisibleActivityColumns(defaultColumns);
  return defaultColumns;
}

