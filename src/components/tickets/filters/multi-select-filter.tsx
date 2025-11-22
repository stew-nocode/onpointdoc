'use client';

import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { cn } from '@/lib/utils';
import { useMultiSelectFilter } from '@/hooks/filters/use-multi-select-filter';
import { MultiSelectBadges } from './multi-select-badges';
import { MultiSelectPopoverContent } from './multi-select-popover-content';

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectFilterProps = {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  label: string;
  className?: string;
};

/**
 * Composant multi-select réutilisable pour les filtres
 *
 * Affiche :
 * - Un bouton avec le label et le nombre de sélections
 * - Un popover avec recherche et options
 * - Des badges pour les valeurs sélectionnées
 */
export function MultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  emptyText = 'Aucun résultat',
  label,
  className
}: MultiSelectFilterProps) {
  const {
    open,
    setOpen,
    search,
    setSearch,
    filteredOptions,
    toggleValue,
    removeValue,
    clearAll
  } = useMultiSelectFilter({
    options,
    selectedValues,
    onSelectionChange
  });

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
        {selectedValues.length > 0 && (
          <span className="ml-1.5 text-xs text-slate-500">({selectedValues.length})</span>
        )}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-between font-normal',
              !selectedValues.length && 'text-slate-500'
            )}
          >
            <span className="truncate">
              {selectedValues.length === 0
                ? placeholder
                : `${selectedValues.length} sélectionné${selectedValues.length > 1 ? 's' : ''}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <MultiSelectPopoverContent
            searchPlaceholder={searchPlaceholder}
            search={search}
            onSearchChange={setSearch}
            filteredOptions={filteredOptions}
            selectedValues={selectedValues}
            onToggle={toggleValue}
            emptyText={emptyText}
            onClearAll={clearAll}
          />
        </PopoverContent>
      </Popover>

      <MultiSelectBadges
        selectedValues={selectedValues}
        options={options}
        onRemove={removeValue}
      />
    </div>
  );
}

