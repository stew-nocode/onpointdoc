'use client';

import { MultiSelectFilter } from './multi-select-filter';
import {
  ASSISTANCE_LOCAL_STATUSES,
  ASSISTANCE_TRANSFER_STATUS,
  JIRA_STATUSES
} from '@/lib/constants/tickets';

type StatusesFilterProps = {
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
};

/**
 * Construit la liste de tous les statuts disponibles
 * 
 * @returns Liste de tous les statuts (locaux + JIRA)
 */
function buildAllStatuses(): Array<{ value: string; label: string }> {
  const assistanceStatuses = [...ASSISTANCE_LOCAL_STATUSES, ASSISTANCE_TRANSFER_STATUS];
  const allStatuses = [...assistanceStatuses, ...JIRA_STATUSES];
  
  // Retirer les doublons (au cas où)
  const uniqueStatuses = Array.from(new Set(allStatuses));
  
  return uniqueStatuses.map((status) => ({
    value: status,
    label: status
  }));
}

/**
 * Composant pour filtrer par statut de ticket
 * 
 * @param selectedStatuses - Statuts sélectionnés
 * @param onStatusesChange - Callback appelé lors du changement de sélection
 */
export function StatusesFilter({ selectedStatuses, onStatusesChange }: StatusesFilterProps) {
  const options = buildAllStatuses();

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedStatuses}
      onSelectionChange={onStatusesChange}
      placeholder="Tous les statuts"
      searchPlaceholder="Rechercher un statut..."
      emptyText="Aucun statut trouvé"
      label="Statut"
    />
  );
}


