/**
 * Gestion des préférences de colonnes pour les tableaux
 * Sauvegarde dans localStorage
 */

export type ColumnId = 
  | 'title' 
  | 'type' 
  | 'status' 
  | 'priority' 
  | 'canal' 
  | 'product' 
  | 'module' 
  | 'jira' 
  | 'created_at' 
  | 'assigned';
  // 'reporter' et 'client' seront ajoutés quand les données seront disponibles

export type ColumnConfig = {
  id: ColumnId;
  label: string;
  required?: boolean; // Colonne qui ne peut pas être masquée
};

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { id: 'title', label: 'Titre', required: true },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Statut' },
  { id: 'priority', label: 'Priorité' },
  { id: 'canal', label: 'Canal' },
  { id: 'product', label: 'Produit' },
  { id: 'module', label: 'Module' },
  { id: 'jira', label: 'Jira' },
  { id: 'created_at', label: 'Créé le' },
  { id: 'assigned', label: 'Assigné' }
  // Note: 'reporter' et 'client' seront ajoutés quand les données seront disponibles
];

const STORAGE_KEY = 'tickets-table-columns';

/**
 * Récupère les colonnes visibles depuis localStorage
 * Retourne toutes les colonnes par défaut si aucune préférence n'est sauvegardée
 */
export function getVisibleColumns(): Set<ColumnId> {
  if (typeof window === 'undefined') {
    // Retourner toutes les colonnes par défaut côté serveur
    return new Set(AVAILABLE_COLUMNS.map(col => col.id));
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnId[];
      const visible = new Set(parsed);
      
      // S'assurer que les colonnes requises sont toujours visibles
      AVAILABLE_COLUMNS.forEach(col => {
        if (col.required) {
          visible.add(col.id);
        }
      });
      
      return visible;
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des préférences de colonnes:', error);
  }

  // Par défaut, toutes les colonnes sont visibles
  return new Set(AVAILABLE_COLUMNS.map(col => col.id));
}

/**
 * Sauvegarde les colonnes visibles dans localStorage
 */
export function saveVisibleColumns(visibleColumns: Set<ColumnId>): void {
  if (typeof window === 'undefined') return;

  try {
    // S'assurer que les colonnes requises sont toujours incluses
    const toSave = new Set(visibleColumns);
    AVAILABLE_COLUMNS.forEach(col => {
      if (col.required) {
        toSave.add(col.id);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(toSave)));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences de colonnes:', error);
  }
}

/**
 * Réinitialise les colonnes aux valeurs par défaut
 */
export function resetColumnsToDefault(): Set<ColumnId> {
  const defaultColumns = new Set(AVAILABLE_COLUMNS.map(col => col.id));
  saveVisibleColumns(defaultColumns);
  return defaultColumns;
}

