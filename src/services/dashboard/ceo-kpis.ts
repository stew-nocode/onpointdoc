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
 * @returns Données complètes du dashboard CEO
 */
export async function getCEODashboardData(period: Period, filters?: Partial<DashboardFiltersInput>): Promise<CEODashboardData> {
  const { startDate, endDate } = getPeriodDates(period);

  const [mttr, flux, workload, health, alerts] = await Promise.all([
    calculateMTTR(period, filters),
    getTicketFlux(period, filters),
    getWorkloadDistribution(period, filters),
    getProductHealth(period, filters),
    getOperationalAlerts()
  ]);

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

