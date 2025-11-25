'use client';

import { memo } from 'react';
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
export const WorkloadKPICard = memo(function WorkloadKPICard({ data }: WorkloadKPICardProps) {
  if (!data) {
    return (
      <KPICard
        title="Tickets Actifs"
        value="N/A"
        description="Données non disponibles"
        icon="briefcase"
        variant="default"
      />
    );
  }

  return (
    <KPICard
      title="Tickets Actifs"
      value={data.totalActive}
      description="En cours de traitement"
      icon="briefcase"
      variant="default"
    />
  );
});

