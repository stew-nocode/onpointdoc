'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardFiltersSidebar } from './dashboard-filters-sidebar';
import { DashboardFiltersToggleButton } from './dashboard-filters-toggle-button';
import { DashboardFiltersSidebarProvider, useDashboardFiltersSidebar } from './dashboard-filters-sidebar-context';
import { buildDefaultDashboardFilters } from '@/types/dashboard-filters';
import { parseDashboardFiltersFromParams, dashboardFiltersToUrlParams } from '@/lib/utils/dashboard-filters-utils';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';

type Product = {
  id: string;
  name: string;
};

type DashboardFiltersSidebarClientProps = {
  products: Product[];
};

/**
 * Composant client pour gérer les filtres dashboard et les URL params
 * 
 * Gère :
 * - Lecture des filtres depuis les URL params
 * - Mise à jour des URL params lors du changement de filtres
 * - Synchronisation avec l'URL
 */
function DashboardFiltersSidebarClientInner({
  products
}: DashboardFiltersSidebarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Parse les filtres depuis les URL params
   */
  const filters = useMemo<DashboardFiltersInput>(() => {
    const parsed = parseDashboardFiltersFromParams(
      Object.fromEntries(searchParams.entries())
    );
    return parsed || buildDefaultDashboardFilters();
  }, [searchParams]);

  /**
   * Met à jour l'URL avec les nouveaux filtres
   */
  const updateUrlWithFilters = useCallback(
    (newFilters: DashboardFiltersInput) => {
      const params = new URLSearchParams(searchParams.toString());

      // Supprimer tous les paramètres de filtres existants
      const filterKeys = ['period', 'products', 'teams', 'types'];
      filterKeys.forEach((key) => params.delete(key));

      // Ajouter les nouveaux filtres
      const filterParams = dashboardFiltersToUrlParams(newFilters);
      filterParams.forEach((value, key) => {
        params.delete(key);
        filterParams.getAll(key).forEach((val) => params.append(key, val));
      });

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  /**
   * Gère le changement de filtres
   */
  const handleFiltersChange = useCallback(
    (newFilters: DashboardFiltersInput) => {
      updateUrlWithFilters(newFilters);
    },
    [updateUrlWithFilters]
  );

  const { isOpen, toggle } = useDashboardFiltersSidebar();

  return (
    <>
      <DashboardFiltersSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        products={products}
        isOpen={isOpen}
        onToggle={toggle}
      />
      <DashboardFiltersToggleButton />
    </>
  );
}

/**
 * Wrapper avec provider pour la sidebar de filtres dashboard
 * 
 * @param products - Liste des produits disponibles
 */
export function DashboardFiltersSidebarClient({
  products
}: DashboardFiltersSidebarClientProps) {
  return (
    <DashboardFiltersSidebarProvider>
      <DashboardFiltersSidebarClientInner products={products} />
    </DashboardFiltersSidebarProvider>
  );
}

