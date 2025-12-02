'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { TicketFluxData, Period } from '@/types/dashboard';

type TicketsResolusKPICardProps = {
  data: TicketFluxData | null;
  period: Period; // Période globale pour cohérence (utilisé par React.memo)
};

/**
 * Card KPI pour les tickets résolus
 * 
 * Affiche le nombre de tickets résolus sur la période avec le taux de résolution
 * et la tendance par rapport à la période précédente.
 * 
 * @param data - Données de flux (ouverts, résolus, taux, tendances)
 * @param period - Période globale pour cohérence (utilisé par React.memo pour détecter les changements)
 */
export function TicketsResolusKPICard({ data, period: _period }: TicketsResolusKPICardProps) {
  if (!data || !data.trend) {
    return (
      <KPICard
        title="Tickets Résolus"
        value="N/A"
        description="Données non disponibles"
        icon="check-circle-2"
        variant="default"
        subtitle="vs période précédente"
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
}


