import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period, ProductHealthData } from '@/types/dashboard';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { getPeriodDates, getPreviousPeriodDates } from './period-utils';
import { applyDashboardFilters } from './filter-utils';

/**
 * Calcule la santé des produits (taux de BUGs par produit/module)
 * 
 * @param period - Type de période
 * @param filters - Filtres optionnels (produits, types, équipes)
 * @returns Données de santé (par produit, top modules avec bugs)
 */
export async function getProductHealth(period: Period, filters?: Partial<DashboardFiltersInput>): Promise<ProductHealthData> {
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
    product: { id: string; name: string } | { id: string; name: string }[] | null;
  }>
): ProductHealthData['byProduct'] {
  const productMap = new Map<
    string,
    { productName: string; totalTickets: number; totalBugs: number }
  >();

  tickets.forEach((ticket) => {
    if (!ticket.product_id || !ticket.product) return;
    const product = Array.isArray(ticket.product) ? ticket.product[0] : ticket.product;
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

    let healthStatus: 'good' | 'warning' | 'critical';
    if (bugRate < 20) healthStatus = 'good';
    else if (bugRate < 40) healthStatus = 'warning';
    else healthStatus = 'critical';

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
 * Calcule les top modules avec le plus de bugs
 */
function calculateTopBugModules(
  currentTickets: Array<{
    ticket_type: string;
    module_id: string | null;
    module: { id: string; name: string } | { id: string; name: string }[] | null;
    product: { id: string; name: string } | { id: string; name: string }[] | null;
  }>,
  prevTickets: Array<{ ticket_type: string; module_id: string | null }>
): ProductHealthData['topBugModules'] {
  const moduleMap = new Map<
    string,
    {
      moduleName: string;
      productName: string;
      bugCount: number;
      totalCount: number;
    }
  >();

  currentTickets.forEach((ticket) => {
    if (!ticket.module_id) return;
    const module = ticket.module
      ? Array.isArray(ticket.module)
        ? ticket.module[0]
        : ticket.module
      : null;
    const product = ticket.product
      ? Array.isArray(ticket.product)
        ? ticket.product[0]
        : ticket.product
      : null;
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

  const prevBugCountByModule = new Map<string, number>();
  prevTickets.forEach((ticket) => {
    if (ticket.ticket_type === 'BUG' && ticket.module_id) {
      const count = prevBugCountByModule.get(ticket.module_id) || 0;
      prevBugCountByModule.set(ticket.module_id, count + 1);
    }
  });

  return Array.from(moduleMap.entries())
    .map(([moduleId, data]) => {
      const bugRate = data.totalCount > 0
        ? Math.round((data.bugCount / data.totalCount) * 100)
        : 0;
      const prevBugCount = prevBugCountByModule.get(moduleId) || 0;
      const trend = calculateTrend(data.bugCount, prevBugCount);

      return {
        moduleId,
        moduleName: data.moduleName,
        productName: data.productName,
        bugCount: data.bugCount,
        bugRate,
        trend
      };
    })
    .sort((a, b) => b.bugCount - a.bugCount)
    .slice(0, 10);
}

/**
 * Calcule la tendance
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

