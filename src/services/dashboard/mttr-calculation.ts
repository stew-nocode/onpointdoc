import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period, MTTRData } from '@/types/dashboard';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { getPeriodDates, getPreviousPeriodDates } from './period-utils';
import { applyDashboardFilters } from './filter-utils';

/**
 * Calcule le MTTR (Mean Time To Resolution) pour une période donnée
 * 
 * @param period - Type de période
 * @param filters - Filtres optionnels (produits, types, équipes)
 * @returns Données MTTR (global, par produit, par type, tendance)
 */
export async function calculateMTTR(period: Period, filters?: Partial<DashboardFiltersInput>): Promise<MTTRData> {
  const { startDate, endDate } = getPeriodDates(period);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period);

  const supabase = await createSupabaseServerClient();

  // Tickets résolus dans la période
  let resolvedQuery = supabase
    .from('tickets')
    .select('id, created_at, resolved_at, ticket_type, product_id, product:products!inner(id, name)')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', startDate)
    .lte('resolved_at', endDate);
  
  resolvedQuery = applyDashboardFilters(resolvedQuery, filters);
  const { data: resolvedTickets } = await resolvedQuery;

  // Tickets résolus période précédente (pour tendance)
  let prevResolvedQuery = supabase
    .from('tickets')
    .select('id, created_at, resolved_at')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', prevStart)
    .lte('resolved_at', prevEnd);
  
  prevResolvedQuery = applyDashboardFilters(prevResolvedQuery, filters);
  const { data: prevResolvedTickets } = await prevResolvedQuery;

  const globalMTTR = calculateAverageMTTR(resolvedTickets || []);
  const prevGlobalMTTR = calculateAverageMTTR(prevResolvedTickets || []);
  const trend = calculateTrend(globalMTTR, prevGlobalMTTR);

  const byProduct = calculateMTTRByProduct(resolvedTickets || []);
  const byType = calculateMTTRByType(resolvedTickets || []);

  return {
    global: globalMTTR,
    byProduct,
    byType,
    trend
  };
}

/**
 * Calcule le MTTR moyen à partir d'une liste de tickets
 * 
 * @param tickets - Liste de tickets avec created_at et resolved_at
 * @returns MTTR en jours (arrondi à 1 décimale)
 */
function calculateAverageMTTR(
  tickets: Array<{ created_at: string; resolved_at: string | null }>
): number {
  if (tickets.length === 0) return 0;

  const totalDays = tickets.reduce((sum, ticket) => {
    if (!ticket.resolved_at) return sum;
    const created = new Date(ticket.created_at);
    const resolved = new Date(ticket.resolved_at);
    const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round((totalDays / tickets.length) * 10) / 10;
}

/**
 * Calcule le MTTR par produit
 * 
 * @param tickets - Liste de tickets avec product_id et product
 * @returns MTTR par produit
 */
function calculateMTTRByProduct(
  tickets: Array<{
    created_at: string;
    resolved_at: string | null;
    product_id: string | null;
    product: { id: string; name: string } | { id: string; name: string }[] | null;
  }>
): MTTRData['byProduct'] {
  const byProductMap = new Map<string, Array<{ created_at: string; resolved_at: string | null }>>();

  tickets.forEach((ticket) => {
    if (!ticket.product_id || !ticket.product) return;
    const product = Array.isArray(ticket.product) ? ticket.product[0] : ticket.product;
    if (!product) return;
    const key = ticket.product_id;
    if (!byProductMap.has(key)) {
      byProductMap.set(key, []);
    }
    byProductMap.get(key)!.push({
      created_at: ticket.created_at,
      resolved_at: ticket.resolved_at
    });
  });

  return Array.from(byProductMap.entries()).map(([productId, productTickets]) => {
    const ticket = tickets.find((t) => t.product_id === productId);
    const product = ticket?.product
      ? Array.isArray(ticket.product)
        ? ticket.product[0]
        : ticket.product
      : null;
    return {
      productId,
      productName: product?.name || 'Non défini',
      mttr: calculateAverageMTTR(productTickets)
    };
  });
}

/**
 * Calcule le MTTR par type de ticket
 * 
 * @param tickets - Liste de tickets avec ticket_type
 * @returns MTTR par type
 */
function calculateMTTRByType(
  tickets: Array<{
    created_at: string;
    resolved_at: string | null;
    ticket_type: string;
  }>
): MTTRData['byType'] {
  const byTypeMap = new Map<
    string,
    Array<{ created_at: string; resolved_at: string | null }>
  >();

  tickets.forEach((ticket) => {
    const type = ticket.ticket_type;
    if (!byTypeMap.has(type)) {
      byTypeMap.set(type, []);
    }
    byTypeMap.get(type)!.push({
      created_at: ticket.created_at,
      resolved_at: ticket.resolved_at
    });
  });

  return Array.from(byTypeMap.entries())
    .filter(([type]) => ['BUG', 'REQ', 'ASSISTANCE'].includes(type))
    .map(([type, typeTickets]) => ({
      type: type as 'BUG' | 'REQ' | 'ASSISTANCE',
      mttr: calculateAverageMTTR(typeTickets)
    }));
}

/**
 * Calcule la tendance en pourcentage
 * 
 * @param current - Valeur actuelle
 * @param previous - Valeur précédente
 * @returns Pourcentage de variation
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

