'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { TicketFluxData } from '@/types/dashboard';

type FluxKPICardProps = {
  data: TicketFluxData;
};

/**
 * Card KPI pour le flux de tickets (ouverts vs résolus)
 * 
 * @param data - Données de flux (ouverts, résolus, taux, tendances)
 */
export function FluxKPICard({ data }: FluxKPICardProps) {
  const openedTrendIsPositive = data.trend.openedTrend <= 0; // Moins d'ouverts = positif
  const resolvedTrendIsPositive = data.trend.resolvedTrend >= 0; // Plus de résolus = positif

  return (
    <div className="grid grid-cols-2 gap-4">
      <KPICard
        title="Tickets Ouverts"
        value={data.opened}
        description="Créés cette période"
        icon="plus-circle"
        variant="warning"
        subtitle="vs période précédente"
        trend={{
          value: Math.abs(data.trend.openedTrend),
          isPositive: openedTrendIsPositive
        }}
      />
      <KPICard
        title="Tickets Résolus"
        value={data.resolved}
        description={`Taux: ${data.resolutionRate}%`}
        icon="check-circle-2"
        variant="success"
        subtitle="vs période précédente"
        trend={{
          value: Math.abs(data.trend.resolvedTrend),
          isPositive: resolvedTrendIsPositive
        }}
      />
    </div>
  );
}

