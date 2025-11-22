'use client';

import { X } from 'lucide-react';
import { Badge } from '@/ui/badge';

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectBadgesProps = {
  selectedValues: string[];
  options: MultiSelectOption[];
  onRemove: (value: string) => void;
};

/**
 * Affiche les badges des valeurs sélectionnées pour un filtre multi-select
 *
 * @param selectedValues - Valeurs sélectionnées
 * @param options - Options disponibles pour afficher les labels
 * @param onRemove - Callback appelé lors de la suppression d'un badge
 */
export function MultiSelectBadges({
  selectedValues,
  options,
  onRemove
}: MultiSelectBadgesProps) {
  if (selectedValues.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedValues.map((value) => {
        const option = options.find((opt) => opt.value === value);

        if (!option) return null;

        return (
          <Badge
            key={value}
            variant="outline"
            className="flex items-center gap-1 px-2 py-0.5 text-xs"
          >
            {option.label}
            <button
              type="button"
              onClick={() => onRemove(value)}
              className="rounded-full hover:bg-slate-300 dark:hover:bg-slate-700"
              aria-label={`Retirer ${option.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}

