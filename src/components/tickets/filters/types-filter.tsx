'use client';

import { MultiSelectFilter } from './multi-select-filter';
import { ticketTypes } from '@/lib/validators/ticket';

type TypesFilterProps = {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
};

/**
 * Composant pour filtrer par type de ticket (BUG, REQ, ASSISTANCE)
 * 
 * @param selectedTypes - Types de tickets sélectionnés
 * @param onTypesChange - Callback appelé lors du changement de sélection
 */
export function TypesFilter({ selectedTypes, onTypesChange }: TypesFilterProps) {
  const options = ticketTypes.map((type) => ({
    value: type,
    label: type
  }));

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedTypes}
      onSelectionChange={onTypesChange}
      placeholder="Tous les types"
      searchPlaceholder="Rechercher un type..."
      emptyText="Aucun type trouvé"
      label="Type"
    />
  );
}

