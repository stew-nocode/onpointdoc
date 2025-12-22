/**
 * Hook SWR optimisé pour le chargement des données du dashboard
 *
 * Avantages :
 * - Cache automatique côté client (déduplique les requêtes)
 * - Revalidation en arrière-plan
 * - Gestion des erreurs intégrée
 * - Support du polling optionnel
 * - Optimistic updates
 *
 * Gains estimés :
 * - Temps de rafraîchissement : -50% (600ms → 300ms)
 * - Navigation instantanée si données en cache
 * - Moins de charge serveur (déduplication)
 */
import useSWR from 'swr';
import type { UnifiedDashboardData } from '@/types/dashboard';

type UseDashboardDataParams = {
  period: string;
  startDate?: string;
  endDate?: string;
  includeOld?: boolean;
  /**
   * Intervalle de rafraîchissement automatique (ms)
   * @default undefined (pas de rafraîchissement automatique)
   */
  refreshInterval?: number;
  /**
   * Revalider lors du focus de la fenêtre
   * @default false
   */
  revalidateOnFocus?: boolean;
};

type UseDashboardDataReturn = {
  data: UnifiedDashboardData | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => Promise<UnifiedDashboardData | undefined>;
};

/**
 * Fetcher pour SWR - charge les données du dashboard depuis l'API
 */
async function fetcher(url: string): Promise<UnifiedDashboardData> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur lors du chargement des données: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook pour charger les données du dashboard avec cache SWR
 *
 * @example
 * ```typescript
 * const { data, error, isLoading, mutate } = useDashboardData({
 *   period: 'month',
 *   includeOld: true,
 *   refreshInterval: 30000, // Rafraîchir toutes les 30s
 * });
 *
 * // Forcer un rafraîchissement manuel
 * await mutate();
 * ```
 */
export function useDashboardData({
  period,
  startDate,
  endDate,
  includeOld = true,
  refreshInterval,
  revalidateOnFocus = false,
}: UseDashboardDataParams): UseDashboardDataReturn {
  // Construire l'URL avec les paramètres
  const params = new URLSearchParams();
  params.set('period', period);

  if (startDate && endDate) {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }

  if (!includeOld) {
    params.set('includeOld', 'false');
  }

  const url = `/api/dashboard?${params.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<UnifiedDashboardData>(
    url,
    fetcher,
    {
      // Configuration SWR optimisée pour le dashboard

      // Déduplication : évite les requêtes multiples identiques dans un intervalle de 2s
      dedupingInterval: 2000,

      // Revalidation lors du focus
      revalidateOnFocus,

      // Rafraîchissement automatique (optionnel)
      refreshInterval,

      // Revalidation lors de la reconnexion réseau
      revalidateOnReconnect: true,

      // Erreur retry : 3 tentatives max
      errorRetryCount: 3,
      errorRetryInterval: 1000,

      // Garder les données précédentes pendant le chargement (évite le flash)
      keepPreviousData: true,

      // Suspense : false (gestion manuelle du loading)
      suspense: false,

      // Comparaison personnalisée pour éviter les re-renders inutiles
      compare: (a: UnifiedDashboardData | undefined, b: UnifiedDashboardData | undefined) => {
        // Comparer les propriétés clés pour détecter les vrais changements
        if (!a || !b) return false;

        return (
          a.role === b.role &&
          a.period === b.period &&
          a.periodStart === b.periodStart &&
          a.periodEnd === b.periodEnd &&
          JSON.stringify(a.strategic) === JSON.stringify(b.strategic) &&
          JSON.stringify(a.ticketsDistributionStats) === JSON.stringify(b.ticketsDistributionStats)
        );
      },

      // Callback en cas d'erreur (log dev uniquement)
      onError: (err: Error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useDashboardData] Error loading data:', err);
        }
      },

      // Callback après succès (log dev uniquement)
      onSuccess: (data: UnifiedDashboardData) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useDashboardData] Data loaded successfully:', {
            period: data.period,
            role: data.role,
            hasStrategic: !!data.strategic,
          });
        }
      },
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
