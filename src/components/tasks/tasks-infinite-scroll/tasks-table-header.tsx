'use client';

/**
 * Composant pour afficher l'en-tête du tableau des tâches
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher l'en-tête du tableau)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * Pattern similaire à ActivitiesTableHeader pour cohérence
 */

import React from 'react';
import { Checkbox } from '@/ui/checkbox';
import type { TaskWithRelations } from '@/types/task-with-relations';
import type { TaskColumnId } from '@/lib/utils/task-column-preferences';

type TasksTableHeaderProps = {
  /**
   * Liste des tâches pour déterminer si toutes sont sélectionnées
   */
  tasks: TaskWithRelations[];

  /**
   * Fonction pour vérifier si toutes les tâches sont sélectionnées
   */
  areAllTasksSelected: (tasks: TaskWithRelations[]) => boolean;

  /**
   * Fonction pour vérifier si certaines tâches sont sélectionnées
   */
  areSomeTasksSelected: (tasks: TaskWithRelations[]) => boolean;

  /**
   * Fonction pour sélectionner toutes les tâches
   */
  selectAllTasks: (tasks: TaskWithRelations[]) => void;

  /**
   * Fonction pour effacer la sélection
   */
  clearSelection: () => void;

  /**
   * Permissions de sélection multiple
   * Si false, masque la checkbox "Select All"
   */
  canSelectMultiple?: boolean;

  /**
   * Colonnes visibles dans le tableau
   */
  visibleColumns: Set<TaskColumnId>;
};

/**
 * Composant pour afficher l'en-tête du tableau des tâches
 * 
 * Affiche toutes les colonnes avec leurs en-têtes.
 * Gère la checkbox "Select All".
 * 
 * @param props - Propriétés du composant
 * @returns Élément <thead> représentant l'en-tête du tableau
 */
export function TasksTableHeader({
  tasks,
  areAllTasksSelected,
  areSomeTasksSelected,
  selectAllTasks,
  clearSelection,
  canSelectMultiple = true,
  visibleColumns
}: TasksTableHeaderProps) {
  return (
    <thead className="border-b border-slate-200 dark:border-slate-800">
      <tr>
        {/* Colonne checkbox Select All - Masquée si canSelectMultiple est false */}
        {canSelectMultiple && (
          <th className="w-12 pb-2 pr-2">
            <div className="flex items-center justify-center">
              <Checkbox
                checked={areAllTasksSelected(tasks)}
                indeterminate={areSomeTasksSelected(tasks)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAllTasks(tasks);
                  } else {
                    clearSelection();
                  }
                }}
                aria-label="Sélectionner toutes les tâches"
              />
            </div>
          </th>
        )}

        {/* Titre */}
        {visibleColumns.has('title') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Titre
          </th>
        )}

        {/* Statut */}
        {visibleColumns.has('status') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Statut
          </th>
        )}

        {/* Date d'échéance */}
        {visibleColumns.has('due_date') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Date d'échéance
          </th>
        )}

        {/* Assigné à */}
        {visibleColumns.has('assigned_to') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Assigné à
          </th>
        )}

        {/* Créateur */}
        {visibleColumns.has('creator') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Créateur
          </th>
        )}

        {/* Tickets liés */}
        {visibleColumns.has('linked_tickets') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Tickets liés
          </th>
        )}

        {/* Activités liées */}
        {visibleColumns.has('linked_activities') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Activités liées
          </th>
        )}

        {/* Date de création */}
        {visibleColumns.has('created_at') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Date de création
          </th>
        )}

        {/* Actions - Toujours visible */}
        <th className="pb-2 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400" />
      </tr>
    </thead>
  );
}
