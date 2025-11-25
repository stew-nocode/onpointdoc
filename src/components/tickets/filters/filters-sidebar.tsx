'use client';

import { useCallback } from 'react';
import { ScrollArea } from '@/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';
import { areFiltersEmpty } from '@/lib/validators/advanced-filters';
import { FiltersSidebarHeader } from './filters-sidebar-header';
import { ActiveFiltersBadge } from './active-filters-badge';
import { FiltersList } from './filters-list';

type BasicProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Product = {
  id: string;
  name: string;
};

type Module = {
  id: string;
  name: string;
  product_id: string | null;
};

type FiltersSidebarProps = {
  filters: AdvancedFiltersInput;
  onFiltersChange: (filters: AdvancedFiltersInput) => void;
  users: BasicProfile[];
  products: Product[];
  modules: Module[];
  isOpen?: boolean;
  onToggle?: () => void;
};

/**
 * Construit des filtres vides par défaut
 * 
 * @returns Filtres vides
 */
function buildEmptyFilters(): AdvancedFiltersInput {
  return {
    types: [],
    statuses: [],
    priorities: [],
    assignedTo: [],
    products: [],
    modules: [],
    channels: [],
    createdAt: null,
    resolvedAt: null,
    origins: [],
    hasJiraSync: null
  };
}

/**
 * Composant sidebar pour les filtres avancés de tickets
 * 
 * Affiche tous les filtres disponibles dans une sidebar latérale
 */
export function FiltersSidebar({
  filters,
  onFiltersChange,
  users,
  products,
  modules,
  isOpen = true,
  onToggle
}: FiltersSidebarProps) {
  const hasActiveFilters = !areFiltersEmpty(filters);

  /**
   * Efface tous les filtres
   */
  const handleClearAll = useCallback(() => {
    onFiltersChange(buildEmptyFilters());
  }, [onFiltersChange]);

  /**
   * Met à jour une partie des filtres
   */
  const updateFilters = useCallback(
    (updates: Partial<AdvancedFiltersInput>) => {
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
          <FiltersSidebarHeader onToggle={onToggle} />

          {hasActiveFilters && <ActiveFiltersBadge onClearAll={handleClearAll} />}

          <ScrollArea className="flex-1">
            <FiltersList
              filters={filters}
              onFiltersUpdate={updateFilters}
              users={users}
              products={products}
              modules={modules}
            />
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}

