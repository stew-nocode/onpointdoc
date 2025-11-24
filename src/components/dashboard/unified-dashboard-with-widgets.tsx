'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import type { Period, UnifiedDashboardData } from '@/types/dashboard';
import type { DashboardRole, UserDashboardConfig } from '@/types/dashboard-widgets';
import { filterAlertsByRole } from '@/lib/utils/role-filters';
import { DashboardWidgetGrid } from './widgets';
import { PeriodSelector } from './ceo/period-selector';
import { WidgetPreferencesDialog } from './user/widget-preferences-dialog';
import { Loader2 } from 'lucide-react';
import { useRealtimeDashboardData } from '@/hooks/dashboard/use-realtime-dashboard-data';
import { useRealtimeWidgetConfig } from '@/hooks/dashboard/use-realtime-widget-config';
import { fetchUnifiedDashboardData, fetchDashboardWidgetConfig } from '@/services/dashboard/fetchers';

type UnifiedDashboardWithWidgetsProps = {
  role: DashboardRole;
  profileId: string;
  initialData: UnifiedDashboardData;
  initialPeriod: Period;
  initialWidgetConfig: UserDashboardConfig;
};

/**
 * Dashboard unifié utilisant le système de widgets
 * 
 * Charge la configuration des widgets depuis la DB et affiche uniquement
 * les widgets visibles pour l'utilisateur (affectés au rôle - masqués par l'utilisateur)
 * 
 * @param role - Rôle de l'utilisateur
 * @param profileId - ID du profil utilisateur
 * @param initialData - Données initiales chargées côté serveur
 * @param initialPeriod - Période initiale
 * @param initialWidgetConfig - Configuration initiale des widgets (chargée côté serveur)
 */
export function UnifiedDashboardWithWidgets({
  role,
  profileId,
  initialData,
  initialPeriod,
  initialWidgetConfig,
}: UnifiedDashboardWithWidgetsProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const searchParams = useSearchParams();
  const serializedFilters = useMemo(() => searchParams.toString(), [searchParams]);

  const {
    data: dashboardData,
    error: dashboardError,
    isValidating: isDashboardValidating,
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

  const {
    data: widgetConfig,
    mutate: mutateWidgetConfig
  } = useSWR(
    ['dashboard-widget-config', profileId, role],
    () => fetchDashboardWidgetConfig({ profileId, role }),
    {
      fallbackData: initialWidgetConfig,
      revalidateOnFocus: false,
      revalidateOnMount: false
    }
  );

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod);
  }, []);

  const dashboardRefreshTimeout = useRef<number | null>(null);
  const widgetConfigRefreshTimeout = useRef<number | null>(null);

  const scheduleDashboardRefresh = useCallback(() => {
    if (dashboardRefreshTimeout.current !== null) {
      return;
    }
    dashboardRefreshTimeout.current = window.setTimeout(() => {
      mutateDashboard();
      dashboardRefreshTimeout.current = null;
    }, 500);
  }, [mutateDashboard]);

  const scheduleWidgetConfigRefresh = useCallback(() => {
    if (widgetConfigRefreshTimeout.current !== null) {
      return;
    }
    widgetConfigRefreshTimeout.current = window.setTimeout(() => {
      mutateWidgetConfig();
      widgetConfigRefreshTimeout.current = null;
    }, 500);
  }, [mutateWidgetConfig]);

  useEffect(() => {
    return () => {
      if (dashboardRefreshTimeout.current !== null) {
        clearTimeout(dashboardRefreshTimeout.current);
      }
      if (widgetConfigRefreshTimeout.current !== null) {
        clearTimeout(widgetConfigRefreshTimeout.current);
      }
    };
  }, []);

  const stableOnDataChange = useCallback(() => {
    scheduleDashboardRefresh();
  }, [scheduleDashboardRefresh]);

  const stableOnConfigChange = useCallback(() => {
    scheduleWidgetConfigRefresh();
  }, [scheduleWidgetConfigRefresh]);

  // Écouter les changements temps réel des données
  useRealtimeDashboardData({
    period,
    onDataChange: stableOnDataChange,
  });

  // Écouter les changements temps réel de la configuration des widgets
  useRealtimeWidgetConfig({
    profileId,
    role,
    onConfigChange: stableOnConfigChange,
  });

  const baseDashboardData = dashboardData ?? initialData;

  // Filtrer les alertes selon le rôle (mémorisé pour éviter les recalculs)
  const filteredAlerts = useMemo(
    () => filterAlertsByRole(baseDashboardData.alerts, role),
    [baseDashboardData, role]
  );

  // Mettre à jour les alertes dans les données (mémorisé pour éviter les re-renders)
  const dashboardDataWithFilteredAlerts = useMemo(
    () => ({
      ...baseDashboardData,
      alerts: filteredAlerts,
    }),
    [baseDashboardData, filteredAlerts]
  );

  const isLoading = isDashboardValidating;
  const error = dashboardError ? dashboardError.message : null;
  const currentWidgetConfig = widgetConfig ?? initialWidgetConfig;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <WidgetPreferencesDialog
          widgetConfig={currentWidgetConfig}
          onUpdate={async () => {
            await mutateWidgetConfig();
          }}
        />
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Affichage des widgets via DashboardWidgetGrid */}
      {currentWidgetConfig.visibleWidgets.length > 0 ? (
        <DashboardWidgetGrid
          widgets={currentWidgetConfig.visibleWidgets}
          dashboardData={dashboardDataWithFilteredAlerts}
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Aucun widget configuré pour votre rôle. Contactez un administrateur pour activer des widgets.
        </div>
      )}
    </div>
  );
}

