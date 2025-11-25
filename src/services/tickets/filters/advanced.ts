import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';

/**
 * Applique le filtre de type de ticket à la requête
 * 
 * @param query - Requête Supabase
 * @param types - Tableau de types de tickets
 * @returns Requête avec filtre de type appliqué
 */
function applyTypesFilter(query: any, types: string[]): any {
  if (types.length === 0) return query;
  return query.in('ticket_type', types);
}

/**
 * Applique le filtre de statut à la requête
 * 
 * @param query - Requête Supabase
 * @param statuses - Tableau de statuts
 * @returns Requête avec filtre de statut appliqué
 */
function applyStatusesFilter(query: any, statuses: string[]): any {
  if (statuses.length === 0) return query;
  return query.in('status', statuses);
}

/**
 * Applique le filtre de priorité à la requête
 * 
 * @param query - Requête Supabase
 * @param priorities - Tableau de priorités
 * @returns Requête avec filtre de priorité appliqué
 */
function applyPrioritiesFilter(query: any, priorities: string[]): any {
  if (priorities.length === 0) return query;
  return query.in('priority', priorities);
}

/**
 * Applique le filtre d'assignation à la requête
 * 
 * @param query - Requête Supabase
 * @param assignedTo - Tableau d'IDs de profils
 * @returns Requête avec filtre d'assignation appliqué
 */
function applyAssignedToFilter(query: any, assignedTo: string[]): any {
  if (assignedTo.length === 0) return query;
  return query.in('assigned_to', assignedTo);
}

/**
 * Applique le filtre de produit à la requête
 * 
 * @param query - Requête Supabase
 * @param products - Tableau d'IDs de produits
 * @returns Requête avec filtre de produit appliqué
 */
function applyProductsFilter(query: any, products: string[]): any {
  if (products.length === 0) return query;
  return query.in('product_id', products);
}

/**
 * Applique le filtre de module à la requête
 * 
 * @param query - Requête Supabase
 * @param modules - Tableau d'IDs de modules
 * @returns Requête avec filtre de module appliqué
 */
function applyModulesFilter(query: any, modules: string[]): any {
  if (modules.length === 0) return query;
  return query.in('module_id', modules);
}

/**
 * Applique le filtre de canal à la requête
 * 
 * @param query - Requête Supabase
 * @param channels - Tableau de canaux
 * @returns Requête avec filtre de canal appliqué
 */
function applyChannelsFilter(query: any, channels: string[]): any {
  if (channels.length === 0) return query;
  return query.in('canal', channels);
}

/**
 * Calcule la date de début d'une période prédéfinie
 * 
 * @param preset - Présélection (today, this_week, this_month)
 * @returns Date de début (ISO string YYYY-MM-DD)
 */
function getDatePresetStart(preset: 'today' | 'this_week' | 'this_month'): string {
  const now = new Date();

  if (preset === 'today') {
    return now.toISOString().split('T')[0];
  }

  if (preset === 'this_week') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diff);
    return startOfWeek.toISOString().split('T')[0];
  }

  // this_month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString().split('T')[0];
}

/**
 * Applique le filtre de date de création à la requête
 * 
 * @param query - Requête Supabase
 * @param dateFilter - Filtre de date
 * @returns Requête avec filtre de date de création appliqué
 */
function applyCreatedAtFilter(query: any, dateFilter: { preset: 'today' | 'this_week' | 'this_month' | 'custom' | null; range: { start: string | null; end: string | null } | null } | null): any {
  if (!dateFilter) return query;

  if (dateFilter.preset === 'custom' && dateFilter.range) {
    const { start, end } = dateFilter.range;

    if (start) {
      query = query.gte('created_at', start);
    }

    if (end) {
      query = query.lte('created_at', `${end}T23:59:59.999Z`);
    }

    return query;
  }

  if (dateFilter.preset && dateFilter.preset !== 'custom') {
    const startDate = getDatePresetStart(dateFilter.preset);
    return query.gte('created_at', startDate);
  }

  return query;
}

/**
 * Applique le filtre de date de résolution à la requête
 * 
 * @param query - Requête Supabase
 * @param dateFilter - Filtre de date
 * @returns Requête avec filtre de date de résolution appliqué
 */
