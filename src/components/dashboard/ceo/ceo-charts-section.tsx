'use client';

import { MTTREvolutionChart } from './mttr-evolution-chart';
import { TicketsDistributionChart } from './tickets-distribution-chart';
import type { CEODashboardData } from '@/types/dashboard';

type CEOChartsSectionProps = {
  data: CEODashboardData;
};

/**
 * Section des graphiques stratégiques
 * 
 * @param data - Données complètes du dashboard
 */
export function CEOChartsSection({ data }: CEOChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MTTREvolutionChart data={data.mttr} />
      <TicketsDistributionChart data={data.flux} />
    </div>
  );
}

