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
async function getProductHealthInternal(
  period: Period | string, 
  filters?: Partial<DashboardFiltersInput>,
  customStartDate?: string,
  customEndDate?: string
): Promise<ProductHealthData> {
  const { startDate, endDate } = getPeriodDates(period, customStartDate, customEndDate);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period, customStartDate, customEndDate);

  const supabase = await createSupabaseServerClient();

  // Tous les tickets BUG de la période (avec priority, resolved_at, status)
  let allTicketsQuery = supabase
    .from('tickets')
    .select('id, ticket_type, priority, resolved_at, status, created_at, product_id, product:products!left(id, name), module_id, module:modules!left(id, name)')
    .eq('ticket_type', 'BUG')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  allTicketsQuery = applyDashboardFilters(allTicketsQuery, filters);
  const { data: allTickets } = await allTicketsQuery;

  // Tickets résolus dans la période (pour calculer les bugs résolus créés ET résolus dans la période)
  let resolvedTicketsQuery = supabase
    .from('tickets')
    .select('id, ticket_type, priority, resolved_at, status, created_at, module_id, module:modules!left(id, name)')
    .eq('ticket_type', 'BUG')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', startDate)
    .lte('resolved_at', endDate)
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  resolvedTicketsQuery = applyDashboardFilters(resolvedTicketsQuery, filters);
  const { data: resolvedTickets } = await resolvedTicketsQuery;

  // Tickets de la période précédente (pour tendance)
  let prevTicketsQuery = supabase
    .from('tickets')
    .select('id, ticket_type, priority, resolved_at, status, created_at, module_id')
    .eq('ticket_type', 'BUG')
    .gte('created_at', prevStart)
    .lte('created_at', prevEnd);
  
  prevTicketsQuery = applyDashboardFilters(prevTicketsQuery, filters);
  const { data: prevTickets } = await prevTicketsQuery;

  // Tickets résolus de la période précédente (créés ET résolus)
  let prevResolvedTicketsQuery = supabase
    .from('tickets')
    .select('id, ticket_type, priority, resolved_at, status, created_at, module_id')
    .eq('ticket_type', 'BUG')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', prevStart)
    .lte('resolved_at', prevEnd)
    .gte('created_at', prevStart)
    .lte('created_at', prevEnd);
  
  prevResolvedTicketsQuery = applyDashboardFilters(prevResolvedTicketsQuery, filters);
  const { data: prevResolvedTickets } = await prevResolvedTicketsQuery;

  // Récupérer tous les tickets (pas seulement BUG) pour calculer byProduct
  let allTicketsForProductQuery = supabase
    .from('tickets')
    .select('id, ticket_type, product_id, product:products!left(id, name), module_id, module:modules!left(id, name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  allTicketsForProductQuery = applyDashboardFilters(allTicketsForProductQuery, filters);
  const { data: allTicketsForProduct } = await allTicketsForProductQuery;

  const byProduct = calculateHealthByProduct(allTicketsForProduct || []);
  const moduleBugsMetrics = calculateModuleBugsMetrics(
    allTickets || [],
    resolvedTickets || [],
    prevTickets || [],
    prevResolvedTickets || [],
    startDate,
    endDate
  );

  return {
    byProduct,
    topBugModules: moduleBugsMetrics
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
 * Calcule les métriques de bugs par module pour la période filtrée
 */
function calculateModuleBugsMetrics(
  currentBugs: Array<{
    id: string;
    priority: string | null;
    resolved_at: string | null;
    status: string;
    created_at: string;
    module_id: string | null;
    module: SupabaseModuleRelation;
  }>,
  resolvedBugsInPeriod: Array<{
    id: string;
    priority: string | null;
    resolved_at: string | null;
    status: string;
    created_at: string;
    module_id: string | null;
    module: SupabaseModuleRelation;
  }>,
  prevBugs: Array<{
    priority: string | null;
    resolved_at: string | null;
    status: string;
    created_at: string;
    module_id: string | null;
  }>,
  prevResolvedBugs: Array<{
    priority: string | null;
    resolved_at: string | null;
    status: string;
    created_at: string;
    module_id: string | null;
  }>,
  startDate: string,
  endDate: string
): ProductHealthData['topBugModules'] {
  const RESOLVED_STATUSES = ['Resolue', 'Résolu', 'Terminé', 'Terminé(e)', 'Termine', 'Done', 'Closed'];
  
  // Construire la map des modules actuels
  const moduleMap = new Map<string, {
    moduleName: string;
    bugsSignales: number;
    bugsCritiques: number;
    bugsOuverts: number;
    bugsResolus: number;
  }>();

  // Traiter les bugs de la période actuelle
  currentBugs.forEach((bug) => {
    if (!bug.module_id) return;

    const ticketModule = extractModule(bug.module);
    if (!ticketModule) return;

    const key = bug.module_id;
    if (!moduleMap.has(key)) {
      moduleMap.set(key, {
        moduleName: ticketModule.name,
        bugsSignales: 0,
        bugsCritiques: 0,
        bugsOuverts: 0,
        bugsResolus: 0
      });
    }

    const data = moduleMap.get(key)!;
    data.bugsSignales++;
    
    if (bug.priority === 'Critical') {
      data.bugsCritiques++;
    }
    
    // Les bugs ouverts seront calculés après : bugs signalés - bugs résolus
  });

  // Traiter les bugs résolus (créés ET résolus dans la période)
  resolvedBugsInPeriod.forEach((bug) => {
    if (!bug.module_id) return;

    const ticketModule = extractModule(bug.module);
    if (!ticketModule) return;

    const key = bug.module_id;
    if (moduleMap.has(key)) {
      moduleMap.get(key)!.bugsResolus++;
    }
  });

  // Calculer les bugs ouverts : bugs signalés - bugs résolus
  moduleMap.forEach((data) => {
    data.bugsOuverts = data.bugsSignales - data.bugsResolus;
  });

  // Construire la map de la période précédente
  // IMPORTANT: Initialiser avec tous les modules de moduleMap pour que les tendances
  // soient calculées correctement même si un module n'a pas de bugs dans la période précédente
  const prevModuleMap = new Map<string, {
    bugsSignales: number;
    bugsCritiques: number;
    bugsOuverts: number;
    bugsResolus: number;
  }>();

  // Initialiser prevModuleMap avec tous les modules de moduleMap
  moduleMap.forEach((data, moduleId) => {
    prevModuleMap.set(moduleId, {
      bugsSignales: 0,
      bugsCritiques: 0,
      bugsOuverts: 0,
      bugsResolus: 0
    });
  });

  prevBugs.forEach((bug) => {
    if (!bug.module_id) return;
    
    const key = bug.module_id;
    if (!prevModuleMap.has(key)) {
      prevModuleMap.set(key, {
        bugsSignales: 0,
        bugsCritiques: 0,
        bugsOuverts: 0,
        bugsResolus: 0
      });
    }
    
    const data = prevModuleMap.get(key)!;
    data.bugsSignales++;
    
    if (bug.priority === 'Critical') {
      data.bugsCritiques++;
    }
    
    // Les bugs ouverts seront calculés après : bugs signalés - bugs résolus
  });

  prevResolvedBugs.forEach((bug) => {
    if (!bug.module_id) return;
    
    const key = bug.module_id;
    if (prevModuleMap.has(key)) {
      prevModuleMap.get(key)!.bugsResolus++;
    }
  });

  // Calculer les bugs ouverts de la période précédente
  prevModuleMap.forEach((data) => {
    data.bugsOuverts = data.bugsSignales - data.bugsResolus;
  });

  // Construire le résultat avec toutes les métriques
  return Array.from(moduleMap.entries()).map(([moduleId, data]) => {
    const prev = prevModuleMap.get(moduleId) || {
      bugsSignales: 0,
      bugsCritiques: 0,
      bugsOuverts: 0,
      bugsResolus: 0
    };

    // Calculer les pourcentages et tendances
    // Plafonner à 100% maximum pour éviter les incohérences (un taux ne peut pas dépasser 100%)
    const criticalRate = data.bugsSignales > 0
      ? Math.min(Math.round((data.bugsCritiques / data.bugsSignales) * 100), 100)
      : 0;

    const resolutionRate = data.bugsSignales > 0
      ? Math.min(Math.round((data.bugsResolus / data.bugsSignales) * 100), 100)
      : 0;

    const prevCriticalRate = prev.bugsSignales > 0
      ? Math.min((prev.bugsCritiques / prev.bugsSignales) * 100, 100)
      : 0;

    const prevResolutionRate = prev.bugsSignales > 0
      ? Math.min((prev.bugsResolus / prev.bugsSignales) * 100, 100)
      : 0;

    return {
      moduleId,
      moduleName: data.moduleName,
      productName: '', // Pas de produit dans le nouveau tableau
      bugCount: data.bugsSignales,
      bugRate: resolutionRate, // Taux de résolution (pour compatibilité avec l'ancien type)
      trend: calculateTrend(data.bugsSignales, prev.bugsSignales),
      // Nouvelles métriques
      bugsSignales: data.bugsSignales,
      bugsCritiques: data.bugsCritiques,
      criticalRate,
      bugsOuverts: data.bugsOuverts,
      bugsResolus: data.bugsResolus,
      resolutionRate,
      trends: {
        bugsSignales: calculateTrend(data.bugsSignales, prev.bugsSignales),
        criticalRate: calculateTrend(criticalRate, prevCriticalRate),
        bugsOuverts: calculateTrend(data.bugsOuverts, prev.bugsOuverts),
        bugsResolus: calculateTrend(data.bugsResolus, prev.bugsResolus),
        resolutionRate: calculateTrend(resolutionRate, prevResolutionRate)
      }
    };
  });
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

    const ticketModule = extractModule(ticket.module);
    const product = extractProduct(ticket.product);
    if (!ticketModule || !product) return;

    const key = ticket.module_id;
    if (!moduleMap.has(key)) {
      moduleMap.set(key, {
        moduleName: ticketModule.name,
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
