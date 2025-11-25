'use client';

import { MTTRKPICard } from './mttr-kpi-card';
import { TicketsOuvertsKPICard } from './tickets-ouverts-kpi-card';
import { TicketsResolusKPICard } from './tickets-resolus-kpi-card';
import { WorkloadKPICard } from './workload-kpi-card';
import { HealthKPICard } from './health-kpi-card';
import type { CEODashboardData } from '@/types/dashboard';

type CEOKPIsSectionProps = {
  data: CEODashboardData;
};

/**
 * Section des KPIs principaux du dashboard CEO
 * 
 * Chaque KPI est un widget indépendant qui peut être activé/désactivé individuellement.
 * Utilise Flexbox pour une répartition égale automatique.
 * 
 * @param data - Données complètes du dashboard
 */
export function CEOKPIsSection({ data }: CEOKPIsSectionProps) {
  return (
    <div className="kpi-grid-responsive gap-4">
      <MTTRKPICard data={data.mttr} />
      <TicketsOuvertsKPICard data={data.flux} />
      <TicketsResolusKPICard data={data.flux} />
      <WorkloadKPICard data={data.workload} />
      <HealthKPICard data={data.health} />
    </div>
  );
}