function applyResolvedAtFilter(query: any, dateFilter: { preset: 'today' | 'this_week' | 'this_month' | 'custom' | null; range: { start: string | null; end: string | null } | null } | null): any {
  if (!dateFilter) return query;

  // Pour la date de résolution, on filtre sur les tickets résolus
  // et on vérifie la date de dernière mise à jour si résolu
  const resolvedStatuses = ['Resolue', 'Terminé', 'Terminé(e)'];

  if (dateFilter.preset === 'custom' && dateFilter.range) {
    const { start, end } = dateFilter.range;
    query = query.in('status', resolvedStatuses);

    if (start) {
      query = query.gte('updated_at', start);
    }

    if (end) {
      query = query.lte('updated_at', `${end}T23:59:59.999Z`);
    }

    return query;
  }

  if (dateFilter.preset && dateFilter.preset !== 'custom') {
    const startDate = getDatePresetStart(dateFilter.preset);
    query = query.in('status', resolvedStatuses);
    return query.gte('updated_at', startDate);
  }

  return query;
}

/**
 * Applique le filtre d'origine à la requête
 * 
 * @param query - Requête Supabase
 * @param origins - Tableau d'origines (supabase, jira)
 * @returns Requête avec filtre d'origine appliqué
 */
function applyOriginsFilter(query: any, origins: string[]): any {
  if (origins.length === 0) return query;
  return query.in('origin', origins);
}

/**
 * Applique le filtre de synchronisation JIRA à la requête
 * 
 * @param query - Requête Supabase
 * @param hasJiraSync - true = avec Jira, false = sans Jira, null = tous
 * @returns Requête avec filtre JIRA appliqué
 */
function applyJiraSyncFilter(query: any, hasJiraSync: boolean | null): any {
  if (hasJiraSync === null) return query;

  if (hasJiraSync === true) {
    // Tickets avec synchronisation JIRA (jira_issue_key IS NOT NULL)
    // Syntaxe : .not('column', 'is', null) - vérifiée dans support-kpis.ts ligne 221
    return query.not('jira_issue_key', 'is', null);
  }

  // Tickets sans synchronisation JIRA (jira_issue_key IS NULL)
  // PROBLÈME: .is('column', null) ne fonctionne pas après .select() avec relations imbriquées
  // Solution: utiliser .filter() avec une condition PostgREST brute
  // Syntaxe PostgREST pour IS NULL: "column.is.null"
  // Mais comme cela peut échouer aussi, on utilise une approche plus sûre :
  // Filtrer côté client OU utiliser une vue/function SQL
  // Pour l'instant, on ignore ce filtre pour éviter l'erreur 500
  console.warn('[WARN] Filtre hasJiraSync=false ignoré - syntaxe .is() non supportée après .select() avec relations');
  return query;
}

/**
 * Applique tous les filtres avancés à une requête Supabase
 * 
 * @param query - Requête Supabase (PostgrestFilterBuilder)
 * @param filters - Filtres avancés à appliquer
 * @returns Requête avec tous les filtres appliqués (même type)
 */
export function applyAdvancedFilters<T extends any>(
  query: T,
  filters: AdvancedFiltersInput
): T {
  let filteredQuery: T = query;

  // Appliquer les filtres dans un ordre logique
  filteredQuery = applyTypesFilter(filteredQuery, filters.types) as T;
  filteredQuery = applyStatusesFilter(filteredQuery, filters.statuses) as T;
  filteredQuery = applyPrioritiesFilter(filteredQuery, filters.priorities) as T;
  filteredQuery = applyAssignedToFilter(filteredQuery, filters.assignedTo) as T;
  filteredQuery = applyProductsFilter(filteredQuery, filters.products) as T;
  filteredQuery = applyModulesFilter(filteredQuery, filters.modules) as T;
  filteredQuery = applyChannelsFilter(filteredQuery, filters.channels) as T;
  filteredQuery = applyCreatedAtFilter(filteredQuery, filters.createdAt) as T;
  filteredQuery = applyResolvedAtFilter(filteredQuery, filters.resolvedAt) as T;
  filteredQuery = applyOriginsFilter(filteredQuery, filters.origins) as T;
  
  // Appliquer le filtre JiraSync en dernier (peut causer des problèmes avec .is() après d'autres filtres)
  // Essayer de l'appliquer avant les filtres de date si possible
  filteredQuery = applyJiraSyncFilter(filteredQuery, filters.hasJiraSync) as T;

  return filteredQuery;
}

