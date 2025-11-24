'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import type { Period, UnifiedDashboardData, DashboardRole, DashboardConfig } from '@/types/dashboard';
import { getDefaultDashboardConfig } from '@/services/dashboard/default-config';
import { filterAlertsByRole } from '@/lib/utils/role-filters';
import { CEOKPIsSection } from './ceo/ceo-kpis-section';
import { CEOChartsSection } from './ceo/ceo-charts-section';
import { CEOTablesSection } from './ceo/ceo-tables-section';
import { OperationalAlertsSection } from './ceo/operational-alerts-section';
import { PeriodSelector } from './ceo/period-selector';
import { Loader2 } from 'lucide-react';
import { useRealtimeDashboardData } from '@/hooks/dashboard/use-realtime-dashboard-data';
import { fetchUnifiedDashboardData } from '@/services/dashboard/fetchers';

type UnifiedDashboardProps = {
  role: DashboardRole;
  initialData: UnifiedDashboardData;
  initialPeriod: Period;
  teamId?: string;
  agentId?: string;
  config?: DashboardConfig; // Config passée en props (optionnelle)
};

/**
 * Dashboard unifié avec visibilité conditionnelle selon le rôle
 * 
 * Affiche différentes sections selon le rôle de l'utilisateur :
 * - Direction : KPIs stratégiques globaux + équipes
 * - Manager : KPIs et graphiques de l'équipe
 * - Agent : KPIs personnels et graphiques individuels
 * 
 * @param role - Rôle de l'utilisateur
 * @param initialData - Données initiales chargées côté serveur
 * @param initialPeriod - Période initiale
 * @param teamId - ID de l'équipe (pour managers)
 * @param agentId - ID de l'agent (pour agents)
 */
export function UnifiedDashboard({
  role,
  initialData,
  initialPeriod,
  teamId,
  agentId,
  config: configProp
}: UnifiedDashboardProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const searchParams = useSearchParams();
  const serializedFilters = useMemo(() => searchParams.toString(), [searchParams]);

  const {
    data: dashboardData,
    error: dashboardError,
    isValidating,
    mutate: mutateDashboard
  } = useSWR(
    ['dashboard-data', period, serializedFilters],
    () => fetchUnifiedDashboardData({ period, serializedFilters }),
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      revalidateOnMount: false
    }
  );

  const baseDashboardData = dashboardData ?? initialData;

  // Utiliser la config passée en props (chargée côté serveur depuis la DB)
  // Fallback sur les defaults si pas de config custom
  const config = configProp || baseDashboardData.config || getDefaultDashboardConfig(role, teamId, agentId);

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod);
  }, []);

  useRealtimeDashboardData({
    period,
    onDataChange: () => {
      mutateDashboard();
    }
  });

  // Filtrer les alertes selon le rôle
  const filteredAlerts = filterAlertsByRole(baseDashboardData.alerts, role);

  const isLoading = isValidating && !dashboardData;
  const error = dashboardError ? dashboardError.message : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-3" />}
        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Section KPIs Stratégiques (Direction uniquement) */}
      {config.visibleSections.strategicKPIs && baseDashboardData.strategic && (
        <CEOKPIsSection data={baseDashboardData.strategic} />
      )}

      {/* Section KPIs Équipe (Manager uniquement) */}
      {config.visibleSections.teamKPIs && baseDashboardData.team && (
        <div>
          {/* TODO: Créer TeamKPIsSection */}
          <p className="text-sm text-slate-500">KPIs Équipe - À implémenter</p>
        </div>
      )}

      {/* Section KPIs Personnels (Agent uniquement) */}
      {config.visibleSections.personalKPIs && baseDashboardData.personal && (
        <div>
          {/* TODO: Créer PersonalKPIsSection */}
          <p className="text-sm text-slate-500">KPIs Personnels - À implémenter</p>
        </div>
      )}

      {/* Section Graphiques Stratégiques (Direction) */}
      {config.visibleSections.strategicCharts && baseDashboardData.strategic && (
        <CEOChartsSection data={baseDashboardData.strategic} />
      )}

      {/* Section Graphiques Équipe (Manager + Direction) */}
      {config.visibleSections.teamCharts && baseDashboardData.team && (
        <div>
          {/* TODO: Créer TeamChartsSection */}
          <p className="text-sm text-slate-500">Graphiques Équipe - À implémenter</p>
        </div>
      )}

      {/* Section Graphiques Personnels (Agent) */}
      {config.visibleSections.personalCharts && baseDashboardData.personal && (
        <div>
          {/* TODO: Créer PersonalChartsSection */}
          <p className="text-sm text-slate-500">Graphiques Personnels - À implémenter</p>
        </div>
      )}

      {/* Section Tables Stratégiques (Direction) */}
      {config.visibleSections.strategicTables && baseDashboardData.strategic && (
        <CEOTablesSection data={baseDashboardData.strategic} />
      )}

      {/* Section Tables Équipe (Manager + Direction) */}
      {config.visibleSections.teamTables && baseDashboardData.team && (
        <div>
          {/* TODO: Créer TeamTablesSection */}
          <p className="text-sm text-slate-500">Tables Équipe - À implémenter</p>
        </div>
      )}

      {/* Section Alertes (Tous les rôles, filtrées) */}
      {config.visibleSections.alerts && filteredAlerts.length > 0 && (
        <OperationalAlertsSection alerts={filteredAlerts} />
      )}
    </div>
  );
}

