'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { TaskKPIs } from '@/services/tasks/task-kpis';

type TasksKPISectionProps = {
  kpis: TaskKPIs;
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
 * Section affichant les 4 KPIs pour les tâches
 * Affichée au-dessus du tableau des tâches en grille responsive
 * Client Component car utilise des icônes Lucide (composants React)
 * 
 * Pattern similaire à ActivitiesKPISection pour cohérence
 */
export function TasksKPISection({ kpis, hasProfile }: TasksKPISectionProps) {
  // Déterminer si les tendances sont positives
  // Pour les retards, une diminution est positive
  const todoTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myTasksTodoTrend, false)
    : true;
  const completedTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myTasksCompletedTrend, false)
    : true;
  const overdueTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.tasksOverdueTrend, true) // Diminution = positif
    : true;
  const inProgressTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.myTasksInProgressTrend, false)
    : true;

  return (
    <div className="kpi-grid-responsive gap-4">
      {/* Mes tâches à faire */}
      <div className="w-full">
        <KPICard
          title="Mes tâches à faire"
          value={kpis.myTasksTodo}
          description="Statut : À faire"
          icon="circle"
          variant="secondary"
          subtitle={hasProfile ? "Tâches assignées" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myTasksTodoTrend,
                  isPositive: todoTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.todoData}
        />
      </div>
      
      {/* Mes tâches terminées ce mois */}
      <div className="w-full">
        <KPICard
          title="Mes tâches terminées"
          value={kpis.myTasksCompletedThisMonth}
          description="Terminées ce mois"
          icon="check-circle-2"
          variant="success"
          subtitle={hasProfile ? "vs mois dernier" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myTasksCompletedTrend,
                  isPositive: completedTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.completedData}
        />
      </div>
      
      {/* Tâches en retard */}
      <div className="w-full">
        <KPICard
          title="Tâches en retard"
          value={kpis.tasksOverdue}
          description="Échéance dépassée"
          icon="alert-circle"
          variant="danger"
          subtitle={hasProfile ? "vs semaine dernière" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.tasksOverdueTrend,
                  isPositive: overdueTrendIsPositive // Diminution = positif
                }
              : undefined
          }
          chartData={kpis.chartData?.overdueData}
        />
      </div>
      
      {/* Mes tâches en cours */}
      <div className="w-full">
        <KPICard
          title="Mes tâches en cours"
          value={kpis.myTasksInProgress}
          description="Statut : En cours"
          icon="play-circle"
          variant="info"
          subtitle={hasProfile ? "Tâches assignées" : "Connexion requise"}
          trend={
            kpis.trends
              ? {
                  value: kpis.trends.myTasksInProgressTrend,
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
