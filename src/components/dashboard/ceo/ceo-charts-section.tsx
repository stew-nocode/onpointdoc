'use client';

import { Suspense } from 'react';
import { MTTREvolutionChart } from './mttr-evolution-chart';
import { TicketsDistributionChart } from './tickets-distribution-chart';
import type { CEODashboardData } from '@/types/dashboard';
import { AnalyticsCardSkeleton } from '../shared/analytics-card-skeleton';

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
      <Suspense fallback={<AnalyticsCardSkeleton />}>
        <MTTREvolutionChart data={data.mttr} />
      </Suspense>
      <Suspense fallback={<AnalyticsCardSkeleton />}>
        <TicketsDistributionChart data={data.flux} />
      </Suspense>
    </div>
  );
}

