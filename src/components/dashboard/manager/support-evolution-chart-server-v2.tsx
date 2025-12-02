/**
 * Client Component wrapper pour le widget Support Evolution V2
 * 
 * Charge les données via Server Action et gère les filtres locaux
 * Utilise useTransition pour les mises à jour non-bloquantes
 * Utilise debouncing pour éviter trop de requêtes
 */

'use client';

import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { SupportEvolutionChartV2 } from './support-evolution-chart-v2';
import { SupportEvolutionSkeleton } from './support-evolution-skeleton';
import type { Period } from '@/types/dashboard';
import type { SupportEvolutionData, SupportDimension } from '@/types/dashboard-support-evolution';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { getSupportEvolutionDataAction } from '@/app/actions/dashboard';

type SupportEvolutionChartServerV2Props = {
  period: Period; // Période globale du dashboard
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
 * Client Component wrapper pour le widget Support Evolution V2
 */
export function SupportEvolutionChartServerV2({
  period: globalPeriod,
}: SupportEvolutionChartServerV2Props) {
  const [data, setData] = useState<SupportEvolutionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Logger les changements de période
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SupportEvolutionChartServerV2] Period changed:', globalPeriod);
    }
  }, [globalPeriod]);

  // Filtres locaux (état React - pas de conflit avec filtres globaux)
  const [localFilters, setLocalFilters] = useState<{
    selectedAgents: string[];
    selectedDimensions: SupportDimension[];
  }>({
    selectedAgents: [], // Tous par défaut
    selectedDimensions: ['BUG', 'REQ', 'ASSISTANCE', 'assistanceTime'], // Toutes les dimensions disponibles par défaut
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

      const result = await getSupportEvolutionDataAction({
        period: globalPeriod.toString(),
        dimensions: localFilters.selectedDimensions,
        agents: localFilters.selectedAgents.length > 0 ? localFilters.selectedAgents : undefined,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[SupportEvolutionV2] Data loaded via Server Action:', {
          hasData: !!result,
          dataPointsCount: result?.data?.length || 0,
          agentsCount: result?.agents?.length || 0,
          period: result?.period,
          selectedDimensions: result?.selectedDimensions,
          selectedAgents: result?.selectedAgents,
        });
      }

      // S'assurer que selectedDimensions est toujours défini
      const dataWithDefaults: SupportEvolutionData = {
        ...result,
        selectedDimensions: result.selectedDimensions || localFilters.selectedDimensions,
        selectedAgents: result.selectedAgents || localFilters.selectedAgents,
      };

      setData(dataWithDefaults);
    } catch (err) {
      console.error('[SupportEvolutionV2] Error loading data:', err);
      const errorMsg = extractErrorMessage(err, 'Erreur lors du chargement des données');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [globalPeriod, localFilters.selectedDimensions, localFilters.selectedAgents]);

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


  const handleFiltersChange = (filters: {
    selectedAgents: string[];
    selectedDimensions: SupportDimension[];
  }) => {
    setLocalFilters(filters);
  };

  if (isLoading || isPending) {
    return <SupportEvolutionSkeleton />;
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="h-[420px]">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>
          {error || 'Impossible de charger les données d\'évolution Support'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <SupportEvolutionChartV2
      data={data}
      onFiltersChange={handleFiltersChange}
    />
  );
}

