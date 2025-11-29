'use client';

/**
 * Composant pour afficher l'en-tête du tableau des tickets
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher l'en-tête du tableau)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * ✅ PHASE 5 - ÉTAPE 5 : Composant extrait pour réduire la complexité du composant parent
 */

import React from 'react';
import { Checkbox } from '@/ui/checkbox';
import { SortableTableHeader } from '../sortable-table-header';
import type { TicketWithRelations } from '@/types/ticket-with-relations';
import type { ColumnId } from '@/lib/utils/column-preferences';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';

type TicketsTableHeaderProps = {
  /**
   * Liste des tickets pour déterminer si tous sont sélectionnés
   */
  tickets: TicketWithRelations[];

  /**
   * Fonction pour vérifier si tous les tickets sont sélectionnés
   */
  areAllTicketsSelected: (tickets: TicketWithRelations[]) => boolean;

  /**
   * Fonction pour vérifier si certains tickets sont sélectionnés
   */
  areSomeTicketsSelected: (tickets: TicketWithRelations[]) => boolean;

  /**
   * Fonction pour sélectionner tous les tickets
   */
  selectAllTickets: (tickets: TicketWithRelations[]) => void;

  /**
   * Fonction pour effacer la sélection
   */
  clearSelection: () => void;

  /**
   * Colonne de tri actuelle
   */
  currentSort: TicketSortColumn;

  /**
   * Direction de tri actuelle
   */
  currentSortDirection: SortDirection;

  /**
   * Handler pour changer le tri
   */
  handleSort: (column: TicketSortColumn, direction: SortDirection) => void;

  /**
   * Fonction pour vérifier si une colonne est visible
   */
  isColumnVisible: (columnId: ColumnId) => boolean;
};

/**
 * Composant pour afficher l'en-tête du tableau des tickets
 * 
 * Affiche toutes les colonnes avec leurs en-têtes.
 * Gère la checkbox "Select All" et les en-têtes triables.
 * 
 * @param props - Propriétés du composant
 * @returns Élément <thead> représentant l'en-tête du tableau
 */
export function TicketsTableHeader({
  tickets,
  areAllTicketsSelected,
  areSomeTicketsSelected,
  selectAllTickets,
  clearSelection,
  currentSort,
  currentSortDirection,
  handleSort,
  isColumnVisible
}: TicketsTableHeaderProps) {
  return (
    <thead className="border-b border-slate-200 dark:border-slate-800">
      <tr>
        {/* Colonne checkbox Select All */}
        <th className="w-12 pb-2.5 pr-2">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={areAllTicketsSelected(tickets)}
              indeterminate={areSomeTicketsSelected(tickets)}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAllTickets(tickets);
                } else {
                  clearSelection();
                }
              }}
              aria-label="Sélectionner tous les tickets"
            />
          </div>
        </th>

        {/* Titre - Triable */}
        {isColumnVisible('title') && (
          <SortableTableHeader
            column="title"
            label="Titre"
            currentSortColumn={currentSort}
            currentSortDirection={currentSortDirection}
            onSort={handleSort}
          />
        )}

        {/* Type - Non triable */}
        {isColumnVisible('type') && (
          <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Type
          </th>
        )}

        {/* Statut - Triable */}
        {isColumnVisible('status') && (
          <SortableTableHeader
            column="status"
            label="Statut"
            currentSortColumn={currentSort}
            currentSortDirection={currentSortDirection}
            onSort={handleSort}
          />
        )}

        {/* Priorité - Triable */}
        {isColumnVisible('priority') && (
          <SortableTableHeader
            column="priority"
            label="Priorité"
            currentSortColumn={currentSort}
            currentSortDirection={currentSortDirection}
            onSort={handleSort}
          />
        )}

        {/* Canal - Non triable */}
        {isColumnVisible('canal') && (
          <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Canal
          </th>
        )}

        {/* Entreprise - Non triable */}
        {isColumnVisible('company') && (
          <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Entreprise
          </th>
        )}

        {/* Produit - Non triable */}
        {isColumnVisible('product') && (
          <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Produit
          </th>
        )}

        {/* Module - Non triable */}
        {isColumnVisible('module') && (
          <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Module
          </th>
        )}

        {/* Jira - Non triable */}
        {isColumnVisible('jira') && (
          <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Jira
          </th>
        )}

        {/* Date de création - Triable */}
        {isColumnVisible('created_at') && (
          <SortableTableHeader
            column="created_at"
            label="Créé le"
            currentSortColumn={currentSort}
            currentSortDirection={currentSortDirection}
            onSort={handleSort}
          />
        )}

        {/* Rapporteur - Non triable */}
        {isColumnVisible('reporter') && (
          <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Rapporteur
          </th>
        )}

        {/* Assigné - Triable */}
        {isColumnVisible('assigned') && (
          <SortableTableHeader
            column="assigned_to"
            label="Assigné"
            currentSortColumn={currentSort}
            currentSortDirection={currentSortDirection}
            onSort={handleSort}
          />
        )}

        {/* Colonne vide pour les actions */}
        <th className="pb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" />
      </tr>
    </thead>
  );
}

