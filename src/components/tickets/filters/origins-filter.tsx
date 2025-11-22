'use client';

import { MultiSelectFilter } from './multi-select-filter';

type OriginsFilterProps = {
  selectedOrigins: string[];
  onOriginsChange: (origins: string[]) => void;
};

/**
 * Options d'origine disponibles
 */
const ORIGIN_OPTIONS = [
  { value: 'supabase', label: 'Supabase' },
  { value: 'jira', label: 'JIRA' }
];

/**
 * Composant pour filtrer par origine du ticket
 * 
 * @param selectedOrigins - Origines sélectionnées
 * @param onOriginsChange - Callback appelé lors du changement de sélection
 */
export function OriginsFilter({ selectedOrigins, onOriginsChange }: OriginsFilterProps) {
  return (
    <MultiSelectFilter
      options={ORIGIN_OPTIONS}
      selectedValues={selectedOrigins}
      onSelectionChange={onOriginsChange}
      placeholder="Toutes les origines"
      searchPlaceholder="Rechercher une origine..."
      emptyText="Aucune origine trouvée"
      label="Origine"
    />
  );
}

