'use client';

import { MultiSelectFilter } from '@/components/tickets/filters/multi-select-filter';
import { ticketTypes } from '@/lib/validators/ticket';

type DashboardTypesFilterProps = {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
};

/**
 * Construit les options de types de tickets
 */
function buildTypeOptions(): Array<{ value: string; label: string }> {
  return ticketTypes.map((type) => ({
    value: type,
    label: type
  }));
}

/**
 * Filtre types de tickets pour le dashboard
 * 
 * @param selectedTypes - Types sélectionnés
 * @param onTypesChange - Callback lors du changement
 */
export function DashboardTypesFilter({
  selectedTypes,
  onTypesChange
}: DashboardTypesFilterProps) {
  const options = buildTypeOptions();

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedTypes}
      onSelectionChange={onTypesChange}
      placeholder="Tous les types"
      searchPlaceholder="Rechercher un type..."
      emptyText="Aucun type trouvé"
      label="Types de tickets"
    />
  );
}

