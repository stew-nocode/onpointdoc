'use client';

import { MultiSelectFilter } from './multi-select-filter';

type Product = {
  id: string;
  name: string;
};

type ProductsFilterProps = {
  products: Product[];
  selectedProductIds: string[];
  onProductIdsChange: (productIds: string[]) => void;
};

/**
 * Construit les options de produits pour le filtre
 * 
 * @param products - Liste des produits
 * @returns Liste des options de produits
 */
function buildProductOptions(products: Product[]): Array<{ value: string; label: string }> {
  return products.map((product) => ({
    value: product.id,
    label: product.name
  }));
}

/**
 * Composant pour filtrer par produit
 * 
 * @param products - Liste des produits disponibles
 * @param selectedProductIds - IDs des produits sélectionnés
 * @param onProductIdsChange - Callback appelé lors du changement de sélection
 */
export function ProductsFilter({
  products,
  selectedProductIds,
  onProductIdsChange
}: ProductsFilterProps) {
  const options = buildProductOptions(products);

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedProductIds}
      onSelectionChange={onProductIdsChange}
      placeholder="Tous les produits"
      searchPlaceholder="Rechercher un produit..."
      emptyText="Aucun produit trouvé"
      label="Produit"
    />
  );
}

