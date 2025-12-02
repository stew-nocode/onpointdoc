/**
 * Client Component wrapper pour le widget Répartition par Type
 * 
 * Charge les données via Server Action et gère les filtres locaux
 * Utilise useTransition pour les mises à jour non-bloquantes
 * Utilise debouncing pour éviter trop de requêtes
 */

'use client';

import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { TicketsByTypePieChart } from './tickets-by-type-pie-chart';
import { TicketsByTypePieChartSkeleton } from './tickets-by-type-pie-chart-skeleton';
import type { Period } from '@/types/dashboard';
import type { TicketsByTypeDistributionData } from '@/services/dashboard/tickets-by-type-distribution';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { getTicketsByTypeDistributionAction } from '@/app/actions/dashboard-tickets-by-type';

type TicketsByTypePieChartServerProps = {
  period: Period; // Période globale du dashboard
  periodStart?: string; // Date de début personnalisée (ISO string)
  periodEnd?: string; // Date de fin personnalisée (ISO string)
};

/**
 * Extrait un message d'erreur lisible
 */
function extractErrorMessage(error: unknown, fallback: string = 'Erreur inconnue'): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (error && typeof error === 'object') {
    if ('error' in error && error.error && typeof error.error === 'object') {
      const errorObj = error.error as Record<string, unknown>;
      if (typeof errorObj.message === 'string') {
        return errorObj.message;
      }
    }

    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    try {
      const str = JSON.stringify(error);
      return str.length > 200 ? `${str.substring(0, 200)}...` : str;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Client Component wrapper pour le widget Répartition par Type
 */
export function TicketsByTypePieChartServer({
  period: globalPeriod,
  periodStart: customPeriodStart,
  periodEnd: customPeriodEnd,
}: TicketsByTypePieChartServerProps) {
  const [data, setData] = useState<TicketsByTypeDistributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Logger les changements de période
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TicketsByTypePieChartServer] Period changed:', {
        period: globalPeriod,
        periodStart: customPeriodStart,
        periodEnd: customPeriodEnd,
      });
    }
  }, [globalPeriod, customPeriodStart, customPeriodEnd]);

  // Filtres locaux (état React - pas de conflit avec filtres globaux)
  const [localFilters, setLocalFilters] = useState<{
    selectedAgents: string[];
  }>({
    selectedAgents: [], // Tous par défaut
  });

  // Utiliser useTransition pour les mises à jour non-bloquantes
  const [isPending, startTransition] = useTransition();
  
  // Debounce timer pour éviter trop de requêtes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour charger les données via Server Action
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getTicketsByTypeDistributionAction({
        period: globalPeriod.toString(),
        periodStart: customPeriodStart,
        periodEnd: customPeriodEnd,
        agents: localFilters.selectedAgents.length > 0 ? localFilters.selectedAgents : undefined,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[TicketsByTypePieChart] Data loaded via Server Action:', {
          hasData: !!result,
          distribution: result?.distribution,
          agentsCount: result?.agents?.length || 0,
          period: result?.period,
        });
      }

      setData(result);
    } catch (err) {
      console.error('[TicketsByTypePieChart] Error loading data:', err);
      const errorMsg = extractErrorMessage(err, 'Erreur lors du chargement des données');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [globalPeriod, customPeriodStart, customPeriodEnd, localFilters.selectedAgents]);

  // Charger les données avec debouncing et transition
  useEffect(() => {
    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Débouncer les changements de filtres (300ms)
    debounceTimerRef.current = setTimeout(() => {
      startTransition(() => {
        loadData();
      });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [loadData]);

  const handleFiltersChange = (agents: string[]) => {
    setLocalFilters({ selectedAgents: agents });
  };

  if (isLoading || isPending) {
    return <TicketsByTypePieChartSkeleton />;
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="h-[420px]">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>
          {error || 'Impossible de charger les données de répartition par type'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TicketsByTypePieChart
      data={data}
      period={globalPeriod}
      periodStart={customPeriodStart}
      periodEnd={customPeriodEnd}
      onFiltersChange={handleFiltersChange}
    />
  );
}


