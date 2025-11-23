'use client';

import { TopBugsModulesTable } from './top-bugs-modules-table';
import { WorkloadByAgentTable } from './workload-by-agent-table';
import type { CEODashboardData } from '@/types/dashboard';

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
      <TopBugsModulesTable data={data.health.topBugModules} />
      <WorkloadByAgentTable data={data.workload.byAgent} />
    </div>
  );
}

