'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { MTTRData } from '@/types/dashboard';

type MTTRKPICardProps = {
  data: MTTRData;
};

/**
 * Card KPI pour le MTTR (Mean Time To Resolution)
 * 
 * @param data - Données MTTR (global, par produit, tendance)
 */
export function MTTRKPICard({ data }: MTTRKPICardProps) {
  if (!data) {
    return (
      <KPICard
        title="MTTR Global"
        value="N/A"
        description="Données non disponibles"
        icon="clock"
        variant="default"
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

