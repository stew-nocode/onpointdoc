import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import type { Period } from '@/types/dashboard';

/**
 * Parse les filtres dashboard depuis les paramètres URL
 * 
 * @param params - Paramètres URL (Record<string, string | string[]>)
 * @returns Filtres dashboard parsés ou null si invalide
 */
export function parseDashboardFiltersFromParams(
  params: Record<string, string | string[] | undefined>
): DashboardFiltersInput | null {
  const periodParam = params.period;
  const period: Period =
    periodParam && typeof periodParam === 'string' && ['week', 'month', 'quarter', 'year'].includes(periodParam)
      ? (periodParam as Period)
      : 'month';

  const products = getArrayParam(params.products);
  const teams = getArrayParam(params.teams);
  const types = getArrayParam(params.types) as ('BUG' | 'REQ' | 'ASSISTANCE')[];

  return {
    period,
    products,
    teams,
    types: types.filter((t) => ['BUG', 'REQ', 'ASSISTANCE'].includes(t))
  };
}

/**
 * Récupère un paramètre array depuis les params URL
 */
function getArrayParam(param: string | string[] | undefined): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  return [param];
}

/**
 * Convertit les filtres dashboard en paramètres URL
 * 
 * @param filters - Filtres dashboard à convertir
 * @returns Paramètres URL (URLSearchParams)
 */
export function dashboardFiltersToUrlParams(filters: DashboardFiltersInput): URLSearchParams {
  const params = new URLSearchParams();

  params.set('period', filters.period);

  filters.products.forEach((productId) => {
    params.append('products', productId);
  });

  filters.teams.forEach((team) => {
    params.append('teams', team);
  });

  filters.types.forEach((type) => {
    params.append('types', type);
  });

  return params;
}

