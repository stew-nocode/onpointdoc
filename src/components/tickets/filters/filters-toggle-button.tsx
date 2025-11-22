'use client';

import { Filter } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { useFiltersSidebar } from './filters-sidebar-context';

type FiltersToggleButtonProps = {
  className?: string;
};

/**
 * Bouton flottant élégant pour ouvrir la sidebar de filtres
 * 
 * Apparaît uniquement quand la sidebar est fermée
 * Positionné sur le bord gauche de la zone de contenu
 */
export function FiltersToggleButton({ className }: FiltersToggleButtonProps) {
  const { isOpen, open } = useFiltersSidebar();

  /**
   * Ne pas afficher si la sidebar est ouverte
   */
  if (isOpen) return null;

  return (
    <Button
      type="button"
      onClick={open}
      className={cn(
        'fixed top-1/2 h-12 w-10 rounded-r-lg border border-l-0 border-slate-200 bg-white shadow-xl transition-all duration-300 hover:bg-slate-50 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800',
        // Mobile : depuis la gauche (pas de sidebar visible), z-40 pour être au-dessus du contenu
        // Desktop : après la sidebar menu (256px), z-40 pour être au-dessus du contenu
        'left-0 lg:left-64 z-40',
        className
      )}
      aria-label="Ouvrir les filtres"
      title="Ouvrir les filtres"
    >
      <Filter className="h-5 w-5 text-slate-600 transition-transform duration-300 hover:rotate-90 dark:text-slate-400" />
    </Button>
  );
}

