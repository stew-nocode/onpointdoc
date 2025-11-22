import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';

/**
 * Ajoute un tableau de valeurs à un paramètre URL
 *
 * @param params - Paramètres URL
 * @param key - Clé du paramètre
 * @param values - Valeurs à ajouter
 */
export function appendArrayParam(
  params: URLSearchParams,
  key: string,
  values: string[]
): void {
  if (values.length > 0) {
    values.forEach((value) => params.append(key, value));
  }
}

/**
 * Ajoute un filtre de date aux paramètres URL
 *
 * @param params - Paramètres URL
 * @param prefix - Préfixe du paramètre (createdAt ou resolvedAt)
 * @param dateFilter - Filtre de date à ajouter
 */
export function appendDateFilterParam(
  params: URLSearchParams,
  prefix: 'createdAt' | 'resolvedAt',
  dateFilter: AdvancedFiltersInput['createdAt']
): void {
  if (!dateFilter) return;

  if (dateFilter.preset) {
    params.set(`${prefix}Preset`, dateFilter.preset);
  }

  if (dateFilter.range) {
    if (dateFilter.range.start) {
      params.set(`${prefix}Start`, dateFilter.range.start);
    }

    if (dateFilter.range.end) {
      params.set(`${prefix}End`, dateFilter.range.end);
    }
  }
}

/**
 * Convertit les filtres avancés en paramètres URL
 *
 * @param filters - Filtres avancés à convertir
 * @returns Paramètres URL (URLSearchParams)
 */
export function filtersToUrlParams(filters: AdvancedFiltersInput): URLSearchParams {
  const params = new URLSearchParams();

  appendArrayParam(params, 'types', filters.types);
  appendArrayParam(params, 'statuses', filters.statuses);
  appendArrayParam(params, 'priorities', filters.priorities);
  appendArrayParam(params, 'assignedTo', filters.assignedTo);
  appendArrayParam(params, 'products', filters.products);
  appendArrayParam(params, 'modules', filters.modules);
  appendArrayParam(params, 'channels', filters.channels);
  appendArrayParam(params, 'origins', filters.origins);

  appendDateFilterParam(params, 'createdAt', filters.createdAt);
  appendDateFilterParam(params, 'resolvedAt', filters.resolvedAt);

  if (filters.hasJiraSync !== null) {
    params.set('hasJiraSync', filters.hasJiraSync ? 'true' : 'false');
  }

  return params;
}

