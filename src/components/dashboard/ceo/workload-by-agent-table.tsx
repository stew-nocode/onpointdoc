'use client';

import { Card, CardContent, CardHeader } from '@/ui/card';
import { Badge } from '@/ui/badge';
import type { WorkloadData } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { WORKLOAD_BY_AGENT_DOCUMENTATION } from '@/components/dashboard/dashboard-documentation-content';

type WorkloadByAgentTableProps = {
  data: WorkloadData['byAgent'];
};

/**
 * Tableau de répartition de la charge par agent
 * 
 * @param data - Liste des agents avec leur charge
 */
export function WorkloadByAgentTable({ data }: WorkloadByAgentTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <SectionTitleWithDoc
            title="Charge par Agent"
            documentation={WORKLOAD_BY_AGENT_DOCUMENTATION}
          />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Aucun agent avec des tickets</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <SectionTitleWithDoc
          title="Charge par Agent"
          documentation={WORKLOAD_BY_AGENT_DOCUMENTATION}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-2">Agent</th>
                <th className="text-left p-2">Équipe</th>
                <th className="text-right p-2">Actifs</th>
                <th className="text-right p-2">Résolus</th>
                <th className="text-right p-2">Charge</th>
              </tr>
            </thead>
            <tbody>
              {data.map((agent) => (
                <WorkloadAgentRow key={agent.agentId} agent={agent} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Ligne du tableau pour un agent
 */
function WorkloadAgentRow({
  agent
}: {
  agent: WorkloadData['byAgent'][0];
}) {
  const workloadColor = getWorkloadColor(agent.workloadPercent);

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
      <td className="p-2 font-medium">{agent.agentName}</td>
      <td className="p-2">
        <Badge variant="outline" className="capitalize">
          {agent.team}
        </Badge>
      </td>
      <td className="p-2 text-right">{agent.activeTickets}</td>
      <td className="p-2 text-right text-slate-600 dark:text-slate-400">
        {agent.resolvedThisPeriod}
      </td>
      <td className="p-2 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', workloadColor)}
              style={{ width: `${agent.workloadPercent}%` }}
            />
          </div>
          <span className={cn('text-xs font-medium', workloadColor)}>
            {agent.workloadPercent}%
          </span>
        </div>
      </td>
    </tr>
  );
}

/**
 * Retourne la couleur selon le pourcentage de charge
 */
function getWorkloadColor(percent: number): string {
  if (percent >= 80) return 'bg-red-500';
  if (percent >= 60) return 'bg-orange-500';
  if (percent >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

