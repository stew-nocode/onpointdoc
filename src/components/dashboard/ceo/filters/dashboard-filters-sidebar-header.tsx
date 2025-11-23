'use client';

import { Filter, X } from 'lucide-react';
import { Button } from '@/ui/button';

type DashboardFiltersSidebarHeaderProps = {
  onToggle?: () => void;
};

/**
 * Header de la sidebar de filtres dashboard
 * 
 * Affiche le titre et le bouton de fermeture
 * 
 * @param onToggle - Callback appelé lors de la fermeture
 */
export function DashboardFiltersSidebarHeader({ onToggle }: DashboardFiltersSidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Filtres Dashboard
        </h2>
      </div>
      {onToggle && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Fermer les filtres"
          title="Fermer les filtres"
        >
          <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>
      )}
    </div>
  );
}

