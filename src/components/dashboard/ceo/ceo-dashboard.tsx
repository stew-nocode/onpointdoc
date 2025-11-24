'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Period, CEODashboardData } from '@/types/dashboard';
import { CEOKPIsSection } from './ceo-kpis-section';
import { CEOChartsSection } from './ceo-charts-section';
import { CEOTablesSection } from './ceo-tables-section';
import { OperationalAlertsSection } from './operational-alerts-section';
import { PeriodSelector } from './period-selector';
import { Loader2 } from 'lucide-react';

type CEODashboardProps = {
  initialData: CEODashboardData;
  initialPeriod: Period;
};

/**
 * Dashboard CEO avec rafraîchissement temps réel
 * 
 * Utilise Supabase Realtime pour mettre à jour automatiquement les données
 * 
 * @param initialData - Données initiales chargées côté serveur
 * @param initialPeriod - Période initiale
 */
export function CEODashboard({ initialData, initialPeriod }: CEODashboardProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<CEODashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      const response = await fetch(`/api/dashboard/ceo?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const newData: CEODashboardData = await response.json();
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

    // Écouter les changements sur la table tickets
    const ticketsChannel = supabase
      .channel('ceo-dashboard-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          // Rafraîchir les données lors d'un changement
          loadData(period);
        }
      )
      .subscribe();

    // Écouter les changements sur la table activities
    const activitiesChannel = supabase
      .channel('ceo-dashboard-activities')
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

    // Écouter les changements sur la table tasks
    const tasksChannel = supabase
      .channel('ceo-dashboard-tasks')
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

      <CEOKPIsSection data={data} />
      <CEOChartsSection data={data} />
      <CEOTablesSection data={data} />
      <OperationalAlertsSection alerts={data.alerts} />
    </div>
  );
}

