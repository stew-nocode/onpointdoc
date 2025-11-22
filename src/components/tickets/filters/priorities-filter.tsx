'use client';

import { MultiSelectFilter } from './multi-select-filter';
import { TICKET_PRIORITIES } from '@/lib/constants/tickets';

type PrioritiesFilterProps = {
  selectedPriorities: string[];
  onPrioritiesChange: (priorities: string[]) => void;
};

/**
 * Libellés de priorité en français
 */
const PRIORITY_LABELS: Record<string, string> = {
  Critical: 'Critique',
  High: 'Haute',
  Medium: 'Moyenne',
  Low: 'Basse'
};

/**
 * Construit les options de priorité avec libellés français
 * 
 * @returns Liste des options de priorité
 */
function buildPriorityOptions(): Array<{ value: string; label: string }> {
  return TICKET_PRIORITIES.map((priority) => ({
    value: priority,
    label: PRIORITY_LABELS[priority] || priority
  }));
}

/**
 * Composant pour filtrer par priorité de ticket
 * 
 * @param selectedPriorities - Priorités sélectionnées
 * @param onPrioritiesChange - Callback appelé lors du changement de sélection
 */
export function PrioritiesFilter({
  selectedPriorities,
  onPrioritiesChange
}: PrioritiesFilterProps) {
  const options = buildPriorityOptions();

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedPriorities}
      onSelectionChange={onPrioritiesChange}
      placeholder="Toutes les priorités"
      searchPlaceholder="Rechercher une priorité..."
      emptyText="Aucune priorité trouvée"
      label="Priorité"
    />
  );
}


