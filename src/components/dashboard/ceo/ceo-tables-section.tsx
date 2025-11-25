'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { CEODashboardData } from '@/types/dashboard';
import { TableCardSkeleton } from '../shared/table-card-skeleton';

const LazyTopBugsModulesTable = dynamic(
  () => import('./top-bugs-modules-table').then((mod) => ({ default: mod.TopBugsModulesTable })),
  {
    ssr: false,
    suspense: true
  }
);

const LazyWorkloadByAgentTable = dynamic(
  () => import('./workload-by-agent-table').then((mod) => ({ default: mod.WorkloadByAgentTable })),
  {
    ssr: false,
    suspense: true
  }
);

type CEOTablesSectionProps = {
  data: CEODashboardData;
};

/**
 * Section des tableaux de détails
 * 
 * @param data - Données complètes du dashboard
 */
export function CEOTablesSection({ data }: CEOTablesSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Suspense fallback={<TableCardSkeleton />}>
        <LazyTopBugsModulesTable data={data.health.topBugModules} />
      </Suspense>
      <Suspense fallback={<TableCardSkeleton />}>
        <LazyWorkloadByAgentTable data={data.workload.byAgent} />
      </Suspense>
    </div>
  );
}

