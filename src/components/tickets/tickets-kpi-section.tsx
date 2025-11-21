'use client';

import { Clock, MessageSquare, CheckCircle2, GitBranch } from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import type { SupportTicketKPIs } from '@/services/tickets/support-kpis';

type TicketsKPISectionProps = {
  kpis: SupportTicketKPIs;
  hasProfile: boolean; // Pour masquer les KPIs personnels si non connecté
};

/**
 * Section affichant les 4 KPIs pour les agents support
 * Affichée au-dessus du tableau des tickets en flex horizontal
 * Client Component car utilise des icônes Lucide (composants React)
 */
export function TicketsKPISection({ kpis, hasProfile }: TicketsKPISectionProps) {
  // Déterminer si les tendances sont positives (moins de retard = positif, plus de résolutions = positif, etc.)
  const overdueTrendIsPositive = kpis.trends ? kpis.trends.myTicketsOverdueTrend <= 0 : true;
  const assistanceTrendIsPositive = kpis.trends ? kpis.trends.assistanceCountTrend >= 0 : true;
  const resolvedTrendIsPositive = kpis.trends ? kpis.trends.myTicketsResolvedTrend >= 0 : true;
  const transferredTrendIsPositive = kpis.trends ? kpis.trends.bugAndReqTransferredTrend >= 0 : true;

  return (
    <div className="flex flex-wrap gap-4">
      {/* Mes tickets en retard */}
      <div className="flex-1 min-w-[200px]">
        <KPICard
          title="Mes tickets en retard"
          value={kpis.myTicketsOverdue}
          description="Dates dépassées"
          icon={Clock}
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
      <div className="flex-1 min-w-[200px]">
        <KPICard
          title="ASSISTANCE ce mois"
          value={kpis.assistanceCountThisMonth}
          description="Tickets ASSISTANCE créés"
          icon={MessageSquare}
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
      <div className="flex-1 min-w-[200px]">
        <KPICard
          title="Mes tickets résolus"
          value={kpis.myTicketsResolvedThisMonth}
          description="Résolutions ce mois"
          icon={CheckCircle2}
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
      <div className="flex-1 min-w-[200px]">
        <KPICard
          title="BUG et REQ transférés"
          value={kpis.bugAndReqTransferred}
          description="Transférés vers JIRA"
          icon={GitBranch}
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

