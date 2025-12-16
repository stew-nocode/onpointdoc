'use client';

/**
 * Composant pour afficher l'en-tête du tableau des activités
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher l'en-tête du tableau)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * Pattern similaire à TicketsTableHeader pour cohérence
 * Version simplifiée : pas de tri pour l'instant
 */

import React from 'react';
import { Checkbox } from '@/ui/checkbox';
import type { ActivityWithRelations } from '@/types/activity-with-relations';
import type { ActivityColumnId } from '@/lib/utils/activity-column-preferences';

type ActivitiesTableHeaderProps = {
  /**
   * Liste des activités pour déterminer si toutes sont sélectionnées
   */
  activities: ActivityWithRelations[];

  /**
   * Fonction pour vérifier si toutes les activités sont sélectionnées
   */
  areAllActivitiesSelected: (activities: ActivityWithRelations[]) => boolean;

  /**
   * Fonction pour vérifier si certaines activités sont sélectionnées
   */
  areSomeActivitiesSelected: (activities: ActivityWithRelations[]) => boolean;

  /**
   * Fonction pour sélectionner toutes les activités
   */
  selectAllActivities: (activities: ActivityWithRelations[]) => void;

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
  visibleColumns: Set<ActivityColumnId>;
};

/**
 * Composant pour afficher l'en-tête du tableau des activités
 * 
 * Affiche toutes les colonnes avec leurs en-têtes.
 * Gère la checkbox "Select All".
 * 
 * @param props - Propriétés du composant
 * @returns Élément <thead> représentant l'en-tête du tableau
 */
export function ActivitiesTableHeader({
  activities,
  areAllActivitiesSelected,
  areSomeActivitiesSelected,
  selectAllActivities,
  clearSelection,
  canSelectMultiple = true, // Par défaut, autoriser la sélection
  visibleColumns
}: ActivitiesTableHeaderProps) {
  return (
    <thead className="border-b border-slate-200 dark:border-slate-800">
      <tr>
        {/* Colonne checkbox Select All - Masquée si canSelectMultiple est false */}
        {canSelectMultiple && (
          <th className="w-12 pb-2 pr-2">
            <div className="flex items-center justify-center">
              <Checkbox
                checked={areAllActivitiesSelected(activities)}
                indeterminate={areSomeActivitiesSelected(activities)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAllActivities(activities);
                  } else {
                    clearSelection();
                  }
                }}
                aria-label="Sélectionner toutes les activités"
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

        {/* Type */}
        {visibleColumns.has('type') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Type
          </th>
        )}

        {/* Statut */}
        {visibleColumns.has('status') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Statut
          </th>
        )}

        {/* Dates planifiées */}
        {visibleColumns.has('planned_dates') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Dates planifiées
          </th>
        )}

        {/* Créateur */}
        {visibleColumns.has('creator') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Créateur
          </th>
        )}

        {/* Participants */}
        {visibleColumns.has('participants') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Participants
          </th>
        )}

        {/* Tickets liés */}
        {visibleColumns.has('linked_tickets') && (
          <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Tickets liés
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
