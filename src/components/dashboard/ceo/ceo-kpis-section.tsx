'use client';

import { MTTRKPICard } from './mttr-kpi-card';
import { FluxKPICard } from './flux-kpi-card';
import { WorkloadKPICard } from './workload-kpi-card';
import { HealthKPICard } from './health-kpi-card';
import type { CEODashboardData } from '@/types/dashboard';

type CEOKPIsSectionProps = {
  data: CEODashboardData;
};

/**
 * Section des 4 KPIs principaux du dashboard CEO
 * 
 * @param data - Données complètes du dashboard
 */
export function CEOKPIsSection({ data }: CEOKPIsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MTTRKPICard data={data.mttr} />
      <FluxKPICard data={data.flux} />
      <WorkloadKPICard data={data.workload} />
      <HealthKPICard data={data.health} />
    </div>
  );
}

