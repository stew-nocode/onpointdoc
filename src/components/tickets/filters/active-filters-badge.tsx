'use client';

import { Button } from '@/ui/button';

type ActiveFiltersBadgeProps = {
  onClearAll: () => void;
};

/**
 * Badge affichant le nombre de filtres actifs avec bouton pour tout effacer
 *
 * @param onClearAll - Callback appelé lors du clic sur "Tout effacer"
 */
export function ActiveFiltersBadge({ onClearAll }: ActiveFiltersBadgeProps) {
  return (
    <div className="border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Filtres actifs
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          Tout effacer
        </Button>
      </div>
    </div>
  );
}

