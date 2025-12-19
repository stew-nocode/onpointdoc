'use client';

import { Separator } from '@/ui/separator';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
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
 * Note: Le filtre de période a été retiré de la sidebar pour éviter les conflits.
 * Les filtres de période sont maintenant uniquement gérés par les sélecteurs en haut du dashboard :
 * - YearSelector (à gauche) pour sélectionner une année
 * - CustomPeriodSelector (à droite) pour une plage de dates personnalisée
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
  return (
    <div className="space-y-3 p-3">
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

