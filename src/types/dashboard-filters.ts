import type { Period } from './dashboard';

/**
 * Filtres pour le dashboard CEO
 */
export type DashboardFiltersInput = {
  period: Period | string; // Période standard ou année spécifique (ex: "2024")
  products: string[]; // IDs des produits sélectionnés
  teams: string[]; // ['support', 'it', 'marketing']
  types: ('BUG' | 'REQ' | 'ASSISTANCE')[]; // Types de tickets
};

/**
 * Construit des filtres par défaut
 * 
 * @returns Filtres par défaut (tous les produits, toutes les équipes, tous les types)
 */
export function buildDefaultDashboardFilters(): DashboardFiltersInput {
  return {
    period: 'month',
    products: [],
    teams: [],
    types: []
  };
}

/**
 * Vérifie si les filtres sont vides (tous à leur valeur par défaut)
 * 
 * @param filters - Filtres à vérifier
 * @returns true si les filtres sont vides
 */
export function areDashboardFiltersEmpty(filters: DashboardFiltersInput): boolean {
  return (
    filters.products.length === 0 &&
    filters.teams.length === 0 &&
    filters.types.length === 0
  );
}

