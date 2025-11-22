'use client';

import { Button } from '@/ui/button';
import { FiltersSidebarSearchInput } from './filters-sidebar-search-input';
import { MultiSelectOptions } from './multi-select-options';

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectPopoverContentProps = {
  searchPlaceholder?: string;
  search: string;
  onSearchChange: (value: string) => void;
  filteredOptions: MultiSelectOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  emptyText?: string;
  onClearAll: () => void;
};

/**
 * Contenu du popover pour un filtre multi-select
 *
 * Affiche la recherche, les options et le bouton effacer tout
 */
export function MultiSelectPopoverContent({
  searchPlaceholder,
  search,
  onSearchChange,
  filteredOptions,
  selectedValues,
  onToggle,
  emptyText,
  onClearAll
}: MultiSelectPopoverContentProps) {
  return (
    <div className="space-y-2 p-3">
      <FiltersSidebarSearchInput
        placeholder={searchPlaceholder}
        value={search}
        onChange={onSearchChange}
      />

      <MultiSelectOptions
        options={filteredOptions}
        selectedValues={selectedValues}
        onToggle={onToggle}
        emptyText={emptyText}
      />

      {selectedValues.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="w-full text-xs"
        >
          Effacer tout
        </Button>
      )}
    </div>
  );
}


