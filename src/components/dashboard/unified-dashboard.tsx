'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Period, UnifiedDashboardData, DashboardRole, DashboardConfig } from '@/types/dashboard';
import { getDefaultDashboardConfig } from '@/services/dashboard/default-config';
import { filterAlertsByRole } from '@/lib/utils/role-filters';
import { CEOKPIsSection } from './ceo/ceo-kpis-section';
import { CEOChartsSection } from './ceo/ceo-charts-section';
import { CEOTablesSection } from './ceo/ceo-tables-section';
import { OperationalAlertsSection } from './ceo/operational-alerts-section';
import { PeriodSelector } from './ceo/period-selector';
import { Loader2 } from 'lucide-react';

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
  const [data, setData] = useState<UnifiedDashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utiliser la config passée en props (chargée côté serveur depuis la DB)
  // Fallback sur les defaults si pas de config custom
  const config = configProp || initialData.config || getDefaultDashboardConfig(role, teamId, agentId);

  /**
   * Charge les données pour une période donnée
   */
  const loadData = useCallback(async (selectedPeriod: Period) => {
    setIsLoading(true);
    setError(null);
    try {
      // Construire l'URL avec les paramètres de filtres depuis l'URL actuelle
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
      // Logger uniquement en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[Dashboard] Erreur lors du chargement des données:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  /**
   * Configuration du temps réel Supabase
   */
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Écouter les changements sur les tables pertinentes
    const ticketsChannel = supabase
      .channel('unified-dashboard-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          loadData(period);
        }
      )
      .subscribe();

    const activitiesChannel = supabase
      .channel('unified-dashboard-activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        () => {
          loadData(period);
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('unified-dashboard-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          loadData(period);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [period, loadData]);

  // Filtrer les alertes selon le rôle
  const filteredAlerts = filterAlertsByRole(data.alerts, role);

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
      {config.visibleSections.strategicKPIs && data.strategic && (
        <CEOKPIsSection data={data.strategic} />
      )}

      {/* Section KPIs Équipe (Manager uniquement) */}
      {config.visibleSections.teamKPIs && data.team && (
        <div>
          {/* TODO: Créer TeamKPIsSection */}
          <p className="text-sm text-slate-500">KPIs Équipe - À implémenter</p>
        </div>
      )}

      {/* Section KPIs Personnels (Agent uniquement) */}
      {config.visibleSections.personalKPIs && data.personal && (
        <div>
          {/* TODO: Créer PersonalKPIsSection */}
          <p className="text-sm text-slate-500">KPIs Personnels - À implémenter</p>
        </div>
      )}

      {/* Section Graphiques Stratégiques (Direction) */}
      {config.visibleSections.strategicCharts && data.strategic && (
        <CEOChartsSection data={data.strategic} />
      )}

      {/* Section Graphiques Équipe (Manager + Direction) */}
      {config.visibleSections.teamCharts && data.team && (
        <div>
          {/* TODO: Créer TeamChartsSection */}
          <p className="text-sm text-slate-500">Graphiques Équipe - À implémenter</p>
        </div>
      )}

      {/* Section Graphiques Personnels (Agent) */}
      {config.visibleSections.personalCharts && data.personal && (
        <div>
          {/* TODO: Créer PersonalChartsSection */}
          <p className="text-sm text-slate-500">Graphiques Personnels - À implémenter</p>
        </div>
      )}

      {/* Section Tables Stratégiques (Direction) */}
      {config.visibleSections.strategicTables && data.strategic && (
        <CEOTablesSection data={data.strategic} />
      )}

      {/* Section Tables Équipe (Manager + Direction) */}
      {config.visibleSections.teamTables && data.team && (
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

