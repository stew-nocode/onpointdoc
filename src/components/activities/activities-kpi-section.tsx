'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { ActivityKPIs } from '@/services/activities/activity-kpis';

type ActivitiesKPISectionProps = {
  kpis: ActivityKPIs;
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
 * Section affichant les 4 KPIs pour les activités
 * Affichée au-dessus du tableau des activités en grille responsive
 * Client Component car utilise des icônes Lucide (composants React)
 * 
 * Pattern similaire à TicketsKPISection pour cohérence
 */
export function ActivitiesKPISection({ kpis, hasProfile }: ActivitiesKPISectionProps) {
  // Déterminer si les tendances sont positives
  const plannedTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myActivitiesPlannedTrend, false)
    : true;
  const completedTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myActivitiesCompletedTrend, false)
    : true;
  const upcomingTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.activitiesUpcomingTrend, false)
    : true;
  const inProgressTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myActivitiesInProgressTrend, false)
    : true;

  return (
    <div className="kpi-grid-responsive gap-4">
      {/* Mes activités planifiées ce mois */}
      <div className="w-full">
        <KPICard
          title="Mes activités planifiées"
          value={kpis.myActivitiesPlannedThisMonth}
          description="Planifiées ce mois"
          icon="calendar"
          variant="info"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myActivitiesPlannedTrend,
                  isPositive: plannedTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.plannedData}
        />
      </div>
      
      {/* Mes activités terminées ce mois */}
      <div className="w-full">
        <KPICard
          title="Mes activités terminées"
          value={kpis.myActivitiesCompletedThisMonth}
          description="Terminées ce mois"
          icon="check-circle-2"
          variant="success"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myActivitiesCompletedTrend,
                  isPositive: completedTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.completedData}
        />
      </div>
      
      {/* Activités à venir cette semaine */}
      <div className="w-full">
        <KPICard
          title="Activités à venir"
          value={kpis.activitiesUpcomingThisWeek}
          description="Cette semaine"
          icon="calendar-days"
          variant="warning"
          subtitle={hasProfile ? "vs semaine dernière" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.activitiesUpcomingTrend,
                  isPositive: upcomingTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.upcomingData}
        />
      </div>
      
      {/* Mes activités en cours aujourd'hui */}
      <div className="w-full">
        <KPICard
          title="Mes activités en cours"
          value={kpis.myActivitiesInProgressToday}
          description="En cours aujourd'hui"
          icon="play-circle"
          variant="default"
          subtitle={hasProfile ? "vs hier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myActivitiesInProgressTrend,
                  isPositive: inProgressTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.inProgressData}
        />
      </div>
    </div>
  );
}
