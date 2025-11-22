'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FiltersSidebar } from './filters-sidebar';
import { FiltersToggleButton } from './filters-toggle-button';
import { parseAdvancedFiltersFromParams } from '@/lib/validators/advanced-filters';
import { areFiltersEmpty } from '@/lib/validators/advanced-filters';
import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';
import { useFiltersSidebar } from './filters-sidebar-context';
import { filtersToUrlParams } from '@/lib/utils/url-filters-utils';

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

type FiltersSidebarClientProps = {
  users: BasicProfile[];
  products: Product[];
  modules: Module[];
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
 * Composant client pour gérer les filtres avancés et les URL params
 * 
 * Gère :
 * - Lecture des filtres depuis les URL params
 * - Mise à jour des URL params lors du changement de filtres
 * - Synchronisation avec l'URL
 */
export function FiltersSidebarClient({
  users,
  products,
  modules
}: FiltersSidebarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Parse les filtres depuis les URL params
   */
  const parsedFilters = parseAdvancedFiltersFromParams(
    Object.fromEntries(searchParams.entries())
  );

  const [filters, setFilters] = useState<AdvancedFiltersInput>(
    parsedFilters || buildEmptyFilters()
  );

  /**
   * Met à jour les filtres depuis l'URL au changement de params
   */
  useEffect(() => {
    const newFilters = parseAdvancedFiltersFromParams(
      Object.fromEntries(searchParams.entries())
    );

    if (newFilters) {
      setFilters(newFilters);
    } else {
      setFilters(buildEmptyFilters());
    }
  }, [searchParams]);

  /**
   * Met à jour l'URL avec les nouveaux filtres
   */
  const updateUrlWithFilters = useCallback(
    (newFilters: AdvancedFiltersInput) => {
      const params = new URLSearchParams(searchParams.toString());

      // Supprimer tous les paramètres de filtres avancés existants
      const filterKeys = [
        'types',
        'statuses',
        'priorities',
        'assignedTo',
        'products',
        'modules',
        'channels',
        'createdAtPreset',
        'createdAtStart',
        'createdAtEnd',
        'resolvedAtPreset',
        'resolvedAtStart',
        'resolvedAtEnd',
        'origins',
        'hasJiraSync'
      ];

      filterKeys.forEach((key) => params.delete(key));

      // Ajouter les nouveaux filtres s'ils ne sont pas vides
      if (!areFiltersEmpty(newFilters)) {
        const filterParams = filtersToUrlParams(newFilters);
        
        // Pour chaque clé dans filterParams, remplacer ou ajouter
        filterParams.forEach((value, key) => {
          // Si c'est une clé qui peut avoir plusieurs valeurs, on doit utiliser getAll
          const existingValues = params.getAll(key);
          
          // Supprimer les anciennes valeurs et ajouter les nouvelles
          params.delete(key);
          filterParams.getAll(key).forEach((val) => params.append(key, val));
        });
      }

      // Réinitialiser la pagination
      params.delete('offset');

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  /**
   * Gère le changement de filtres
   */
  const handleFiltersChange = useCallback(
    (newFilters: AdvancedFiltersInput) => {
      setFilters(newFilters);
      updateUrlWithFilters(newFilters);
    },
    [updateUrlWithFilters]
  );

  const { isOpen, toggle } = useFiltersSidebar();

  return (
    <>
      <FiltersSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        users={users}
        products={products}
        modules={modules}
        isOpen={isOpen}
        onToggle={toggle}
      />
      <FiltersToggleButton />
    </>
  );
}

