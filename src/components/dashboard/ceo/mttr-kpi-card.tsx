'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { MTTRData, Period } from '@/types/dashboard';

type MTTRKPICardProps = {
  data: MTTRData;
  period: Period; // Période globale pour cohérence (utilisé par React.memo)
};

/**
 * Card KPI pour le MTTR (Mean Time To Resolution)
 * 
 * @param data - Données MTTR (global, par produit, tendance)
 * @param period - Période globale pour cohérence (utilisé par React.memo pour détecter les changements)
 */
export function MTTRKPICard({ data, period: _period }: MTTRKPICardProps) {
  if (!data) {
    return (
      <KPICard
        title="MTTR Global"
        value="N/A"
        description="Données non disponibles"
        icon="clock"
        variant="default"
        subtitle="vs période précédente"
      />
    );
  }

  const trendIsPositive = data.trend <= 0; // Moins de temps = positif

  return (
    <KPICard
      title="MTTR Global"
      value={`${data.global}j`}
      description="Temps moyen de résolution"
      icon="clock"
      variant="info"
      subtitle="vs période précédente"
      trend={
        data.trend !== 0
          ? {
              value: Math.abs(data.trend),
              isPositive: trendIsPositive
            }
          : undefined
      }
    />
  );
}

