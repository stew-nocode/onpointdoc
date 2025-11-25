'use client';

import { MTTRKPICard } from './mttr-kpi-card';
import { TicketsOuvertsKPICard } from './tickets-ouverts-kpi-card';
import { TicketsResolusKPICard } from './tickets-resolus-kpi-card';
import { WorkloadKPICard } from './workload-kpi-card';
import { HealthKPICard } from './health-kpi-card';
import type { CEODashboardData } from '@/types/dashboard';
import { KPISuspense } from './kpi-section';

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
      <KPISuspense>
        <MTTRKPISlot data={data} />
      </KPISuspense>
      <KPISuspense>
        <TicketsOpenSlot data={data} />
      </KPISuspense>
      <KPISuspense>
        <TicketsResolvedSlot data={data} />
      </KPISuspense>
      <KPISuspense>
        <WorkloadSlot data={data} />
      </KPISuspense>
      <KPISuspense>
        <HealthSlot data={data} />
      </KPISuspense>
    </div>
  );
}

function MTTRKPISlot({ data }: CEOKPIsSectionProps) {
  return <MTTRKPICard data={data.mttr} />;
}

function TicketsOpenSlot({ data }: CEOKPIsSectionProps) {
  return <TicketsOuvertsKPICard data={data.flux} />;
}

function TicketsResolvedSlot({ data }: CEOKPIsSectionProps) {
  return <TicketsResolusKPICard data={data.flux} />;
}

function WorkloadSlot({ data }: CEOKPIsSectionProps) {
  return <WorkloadKPICard data={data.workload} />;
}

function HealthSlot({ data }: CEOKPIsSectionProps) {
  return <HealthKPICard data={data.health} />;
}

