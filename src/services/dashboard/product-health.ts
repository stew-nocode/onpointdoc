import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period, ProductHealthData } from '@/types/dashboard';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { getPeriodDates, getPreviousPeriodDates } from './period-utils';
import { applyDashboardFilters } from './filter-utils';
import { calculateTrend } from './utils/trend-calculation';
import { extractProduct, extractModule, type SupabaseProductRelation, type SupabaseModuleRelation } from './utils/product-utils';
import { HEALTH_THRESHOLD_GOOD, HEALTH_THRESHOLD_WARNING } from './constants/health-constants';
import { MAX_TOP_BUG_MODULES } from './constants/limits';

/**
 * Calcule la santé des produits (taux de BUGs par produit/module)
 * 
 * ⚠️ IMPORTANT : Cette fonction utilise `cookies()` via `createSupabaseServerClient()`,
 * donc elle ne peut PAS utiliser `unstable_cache()`. On utilise uniquement `React.cache()`
 * pour éviter les appels redondants dans le même render tree.
 * 
 * @param period - Type de période
 * @param filters - Filtres optionnels (produits, types, équipes)
 * @returns Données de santé (par produit, top modules avec bugs)
 */
async function getProductHealthInternal(period: Period, filters?: Partial<DashboardFiltersInput>): Promise<ProductHealthData> {
  const { startDate, endDate } = getPeriodDates(period);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period);

  const supabase = await createSupabaseServerClient();

  // Tous les tickets de la période
  let allTicketsQuery = supabase
    .from('tickets')
    .select('id, ticket_type, product_id, product:products!left(id, name), module_id, module:modules!left(id, name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  allTicketsQuery = applyDashboardFilters(allTicketsQuery, filters);
  const { data: allTickets } = await allTicketsQuery;

  // Tickets de la période précédente (pour tendance)
  let prevTicketsQuery = supabase
    .from('tickets')
    .select('id, ticket_type, module_id')
    .gte('created_at', prevStart)
    .lte('created_at', prevEnd);
  
  prevTicketsQuery = applyDashboardFilters(prevTicketsQuery, filters);
  const { data: prevTickets } = await prevTicketsQuery;

  const byProduct = calculateHealthByProduct(allTickets || []);
  const topBugModules = calculateTopBugModules(
    allTickets || [],
    prevTickets || []
  );

  return {
    byProduct,
    topBugModules
  };
}

/**
 * Calcule la santé par produit
 */
function calculateHealthByProduct(
  tickets: Array<{
    ticket_type: string;
    product_id: string | null;
    product: SupabaseProductRelation;
  }>
): ProductHealthData['byProduct'] {
  const productMap = new Map<
    string,
    { productName: string; totalTickets: number; totalBugs: number }
  >();

  tickets.forEach((ticket) => {
    if (!ticket.product_id) return;
    const product = extractProduct(ticket.product);
    if (!product) return;
    
    const key = ticket.product_id;
    if (!productMap.has(key)) {
      productMap.set(key, {
        productName: product.name,
        totalTickets: 0,
        totalBugs: 0
      });
    }
    const data = productMap.get(key)!;
    data.totalTickets++;
    if (ticket.ticket_type === 'BUG') {
      data.totalBugs++;
    }
  });

  return Array.from(productMap.entries()).map(([productId, data]) => {
    const bugRate = data.totalTickets > 0
      ? Math.round((data.totalBugs / data.totalTickets) * 100)
      : 0;

    const healthStatus = calculateHealthStatus(bugRate);

    return {
      productId,
      productName: data.productName,
      bugRate,
      totalTickets: data.totalTickets,
      totalBugs: data.totalBugs,
      healthStatus
    };
  });
}

/**
 * Calcule le statut de santé d'un produit selon son taux de bugs
 */
function calculateHealthStatus(bugRate: number): 'good' | 'warning' | 'critical' {
  if (bugRate < HEALTH_THRESHOLD_GOOD) return 'good';
  if (bugRate < HEALTH_THRESHOLD_WARNING) return 'warning';
  return 'critical';
}

/**
 * Calcule les top modules avec le plus de bugs
 */
function calculateTopBugModules(
  currentTickets: Array<{
    ticket_type: string;
    module_id: string | null;
    module: SupabaseModuleRelation;
    product: SupabaseProductRelation;
  }>,
  prevTickets: Array<{ ticket_type: string; module_id: string | null }>
): ProductHealthData['topBugModules'] {
  const moduleMap = buildModuleMap(currentTickets);
  const prevBugCountByModule = buildPreviousBugCountMap(prevTickets);

  return Array.from(moduleMap.entries())
    .map(([moduleId, data]) => {
      const bugRate = data.totalCount > 0
        ? Math.round((data.bugCount / data.totalCount) * 100)
        : 0;
      const prevBugCount = prevBugCountByModule.get(moduleId) || 0;
      const trendValue = calculateTrend(data.bugCount, prevBugCount);

      return {
        moduleId,
        moduleName: data.moduleName,
        productName: data.productName,
        bugCount: data.bugCount,
        bugRate,
        trend: trendValue
      };
    })
    .sort((a, b) => b.bugCount - a.bugCount)
    .slice(0, MAX_TOP_BUG_MODULES);
}

/**
 * Construit la map des modules à partir des tickets actuels
 */
function buildModuleMap(
  tickets: Array<{
    ticket_type: string;
    module_id: string | null;
    module: SupabaseModuleRelation;
    product: SupabaseProductRelation;
  }>
): Map<string, {
  moduleName: string;
  productName: string;
  bugCount: number;
  totalCount: number;
}> {
  const moduleMap = new Map<
    string,
    {
      moduleName: string;
      productName: string;
      bugCount: number;
      totalCount: number;
    }
  >();

  tickets.forEach((ticket) => {
    if (!ticket.module_id) return;
    
    const module = extractModule(ticket.module);
    const product = extractProduct(ticket.product);
    if (!module || !product) return;
    
    const key = ticket.module_id;
    if (!moduleMap.has(key)) {
      moduleMap.set(key, {
        moduleName: module.name,
        productName: product.name,
        bugCount: 0,
        totalCount: 0
      });
    }
    const data = moduleMap.get(key)!;
    data.totalCount++;
    if (ticket.ticket_type === 'BUG') {
      data.bugCount++;
    }
  });

  return moduleMap;
}

/**
 * Construit la map des bugs par module pour la période précédente
 */
function buildPreviousBugCountMap(
  tickets: Array<{ ticket_type: string; module_id: string | null }>
): Map<string, number> {
  const bugCountByModule = new Map<string, number>();
  
  tickets.forEach((ticket) => {
    if (ticket.ticket_type === 'BUG' && ticket.module_id) {
      const count = bugCountByModule.get(ticket.module_id) || 0;
      bugCountByModule.set(ticket.module_id, count + 1);
    }
  });
  
  return bugCountByModule;
}

/**
 * Version exportée avec React.cache() pour éviter les appels redondants
 * dans le même render tree
 * 
 * ⚠️ NOTE : On n'utilise pas `unstable_cache()` car cette fonction utilise
 * `cookies()` via `createSupabaseServerClient()`, ce qui n'est pas supporté
 * dans les fonctions mises en cache avec `unstable_cache()`.
 */
export const getProductHealth = cache(getProductHealthInternal);
