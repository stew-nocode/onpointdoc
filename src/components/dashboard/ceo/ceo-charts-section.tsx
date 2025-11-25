'use client';

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { CEODashboardData } from '@/types/dashboard';
import { AnalyticsCardSkeleton } from '../shared/analytics-card-skeleton';

const LazyMTTREvolutionChart = dynamic(
  () => import('./mttr-evolution-chart').then((mod) => ({ default: mod.MTTREvolutionChart })),
  {
    ssr: false,
    suspense: true
  }
);

const LazyTicketsDistributionChart = dynamic(
  () => import('./tickets-distribution-chart').then((mod) => ({ default: mod.TicketsDistributionChart })),
  {
    ssr: false,
    suspense: true
  }
);

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
        <LazyMTTREvolutionChart data={data.mttr} />
      </Suspense>
      <Suspense fallback={<AnalyticsCardSkeleton />}>
        <LazyTicketsDistributionChart data={data.flux} />
      </Suspense>
    </div>
  );
}

