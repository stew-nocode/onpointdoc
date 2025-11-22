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
 * Section affichant les 4 KPIs pour les agents support
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      
      {/* Nombre d'ASSISTANCE ce mois */}
      <div className="w-full">
        <KPICard
          title="ASSISTANCE ce mois"
          value={kpis.assistanceCountThisMonth}
          description="Tickets ASSISTANCE créés"
          icon="message-square"
          variant="info"
          subtitle="vs mois dernier"
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
      
      {/* BUG et REQ transférés */}
      <div className="w-full">
        <KPICard
          title="BUG et REQ transférés"
          value={kpis.bugAndReqTransferred}
          description="Transférés vers JIRA"
          icon="git-branch"
          variant="default"
          subtitle="vs mois dernier"
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
    </div>
  );
}

