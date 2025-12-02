import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period, TicketFluxData } from '@/types/dashboard';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { getPeriodDates, getPreviousPeriodDates } from './period-utils';
import { applyDashboardFilters } from './filter-utils';
import { calculateTrend } from './utils/trend-calculation';
import { extractProduct, type SupabaseProductRelation } from './utils/product-utils';

/**
 * Calcule le flux de tickets (ouverts vs résolus) pour une période
 * 
 * ⚠️ IMPORTANT : Cette fonction utilise `cookies()` via `createSupabaseServerClient()`,
 * donc elle ne peut PAS utiliser `unstable_cache()`. On utilise uniquement `React.cache()`
 * pour éviter les appels redondants dans le même render tree.
 * 
 * 📊 Taux de Résolution :
 * Le taux de résolution est calculé uniquement sur les tickets ouverts ET résolus dans la période.
 * Cela évite de compter les tickets anciens (ouverts avant la période) qui ont été résolus,
 * ce qui donnerait un taux supérieur à 100% et serait trompeur.
 * 
 * @param period - Type de période
 * @param filters - Filtres optionnels (produits, types, équipes)
 * @returns Données de flux (ouverts, résolus, taux, tendances)
 */
async function getTicketFluxInternal(
  period: Period | string, 
  filters?: Partial<DashboardFiltersInput>,
  customStartDate?: string,
  customEndDate?: string
): Promise<TicketFluxData> {
  const { startDate, endDate } = getPeriodDates(period, customStartDate, customEndDate);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period, customStartDate, customEndDate);

  // Log pour debug (dev uniquement)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getTicketFlux] Loading flux for period:', {
      period,
      startDate,
      endDate,
      prevStart,
      prevEnd,
    });
  }

  const supabase = await createSupabaseServerClient();

  // Tickets ouverts dans la période
  let openedQuery = supabase
    .from('tickets')
    .select('id, product_id, product:products!inner(id, name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  openedQuery = applyDashboardFilters(openedQuery, filters);
  const { data: openedTickets } = await openedQuery;

  // Tickets résolus dans la période (on récupère aussi created_at pour filtrer ceux ouverts dans la période)
  let resolvedQuery = supabase
    .from('tickets')
    .select('id, created_at, product_id, product:products!inner(id, name)')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', startDate)
    .lte('resolved_at', endDate);
  
  resolvedQuery = applyDashboardFilters(resolvedQuery, filters);
  const { data: resolvedTickets } = await resolvedQuery;

  // Période précédente
  let prevOpenedQuery = supabase
    .from('tickets')
    .select('id')
    .gte('created_at', prevStart)
    .lte('created_at', prevEnd);
  
  prevOpenedQuery = applyDashboardFilters(prevOpenedQuery, filters);
  const { data: prevOpenedTickets } = await prevOpenedQuery;

  let prevResolvedQuery = supabase
    .from('tickets')
    .select('id')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', prevStart)
    .lte('resolved_at', prevEnd);
  
  prevResolvedQuery = applyDashboardFilters(prevResolvedQuery, filters);
  const { data: prevResolvedTickets } = await prevResolvedQuery;

  const opened = openedTickets?.length || 0;
  const resolved = resolvedTickets?.length || 0;

  // Log pour debug (dev uniquement)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getTicketFlux] Query results:', {
      period,
      openedCount: opened,
      resolvedCount: resolved,
      openedTicketsLength: openedTickets?.length,
      resolvedTicketsLength: resolvedTickets?.length,
    });
  }

  // Taux de résolution : seulement les tickets ouverts ET résolus dans la période
  // Cela évite de compter les tickets anciens (ouverts avant la période) qui ont été résolus
  const openedAndResolvedInPeriod = (resolvedTickets || []).filter(ticket => {
    const createdDate = new Date(ticket.created_at);
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    return createdDate >= periodStart && createdDate <= periodEnd;
  });
  
  const resolutionRate = opened > 0 
    ? Math.round((openedAndResolvedInPeriod.length / opened) * 100) 
    : 0;

  const openedTrend = calculateTrend(opened, prevOpenedTickets?.length || 0);
  const resolvedTrend = calculateTrend(resolved, prevResolvedTickets?.length || 0);

  const byProduct = calculateFluxByProduct(
    openedTickets || [],
    resolvedTickets || []
  );

  return {
    opened,
    resolved,
    resolutionRate,
    byProduct,
    trend: {
      openedTrend,
      resolvedTrend
    }
  };
}

/**
 * Calcule le flux par produit
 * 
 * @param openedTickets - Tickets ouverts
 * @param resolvedTickets - Tickets résolus (peut inclure created_at pour filtrage)
 * @returns Flux par produit
 */
function calculateFluxByProduct(
  openedTickets: Array<{
    product_id: string | null;
    product: SupabaseProductRelation;
  }>,
  resolvedTickets: Array<{
    product_id: string | null;
    product: SupabaseProductRelation;
    created_at?: string; // Optionnel pour compatibilité avec ancien format
  }>
): TicketFluxData['byProduct'] {
  const productMap = new Map<
    string,
    { productName: string; opened: number; resolved: number }
  >();

  openedTickets.forEach((ticket) => {
    if (!ticket.product_id) return;
    const product = extractProduct(ticket.product);
    if (!product) return;
    
    const key = ticket.product_id;
    if (!productMap.has(key)) {
      productMap.set(key, {
        productName: product.name,
        opened: 0,
        resolved: 0
      });
    }
    productMap.get(key)!.opened++;
  });

  resolvedTickets.forEach((ticket) => {
    if (!ticket.product_id) return;
    const product = extractProduct(ticket.product);
    if (!product) return;
    
    const key = ticket.product_id;
    if (productMap.has(key)) {
      productMap.get(key)!.resolved++;
    }
  });

  return Array.from(productMap.entries()).map(([productId, data]) => ({
    productId,
    productName: data.productName,
    opened: data.opened,
    resolved: data.resolved
  }));
}

/**
 * Version exportée avec React.cache() pour éviter les appels redondants
 * dans le même render tree
 * 
 * ⚠️ NOTE : On n'utilise pas `unstable_cache()` car cette fonction utilise
 * `cookies()` via `createSupabaseServerClient()`, ce qui n'est pas supporté
 * dans les fonctions mises en cache avec `unstable_cache()`.
 */
export const getTicketFlux = cache(getTicketFluxInternal);

