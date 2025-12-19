'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { SupportTicketKPIs } from '@/services/tickets/support-kpis';

type TicketsKPISectionProps = {
  kpis: SupportTicketKPIs;
  hasProfile: boolean; // Pour masquer les KPIs personnels si non connecté
};

/**
 * Détermine si une tendance est positive selon son type
 * 
 * @param trendValue - Valeur de la tendance
 * @param isDecreasingPositive - Si true, une diminution est positive (ex: retards)
 * @returns true si la tendance est positive
 */
function isTrendPositive(trendValue: number, isDecreasingPositive = false): boolean {
  return isDecreasingPositive ? trendValue <= 0 : trendValue >= 0;
}

/**
 * Section affichant les 5 KPIs pour les agents support
 * Affichée au-dessus du tableau des tickets en grille responsive
 * Client Component car utilise des icônes Lucide (composants React)
 */
export function TicketsKPISection({ kpis, hasProfile }: TicketsKPISectionProps) {
  // Déterminer si les tendances sont positives (moins de retard = positif, plus de résolutions = positif, etc.)
  const overdueTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myTicketsOverdueTrend, true)
    : true;
  const assistanceTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.assistanceCountTrend, false)
    : true;
  const resolvedTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myTicketsResolvedTrend, false)
    : true;
  const transferredTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.bugAndReqTransferredTrend, false)
    : true;
  const interactionTimeTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.totalInteractionTimeTrend, false)
    : true;

  // Formater le temps d'interaction en heures et minutes
  const formatInteractionTime = (minutes: number): string => {
    if (minutes === 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="kpi-grid-responsive gap-4">
      {/* Mes tickets en retard */}
      <div className="w-full">
        <KPICard
          title="Mes tickets en retard"
          value={kpis.myTicketsOverdue}
          description="Dates dépassées"
          icon="clock"
          variant="danger"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myTicketsOverdueTrend,
                  isPositive: overdueTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.overdueData}
        />
      </div>
      
      {/* Mes ASSISTANCE ce mois */}
      <div className="w-full">
        <KPICard
          title="Mes ASSISTANCE ce mois"
          value={kpis.assistanceCountThisMonth}
          description="Créées ou assignées"
          icon="message-square"
          variant="info"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.assistanceCountTrend,
                  isPositive: assistanceTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.assistanceData}
        />
      </div>
      
      {/* Mes tickets résolus ce mois */}
      <div className="w-full">
        <KPICard
          title="Mes tickets résolus"
          value={kpis.myTicketsResolvedThisMonth}
          description="Résolutions ce mois"
          icon="check-circle-2"
          variant="success"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myTicketsResolvedTrend,
                  isPositive: resolvedTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.resolvedData}
        />
      </div>
      
      {/* Mes BUG et REQ transférés */}
      <div className="w-full">
        <KPICard
          title="Mes BUG et REQ transférés"
          value={kpis.bugAndReqTransferred}
          description="Créés ou assignés"
          icon="git-branch"
          variant="default"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.bugAndReqTransferredTrend,
                  isPositive: transferredTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.transferredData}
        />
      </div>
      
      {/* Temps d'interaction */}
      <div className="w-full">
        <KPICard
          title="Temps d'interaction"
          value={formatInteractionTime(kpis.totalInteractionTime)}
          description="Cumul du temps passé"
          icon="clock"
          variant="warning"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.totalInteractionTimeTrend,
                  isPositive: interactionTimeTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.interactionTimeData}
        />
      </div>
    </div>
  );
}

