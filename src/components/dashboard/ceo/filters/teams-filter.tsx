'use client';

import { MultiSelectFilter } from '@/components/tickets/filters/multi-select-filter';

type TeamsFilterProps = {
  selectedTeams: string[];
  onTeamsChange: (teams: string[]) => void;
};

const TEAM_OPTIONS = [
  { value: 'support', label: 'Support' },
  { value: 'it', label: 'IT' },
  { value: 'marketing', label: 'Marketing' }
];

/**
 * Filtre équipes pour le dashboard
 * 
 * @param selectedTeams - Équipes sélectionnées
 * @param onTeamsChange - Callback lors du changement
 */
export function TeamsFilter({ selectedTeams, onTeamsChange }: TeamsFilterProps) {
  return (
    <MultiSelectFilter
      options={TEAM_OPTIONS}
      selectedValues={selectedTeams}
      onSelectionChange={onTeamsChange}
      placeholder="Toutes les équipes"
      searchPlaceholder="Rechercher une équipe..."
      emptyText="Aucune équipe trouvée"
      label="Équipes"
    />
  );
}

