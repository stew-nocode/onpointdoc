'use client';

import { Separator } from '@/ui/separator';
import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';
import { TypesFilter } from './types-filter';
import { StatusesFilter } from './statuses-filter';
import { PrioritiesFilter } from './priorities-filter';
import { AssignedToFilter } from './assigned-to-filter';
import { ProductsFilter } from './products-filter';
import { ModulesFilter } from './modules-filter';
import { ChannelsFilter } from './channels-filter';
import { DateFilterComponent } from './date-filter';
import { OriginsFilter } from './origins-filter';
import { JiraSyncFilter } from './jira-sync-filter';

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

type FiltersListProps = {
  filters: AdvancedFiltersInput;
  onFiltersUpdate: (updates: Partial<AdvancedFiltersInput>) => void;
  users: BasicProfile[];
  products: Product[];
  modules: Module[];
};

/**
 * Liste de tous les filtres disponibles dans la sidebar
 *
 * @param filters - Filtres actuels
 * @param onFiltersUpdate - Callback appelé lors de la mise à jour d'un filtre
 * @param users - Liste des utilisateurs pour le filtre "Assigné à"
 * @param products - Liste des produits pour le filtre "Produit"
 * @param modules - Liste des modules pour le filtre "Module"
 */
export function FiltersList({
  filters,
  onFiltersUpdate,
  users,
  products,
  modules
}: FiltersListProps) {
  return (
    <div className="space-y-3 p-3">
      <TypesFilter
        selectedTypes={filters.types}
        onTypesChange={(types) => onFiltersUpdate({ types: types as typeof filters.types })}
      />
      <Separator />
      <StatusesFilter
        selectedStatuses={filters.statuses}
        onStatusesChange={(statuses) => onFiltersUpdate({ statuses })}
      />
      <Separator />
      <PrioritiesFilter
        selectedPriorities={filters.priorities}
        onPrioritiesChange={(priorities) =>
          onFiltersUpdate({ priorities: priorities as typeof filters.priorities })
        }
      />
      <Separator />
      <AssignedToFilter
        users={users}
        selectedUserIds={filters.assignedTo}
        onUserIdsChange={(assignedTo) => onFiltersUpdate({ assignedTo })}
      />
      <Separator />
      <ProductsFilter
        products={products}
        selectedProductIds={filters.products}
        onProductIdsChange={(products) => onFiltersUpdate({ products })}
      />
      <Separator />
      <ModulesFilter
        modules={modules}
        selectedModuleIds={filters.modules}
        onModuleIdsChange={(modules) => onFiltersUpdate({ modules })}
        selectedProductIds={filters.products}
      />
      <Separator />
      <ChannelsFilter
        selectedChannels={filters.channels}
        onChannelsChange={(channels) =>
          onFiltersUpdate({ channels: channels as typeof filters.channels })
        }
      />
      <Separator />
      <DateFilterComponent
        label="Date de création"
        dateFilter={filters.createdAt}
        onDateFilterChange={(createdAt) => onFiltersUpdate({ createdAt })}
      />
      <Separator />
      <DateFilterComponent
        label="Date de résolution"
        dateFilter={filters.resolvedAt}
        onDateFilterChange={(resolvedAt) => onFiltersUpdate({ resolvedAt })}
      />
      <Separator />
      <OriginsFilter
        selectedOrigins={filters.origins}
        onOriginsChange={(origins) =>
          onFiltersUpdate({ origins: origins as typeof filters.origins })
        }
      />
      <Separator />
      <JiraSyncFilter
        hasJiraSync={filters.hasJiraSync}
        onJiraSyncChange={(hasJiraSync) => onFiltersUpdate({ hasJiraSync })}
      />
    </div>
  );
}

