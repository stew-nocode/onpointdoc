'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { WorkloadData } from '@/types/dashboard';

type WorkloadKPICardProps = {
  data: WorkloadData;
};

/**
 * Card KPI pour la charge de travail
 * 
 * @param data - Données de charge (par équipe, total actif)
 */
export function WorkloadKPICard({ data }: WorkloadKPICardProps) {
  const supportTeam = data.byTeam.find((t) => t.team === 'support');
  const itTeam = data.byTeam.find((t) => t.team === 'it');
  const marketingTeam = data.byTeam.find((t) => t.team === 'marketing');

  return (
    <div className="space-y-4">
      <KPICard
        title="Tickets Actifs"
        value={data.totalActive}
        description="En cours de traitement"
        icon="briefcase"
        variant="default"
      />
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-lg font-semibold">{supportTeam?.activeTickets || 0}</div>
          <div className="text-xs text-slate-500">Support</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{itTeam?.activeTickets || 0}</div>
          <div className="text-xs text-slate-500">IT</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{marketingTeam?.activeTickets || 0}</div>
          <div className="text-xs text-slate-500">Marketing</div>
        </div>
      </div>
    </div>
  );
}

