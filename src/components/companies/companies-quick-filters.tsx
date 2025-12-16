'use client';

/**
 * Composant de filtres rapides pour les entreprises
 * 
 * Pattern similaire à TasksQuickFilters/ActivitiesQuickFilters pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (afficher et gérer les filtres rapides)
 * - Réutilisation des patterns existants
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/ui/button';
import type { CompanyQuickFilter } from '@/types/company-filters';

type CompaniesQuickFiltersProps = {
  activeFilter: CompanyQuickFilter;
};

/**
 * Filtres rapides disponibles avec leurs labels
 */
const QUICK_FILTERS: Array<{ value: CompanyQuickFilter; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'with_users', label: 'Avec utilisateurs' },
  { value: 'without_users', label: 'Sans utilisateurs' },
  { value: 'with_tickets', label: 'Avec tickets' },
  { value: 'with_open_tickets', label: 'Tickets ouverts' },
  { value: 'with_assistance', label: 'Avec assistance' }
];

/**
 * Composant de filtres rapides pour les entreprises
 * 
 * @param activeFilter - Filtre actuellement actif
 */
export function CompaniesQuickFilters({ activeFilter }: CompaniesQuickFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = useCallback((filter: CompanyQuickFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filter === 'all') {
      params.delete('quick');
    } else {
      params.set('quick', filter);
    }

    // Réinitialiser l'offset lors du changement de filtre
    params.delete('offset');

    const newUrl = params.toString()
      ? `/config/companies?${params.toString()}`
      : '/config/companies';

    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((filter) => (
        <Button
          key={filter.value}
          type="button"
          variant={activeFilter === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange(filter.value)}
          className="text-xs"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
