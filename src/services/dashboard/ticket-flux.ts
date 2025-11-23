import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period, TicketFluxData } from '@/types/dashboard';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { getPeriodDates, getPreviousPeriodDates } from './period-utils';
import { applyDashboardFilters } from './filter-utils';

/**
 * Calcule le flux de tickets (ouverts vs résolus) pour une période
 * 
 * @param period - Type de période
 * @param filters - Filtres optionnels (produits, types, équipes)
 * @returns Données de flux (ouverts, résolus, taux, tendances)
 */
export async function getTicketFlux(period: Period, filters?: Partial<DashboardFiltersInput>): Promise<TicketFluxData> {
  const { startDate, endDate } = getPeriodDates(period);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period);

  const supabase = await createSupabaseServerClient();

  // Tickets ouverts dans la période
  let openedQuery = supabase
    .from('tickets')
    .select('id, product_id, product:products!inner(id, name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  openedQuery = applyDashboardFilters(openedQuery, filters);
  const { data: openedTickets } = await openedQuery;

  // Tickets résolus dans la période
  let resolvedQuery = supabase
    .from('tickets')
    .select('id, product_id, product:products!inner(id, name)')
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
  const resolutionRate = opened > 0 ? Math.round((resolved / opened) * 100) : 0;

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
 * @param resolvedTickets - Tickets résolus
 * @returns Flux par produit
 */
function calculateFluxByProduct(
  openedTickets: Array<{
    product_id: string | null;
    product: { id: string; name: string } | { id: string; name: string }[] | null;
  }>,
  resolvedTickets: Array<{
    product_id: string | null;
    product: { id: string; name: string } | { id: string; name: string }[] | null;
  }>
): TicketFluxData['byProduct'] {
  const productMap = new Map<
    string,
    { productName: string; opened: number; resolved: number }
  >();

  openedTickets.forEach((ticket) => {
    if (!ticket.product_id || !ticket.product) return;
    const product = Array.isArray(ticket.product) ? ticket.product[0] : ticket.product;
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
    if (!ticket.product_id || !ticket.product) return;
    const product = Array.isArray(ticket.product) ? ticket.product[0] : ticket.product;
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
 * Calcule la tendance en pourcentage
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

