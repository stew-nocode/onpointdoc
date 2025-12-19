'use client';

/**
 * Composant pour afficher l'en-tête du tableau des entreprises
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (afficher l'en-tête du tableau)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * 
 * Pattern similaire à TasksTableHeader pour cohérence
 */

import React from 'react';
import type { CompanyWithRelations } from '@/types/company-with-relations';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
import { SortableCompanyTableHeader } from '../sortable-company-table-header';

type CompaniesTableHeaderProps = {
  /**
   * Liste des entreprises (pour le tri si nécessaire)
   */
  companies: CompanyWithRelations[];

  /**
   * Colonne de tri actuelle
   */
  sortColumn?: CompanySortColumn;

  /**
   * Direction de tri actuelle
   */
  sortDirection?: SortDirection;

  /**
   * Fonction appelée lors du changement de tri
   */
  onSortChange?: (column: CompanySortColumn, direction: SortDirection) => void;
};

/**
 * Composant pour afficher l'en-tête du tableau des entreprises
 * 
 * @param props - Propriétés du composant
 */
export function CompaniesTableHeader({
  companies,
  sortColumn = 'name',
  sortDirection = 'asc',
  onSortChange
}: CompaniesTableHeaderProps) {
  return (
    <thead className="border-b border-slate-200 dark:border-slate-800">
      <tr>
        {/* Nom */}
        <SortableCompanyTableHeader
          column="name"
          label="Nom"
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onSort={onSortChange || (() => {})}
        />

        {/* Pays */}
        <SortableCompanyTableHeader
          column="country"
          label="Pays"
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onSort={onSortChange || (() => {})}
        />

        {/* Point focal */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Point focal
        </th>

        {/* Utilisateurs */}
        <SortableCompanyTableHeader
          column="users_count"
          label="Utilisateurs"
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onSort={onSortChange || (() => {})}
        />

        {/* Tickets */}
        <SortableCompanyTableHeader
          column="tickets_count"
          label="Tickets"
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onSort={onSortChange || (() => {})}
        />

        {/* Tickets ouverts */}
        <SortableCompanyTableHeader
          column="open_tickets_count"
          label="Ouverts"
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onSort={onSortChange || (() => {})}
        />

        {/* Durée assistance */}
        <SortableCompanyTableHeader
          column="assistance_duration"
          label="Durée assist."
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onSort={onSortChange || (() => {})}
        />

        {/* Date de création */}
        <SortableCompanyTableHeader
          column="created_at"
          label="Date de création"
          currentSortColumn={sortColumn}
          currentSortDirection={sortDirection}
          onSort={onSortChange || (() => {})}
        />

        {/* Actions - Toujours visible */}
        <th className="pb-2 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400" />
      </tr>
    </thead>
  );
}
