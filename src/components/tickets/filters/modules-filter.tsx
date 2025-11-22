'use client';

import { MultiSelectFilter } from './multi-select-filter';
import { useMemo } from 'react';

type Module = {
  id: string;
  name: string;
  product_id: string | null;
};

type ModulesFilterProps = {
  modules: Module[];
  selectedModuleIds: string[];
  onModuleIdsChange: (moduleIds: string[]) => void;
  selectedProductIds?: string[];
};

/**
 * Filtre les modules selon les produits sélectionnés
 * 
 * @param modules - Liste des modules
 * @param selectedProductIds - IDs des produits sélectionnés
 * @returns Modules filtrés
 */
function filterModulesByProducts(modules: Module[], selectedProductIds?: string[]): Module[] {
  if (!selectedProductIds || selectedProductIds.length === 0) {
    return modules;
  }

  return modules.filter((module) => module.product_id && selectedProductIds.includes(module.product_id));
}

/**
 * Construit les options de modules pour le filtre
 * 
 * @param modules - Liste des modules
 * @returns Liste des options de modules
 */
function buildModuleOptions(modules: Module[]): Array<{ value: string; label: string }> {
  return modules.map((module) => ({
    value: module.id,
    label: module.name
  }));
}

/**
 * Composant pour filtrer par module (dynamique selon produit)
 * 
 * @param modules - Liste des modules disponibles
 * @param selectedModuleIds - IDs des modules sélectionnés
 * @param onModuleIdsChange - Callback appelé lors du changement de sélection
 * @param selectedProductIds - IDs des produits sélectionnés (pour filtrer les modules)
 */
export function ModulesFilter({
  modules,
  selectedModuleIds,
  onModuleIdsChange,
  selectedProductIds
}: ModulesFilterProps) {
  const filteredModules = useMemo(
    () => filterModulesByProducts(modules, selectedProductIds),
    [modules, selectedProductIds]
  );

  const options = buildModuleOptions(filteredModules);

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedModuleIds}
      onSelectionChange={onModuleIdsChange}
      placeholder={
        selectedProductIds && selectedProductIds.length > 0
          ? 'Tous les modules du produit'
          : 'Tous les modules'
      }
      searchPlaceholder="Rechercher un module..."
      emptyText="Aucun module trouvé"
      label="Module"
    />
  );
}


