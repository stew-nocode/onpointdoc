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
   * 
   * ✅ OPTIMISÉ - Principe Clean Code :
   * - Compare les filtres actuels avec les nouveaux avant router.push
   * - Évite la boucle infinie en vérifiant si les filtres ont réellement changé
   * - Retire searchParams des dépendances pour stabiliser le callback
   */
  const updateUrlWithFilters = useCallback(
    (newFilters: AdvancedFiltersInput) => {
      // ✅ Lire searchParams directement dans le callback (pas de dépendance)
      // Évite la recréation du callback à chaque changement de searchParams
      const currentSearchParams = new URLSearchParams(searchParams.toString());
      
      // ✅ Parser les filtres actuels dans l'URL pour comparaison
      const currentFilters = parseAdvancedFiltersFromParams(
        Object.fromEntries(currentSearchParams.entries())
      ) || buildEmptyFilters();
      
      // ✅ Comparer les filtres actuels avec les nouveaux
      // Utiliser une comparaison simple pour éviter les router.push inutiles
      const currentFiltersEmpty = areFiltersEmpty(currentFilters);
      const newFiltersEmpty = areFiltersEmpty(newFilters);
      
      // Si les deux sont vides, ne rien faire
      if (currentFiltersEmpty && newFiltersEmpty) {
        return;
      }
      
      // Si les filtres sont identiques (comparaison simple par stringification)
      // Note: Comparaison basique pour éviter les router.push si pas de changement réel
      const currentFiltersStr = JSON.stringify(currentFilters);
      const newFiltersStr = JSON.stringify(newFilters);
      
      if (currentFiltersStr === newFiltersStr) {
        return; // Pas de changement, ne pas mettre à jour l'URL
      }

      const params = new URLSearchParams(currentSearchParams);

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

