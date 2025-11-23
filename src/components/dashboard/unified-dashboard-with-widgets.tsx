'use client';

import { useState, useCallback } from 'react';
import type { Period, UnifiedDashboardData } from '@/types/dashboard';
import type { DashboardRole, UserDashboardConfig } from '@/types/dashboard-widgets';
import { filterAlertsByRole } from '@/lib/utils/role-filters';
import { DashboardWidgetGrid } from './widgets';
import { PeriodSelector } from './ceo/period-selector';
import { WidgetPreferencesDialog } from './user/widget-preferences-dialog';
import { Loader2 } from 'lucide-react';
import { useRealtimeDashboardData } from '@/hooks/dashboard/use-realtime-dashboard-data';
import { useRealtimeWidgetConfig } from '@/hooks/dashboard/use-realtime-widget-config';

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
  const [data, setData] = useState<UnifiedDashboardData>(initialData);
  const [widgetConfig, setWidgetConfig] = useState<UserDashboardConfig>(initialWidgetConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge les données pour une période donnée
   */
  const loadData = useCallback(async (selectedPeriod: Period) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      params.set('period', selectedPeriod);

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const newData: UnifiedDashboardData = await response.json();
      setData(newData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[Dashboard] Erreur lors du chargement des données:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charge la configuration des widgets depuis l'API
   */
  const loadWidgetConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/widgets/config?profileId=${profileId}&role=${role}`);
      if (!response.ok) {
        return;
      }
      const config: UserDashboardConfig = await response.json();
      setWidgetConfig(config);
    } catch (err) {
      // Ignorer les erreurs silencieusement
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[Dashboard] Erreur lors du chargement de la config widgets:', err);
      }
    }
  }, [profileId, role]);

  /**
   * Gère le changement de période
   */
  const handlePeriodChange = useCallback(
    (newPeriod: Period) => {
      setPeriod(newPeriod);
      loadData(newPeriod);
    },
    [loadData]
  );

  // Écouter les changements temps réel des données
  useRealtimeDashboardData({
    period,
    onDataChange: () => loadData(period),
  });

  // Écouter les changements temps réel de la configuration des widgets
  useRealtimeWidgetConfig({
    profileId,
    role,
    onConfigChange: loadWidgetConfig,
  });

  // Filtrer les alertes selon le rôle
  const filteredAlerts = filterAlertsByRole(data.alerts, role);

  // Mettre à jour les alertes dans les données si nécessaire
  const dashboardDataWithFilteredAlerts = {
    ...data,
    alerts: filteredAlerts,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <WidgetPreferencesDialog widgetConfig={widgetConfig} onUpdate={loadWidgetConfig} />
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
      {widgetConfig.visibleWidgets.length > 0 ? (
        <DashboardWidgetGrid
          widgets={widgetConfig.visibleWidgets}
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

