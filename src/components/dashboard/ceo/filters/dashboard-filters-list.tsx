'use client';

import { Separator } from '@/ui/separator';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import type { Period } from '@/types/dashboard';
import { PeriodFilter } from './period-filter';
import { DashboardProductsFilter } from './dashboard-products-filter';
import { TeamsFilter } from './teams-filter';
import { DashboardTypesFilter } from './dashboard-types-filter';

type Product = {
  id: string;
  name: string;
};

type DashboardFiltersListProps = {
  filters: DashboardFiltersInput;
  onFiltersUpdate: (updates: Partial<DashboardFiltersInput>) => void;
  products: Product[];
};

/**
 * Liste de tous les filtres disponibles dans la sidebar dashboard
 * 
 * @param filters - Filtres actuels
 * @param onFiltersUpdate - Callback lors de la mise à jour
 * @param products - Liste des produits
 */
export function DashboardFiltersList({
  filters,
  onFiltersUpdate,
  products
}: DashboardFiltersListProps) {
  // Valider que period est bien de type Period (et non une année string)
  const periodValue: Period = (['week', 'month', 'quarter', 'year'].includes(filters.period) 
    ? filters.period 
    : 'month') as Period;

  return (
    <div className="space-y-3 p-3">
      <PeriodFilter
        value={periodValue}
        onChange={(period) => onFiltersUpdate({ period })}
      />
      <Separator />
      <DashboardProductsFilter
        products={products}
        selectedProductIds={filters.products}
        onProductIdsChange={(products) => onFiltersUpdate({ products })}
      />
      <Separator />
      <TeamsFilter
        selectedTeams={filters.teams}
        onTeamsChange={(teams) => onFiltersUpdate({ teams })}
      />
      <Separator />
      <DashboardTypesFilter
        selectedTypes={filters.types}
        onTypesChange={(types) => onFiltersUpdate({ types: types as DashboardFiltersInput['types'] })}
      />
    </div>
  );
}

