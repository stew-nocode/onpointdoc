'use client';

import { useCallback } from 'react';
import { ScrollArea } from '@/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { areDashboardFiltersEmpty, buildDefaultDashboardFilters } from '@/types/dashboard-filters';
import { DashboardFiltersSidebarHeader } from './dashboard-filters-sidebar-header';
import { DashboardFiltersList } from './dashboard-filters-list';
import { ActiveFiltersBadge } from '@/components/tickets/filters/active-filters-badge';

type Product = {
  id: string;
  name: string;
};

type DashboardFiltersSidebarProps = {
  filters: DashboardFiltersInput;
  onFiltersChange: (filters: DashboardFiltersInput) => void;
  products: Product[];
  isOpen?: boolean;
  onToggle?: () => void;
};

/**
 * Sidebar pour les filtres du dashboard CEO
 * 
 * Affiche tous les filtres disponibles dans une sidebar latérale
 * 
 * @param filters - Filtres actuels
 * @param onFiltersChange - Callback lors du changement complet des filtres
 * @param products - Liste des produits disponibles
 * @param isOpen - État d'ouverture de la sidebar
 * @param onToggle - Callback pour basculer l'état
 */
export function DashboardFiltersSidebar({
  filters,
  onFiltersChange,
  products,
  isOpen = true,
  onToggle
}: DashboardFiltersSidebarProps) {
  const hasActiveFilters = !areDashboardFiltersEmpty(filters);

  /**
   * Efface tous les filtres
   */
  const handleClearAll = useCallback(() => {
    onFiltersChange(buildDefaultDashboardFilters());
  }, [onFiltersChange]);

  /**
   * Met à jour une partie des filtres
   */
  const updateFilters = useCallback(
    (updates: Partial<DashboardFiltersInput>) => {
      onFiltersChange({ ...filters, ...updates });
    },
    [filters, onFiltersChange]
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[35] bg-black/50 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-16 h-[calc(100vh-4rem)] border-r border-slate-200 bg-white shadow-lg transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900',
          'left-0 w-full z-[45] lg:left-64 lg:w-64 lg:z-10',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-[-100%]'
        )}
      >
        <div className="flex h-full flex-col">
          <DashboardFiltersSidebarHeader onToggle={onToggle} />

          {hasActiveFilters && <ActiveFiltersBadge onClearAll={handleClearAll} />}

          <ScrollArea className="flex-1">
            <DashboardFiltersList
              filters={filters}
              onFiltersUpdate={updateFilters}
              products={products}
            />
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}

