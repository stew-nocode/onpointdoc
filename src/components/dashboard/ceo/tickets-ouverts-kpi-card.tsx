'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { TicketFluxData, Period } from '@/types/dashboard';

type TicketsOuvertsKPICardProps = {
  data: TicketFluxData | null;
  period: Period; // Période globale pour cohérence (utilisé par React.memo)
};

/**
 * Card KPI pour les tickets ouverts
 * 
 * Affiche le nombre de tickets ouverts sur la période avec la tendance
 * par rapport à la période précédente.
 * 
 * @param data - Données de flux (ouverts, résolus, taux, tendances)
 * @param period - Période globale pour cohérence (utilisé par React.memo pour détecter les changements)
 */
export function TicketsOuvertsKPICard({ data, period: _period }: TicketsOuvertsKPICardProps) {
  if (!data || !data.trend) {
    return (
      <KPICard
        title="Tickets Ouverts"
        value="N/A"
        description="Données non disponibles"
        icon="plus-circle"
        variant="default"
        subtitle="vs période précédente"
      />
    );
  }

  const openedTrendIsPositive = data.trend.openedTrend <= 0; // Moins d'ouverts = positif

  return (
    <KPICard
      title="Tickets Ouverts"
      value={data.opened}
      description="Créés cette période"
      icon="plus-circle"
      variant="warning"
      subtitle="vs période précédente"
      trend={{
        value: Math.abs(data.trend.openedTrend),
        isPositive: openedTrendIsPositive,
      }}
    />
  );
}


