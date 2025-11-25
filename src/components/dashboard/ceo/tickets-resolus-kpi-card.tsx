'use client';

import { memo } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import type { TicketFluxData } from '@/types/dashboard';

type TicketsResolusKPICardProps = {
  data: TicketFluxData | null;
};

/**
 * Card KPI pour les tickets résolus
 * 
 * Affiche le nombre de tickets résolus sur la période avec le taux de résolution
 * et la tendance par rapport à la période précédente.
 * 
 * @param data - Données de flux (ouverts, résolus, taux, tendances)
 */
export const TicketsResolusKPICard = memo(function TicketsResolusKPICard({ data }: TicketsResolusKPICardProps) {
  if (!data || !data.trend) {
    return (
      <KPICard
        title="Tickets Résolus"
        value="N/A"
        description="Données non disponibles"
        icon="check-circle-2"
        variant="default"
      />
    );
  }

  const resolvedTrendIsPositive = data.trend.resolvedTrend >= 0; // Plus de résolus = positif

  return (
    <KPICard
      title="Tickets Résolus"
      value={data.resolved}
      description={`Taux: ${data.resolutionRate}%`}
      icon="check-circle-2"
      variant="success"
      subtitle="vs période précédente"
      trend={{
        value: Math.abs(data.trend.resolvedTrend),
        isPositive: resolvedTrendIsPositive,
      }}
    />
  );
});

