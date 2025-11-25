'use client';

import { MultiSelectFilter } from '@/components/tickets/filters/multi-select-filter';

type Product = {
  id: string;
  name: string;
};

type DashboardProductsFilterProps = {
  products: Product[];
  selectedProductIds: string[];
  onProductIdsChange: (productIds: string[]) => void;
};

/**
 * Construit les options de produits
 */
function buildProductOptions(products: Product[]): Array<{ value: string; label: string }> {
  return products.map((product) => ({
    value: product.id,
    label: product.name
  }));
}

/**
 * Filtre produits pour le dashboard
 * 
 * @param products - Liste des produits disponibles
 * @param selectedProductIds - IDs des produits sélectionnés
 * @param onProductIdsChange - Callback lors du changement
 */
export function DashboardProductsFilter({
  products,
  selectedProductIds,
  onProductIdsChange
}: DashboardProductsFilterProps) {
  const options = buildProductOptions(products);

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedProductIds}
      onSelectionChange={onProductIdsChange}
      placeholder="Tous les produits"
      searchPlaceholder="Rechercher un produit..."
      emptyText="Aucun produit trouvé"
      label="Produits"
    />
  );
}

