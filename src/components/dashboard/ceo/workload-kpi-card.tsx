'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { WorkloadData, Period } from '@/types/dashboard';

type WorkloadKPICardProps = {
  data: WorkloadData;
  period: Period; // Période globale pour cohérence (utilisé par React.memo)
};

/**
 * Card KPI pour la charge de travail
 * 
 * @param data - Données de charge (par équipe, total actif)
 * @param period - Période globale pour cohérence (utilisé par React.memo pour détecter les changements)
 */
export function WorkloadKPICard({ data, period: _period }: WorkloadKPICardProps) {
  if (!data) {
    return (
      <KPICard
        title="Tickets Actifs"
        value="N/A"
        description="Données non disponibles"
        icon="briefcase"
        variant="default"
        subtitle="vs période précédente"
      />
    );
  }

  // Calculer la tendance (pour l'instant, pas de données de période précédente)
  // On affichera 0% si pas de tendance disponible
  const trend = 0; // TODO: Calculer la tendance réelle quand les données seront disponibles

  return (
    <KPICard
      title="Tickets Actifs"
      value={data.totalActive}
      description="En cours de traitement"
      icon="briefcase"
      variant="default"
      subtitle="vs période précédente"
      trend={trend !== 0 ? {
        value: Math.abs(trend),
        isPositive: trend <= 0 // Moins de tickets actifs = positif
      } : undefined}
    />
  );
}

