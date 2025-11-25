'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectOptionsProps = {
  options: MultiSelectOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  emptyText?: string;
};

/**
 * Affiche la liste des options dans un filtre multi-select
 *
 * @param options - Options à afficher
 * @param selectedValues - Valeurs actuellement sélectionnées
 * @param onToggle - Callback appelé lors du toggle d'une option
 * @param emptyText - Texte affiché si aucune option
 */
export function MultiSelectOptions({
  options,
  selectedValues,
  onToggle,
  emptyText = 'Aucun résultat'
}: MultiSelectOptionsProps) {
  if (options.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-slate-500">{emptyText}</div>
    );
  }

  return (
    <div className="max-h-[200px] space-y-1 overflow-y-auto">
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
              isSelected && 'bg-slate-100 dark:bg-slate-800'
            )}
          >
            <Check
              className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
            />
            <span className="flex-1 text-left">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}


