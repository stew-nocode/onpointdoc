/**
 * Types pour les filtres de tâches
 * 
 * Définit les filtres rapides disponibles pour les tâches
 */

/**
 * Filtre rapide pour les tâches
 */
export type TaskQuickFilter =
  | 'all'              // Toutes les tâches
  | 'mine'             // Mes tâches (assignées à moi)
  | 'todo'             // À faire (statut = 'A_faire')
  | 'in_progress'      // En cours (statut = 'En_cours')
  | 'blocked'          // Bloquées (statut = 'Bloque')
  | 'completed'        // Terminées (statut = 'Termine')
  | 'overdue';         // En retard (due_date < today ET status != 'Termine'/'Annule')

