'use client';

import { MultiSelectFilter } from './multi-select-filter';
import { ticketChannels } from '@/lib/validators/ticket';

type ChannelsFilterProps = {
  selectedChannels: string[];
  onChannelsChange: (channels: string[]) => void;
};

/**
 * Composant pour filtrer par canal de contact
 * 
 * @param selectedChannels - Canaux sélectionnés
 * @param onChannelsChange - Callback appelé lors du changement de sélection
 */
export function ChannelsFilter({ selectedChannels, onChannelsChange }: ChannelsFilterProps) {
  const options = ticketChannels.map((channel) => ({
    value: channel,
    label: channel
  }));

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedChannels}
      onSelectionChange={onChannelsChange}
      placeholder="Tous les canaux"
      searchPlaceholder="Rechercher un canal..."
      emptyText="Aucun canal trouvé"
      label="Canal"
    />
  );
}

