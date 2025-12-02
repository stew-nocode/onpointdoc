import type { Period, CEODashboardData } from '@/types/dashboard';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { calculateMTTR } from './mttr-calculation';
import { getTicketFlux } from './ticket-flux';
import { getWorkloadDistribution } from './workload-distribution';
import { getProductHealth } from './product-health';
import { getOperationalAlerts } from './operational-alerts';
import { getPeriodDates } from './period-utils';

/**
 * Récupère toutes les données du dashboard CEO pour une période donnée
 * 
 * @param period - Type de période
 * @param filters - Filtres optionnels (produits, types, équipes)
 * @param customStartDate - Date de début personnalisée (optionnelle)
 * @param customEndDate - Date de fin personnalisée (optionnelle)
 * @returns Données complètes du dashboard CEO
 */
export async function getCEODashboardData(
  period: Period | string, 
  filters?: Partial<DashboardFiltersInput>,
  customStartDate?: string,
  customEndDate?: string
): Promise<CEODashboardData> {
  const { startDate, endDate } = getPeriodDates(period, customStartDate, customEndDate);

  // Log pour debug (dev uniquement)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getCEODashboardData] Loading data for period:', {
      period,
      startDate,
      endDate,
      filters,
    });
  }

  const [mttr, flux, workload, health, alerts] = await Promise.all([
    calculateMTTR(period, filters, customStartDate, customEndDate),
    getTicketFlux(period, filters, customStartDate, customEndDate),
    getWorkloadDistribution(period, filters, customStartDate, customEndDate),
    getProductHealth(period, filters, customStartDate, customEndDate),
    getOperationalAlerts()
  ]);

  // Log pour debug (dev uniquement)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getCEODashboardData] Data loaded:', {
      period,
      mttr: mttr.global,
      fluxOpened: flux.opened,
      fluxResolved: flux.resolved,
      resolutionRate: flux.resolutionRate,
    });
  }

  return {
    mttr,
    flux,
    workload,
    health,
    alerts,
    period,
    periodStart: startDate,
    periodEnd: endDate
  };
}

