import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import type { Period } from '@/types/dashboard';

/**
 * Vérifie si une chaîne représente une année (4 chiffres)
 */
function isYearString(value: string): boolean {
  return /^\d{4}$/.test(value);
}

/**
 * Parse les filtres dashboard depuis les paramètres URL
 * 
 * Accepte les périodes standard (week, month, quarter, year) ou des années spécifiques (ex: "2024")
 * 
 * @param params - Paramètres URL (Record<string, string | string[]>)
 * @returns Filtres dashboard parsés ou null si invalide
 */

export function parseDashboardFiltersFromParams(
  params: Record<string, string | string[] | undefined>
): DashboardFiltersInput | null {
  const periodParam = params.period;
  
  // Accepter les périodes standard OU les années spécifiques (ex: "2024")
  let period: Period | string = 'month'; // Par défaut
  if (periodParam && typeof periodParam === 'string') {
    if (['week', 'month', 'quarter', 'year'].includes(periodParam)) {
      period = periodParam as Period;
    } else if (isYearString(periodParam)) {
      // Année spécifique (ex: "2024")
      period = periodParam;
    }
  }

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

