/**
 * Client Component wrapper pour le widget Répartition par Entreprise
 * 
 * Charge les données via Server Action et gère les filtres locaux
 * Utilise useTransition pour les mises à jour non-bloquantes
 * Utilise debouncing pour éviter trop de requêtes
 */

'use client';

import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { TicketsByCompanyPieChart } from './tickets-by-company-pie-chart';
import { TicketsByCompanyPieChartSkeleton } from './tickets-by-company-pie-chart-skeleton';
import type { Period } from '@/types/dashboard';
import type { TicketsByCompanyDistributionData } from '@/services/dashboard/tickets-by-company-distribution';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { getTicketsByCompanyDistributionAction } from '@/app/actions/dashboard-tickets-by-company';

type TicketsByCompanyPieChartServerProps = {
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
 * Client Component wrapper pour le widget Répartition par Entreprise
 */
export function TicketsByCompanyPieChartServer({
  period: globalPeriod,
  periodStart: customPeriodStart,
  periodEnd: customPeriodEnd,
}: TicketsByCompanyPieChartServerProps) {
  const [data, setData] = useState<TicketsByCompanyDistributionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Logger les changements de période
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TicketsByCompanyPieChartServer] Period changed:', {
        period: globalPeriod,
        periodStart: customPeriodStart,
        periodEnd: customPeriodEnd,
      });
    }
  }, [globalPeriod, customPeriodStart, customPeriodEnd]);

  // Filtres locaux (état React - pas de conflit avec filtres globaux)
  const [localFilters, setLocalFilters] = useState<{
    selectedTicketTypes: ('BUG' | 'REQ' | 'ASSISTANCE')[];
  }>({
    selectedTicketTypes: ['BUG', 'REQ', 'ASSISTANCE'], // Tous par défaut
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

      const result = await getTicketsByCompanyDistributionAction({
        period: globalPeriod.toString(),
        periodStart: customPeriodStart,
        periodEnd: customPeriodEnd,
        ticketTypes: localFilters.selectedTicketTypes.length > 0 && localFilters.selectedTicketTypes.length < 3 
          ? localFilters.selectedTicketTypes 
          : undefined, // Tous si 3 types sélectionnés
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[TicketsByCompanyPieChart] Data loaded via Server Action:', {
          hasData: !!result,
          companiesCount: result?.distribution?.length || 0,
          totalTickets: result?.distribution?.reduce((sum, c) => sum + c.ticketCount, 0) || 0,
          period: result?.period,
        });
      }

      setData(result);
    } catch (err) {
      console.error('[TicketsByCompanyPieChart] Error loading data:', err);
      const errorMsg = extractErrorMessage(err, 'Erreur lors du chargement des données');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [globalPeriod, customPeriodStart, customPeriodEnd, localFilters.selectedTicketTypes]);

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

  const handleFiltersChange = (ticketTypes: ('BUG' | 'REQ' | 'ASSISTANCE')[]) => {
    setLocalFilters({ selectedTicketTypes: ticketTypes });
  };

  if (isLoading || isPending) {
    return <TicketsByCompanyPieChartSkeleton />;
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="h-[420px]">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>
          {error || 'Impossible de charger les données de répartition par entreprise'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TicketsByCompanyPieChart
      data={data}
      period={globalPeriod}
      periodStart={customPeriodStart}
      periodEnd={customPeriodEnd}
      onFiltersChange={handleFiltersChange}
    />
  );
}

