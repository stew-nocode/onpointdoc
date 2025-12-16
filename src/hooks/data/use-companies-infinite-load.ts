'use client';

/**
 * Hook personnalisé pour charger les entreprises avec infinite scroll
 * 
 * Pattern similaire à useTasksInfiniteLoad pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Gestion du chargement paginé des entreprises
 * - Utilise useCallback pour mémoriser les fonctions
 * - Gestion d'erreur avec état dédié
 * - Évite les re-renders inutiles avec useMemo
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CompanyWithRelations } from '@/types/company-with-relations';
import type { CompanyQuickFilter } from '@/types/company-filters';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
import { parseCompanySort } from '@/types/company-sort';
import { useRetryFetch } from '@/hooks/use-retry-fetch';

const DEFAULT_LIMIT = 25;

/**
 * Fusionne deux tableaux d'entreprises sans doublons
 * 
 * @param existing - Entreprises existantes
 * @param newItems - Nouvelles entreprises à fusionner
 * @returns Tableau fusionné sans doublons
 */
function mergeCompaniesWithoutDuplicates(
  existing: CompanyWithRelations[],
  newItems: CompanyWithRelations[]
): CompanyWithRelations[] {
  const existingIds = new Set(existing.map((c) => c.id));
  const uniqueNewItems = newItems.filter((c) => !existingIds.has(c.id));
  return [...existing, ...uniqueNewItems];
}

type UseCompaniesInfiniteLoadOptions = {
  /**
   * Entreprises initiales chargées par le Server Component
   */
  initialCompanies?: CompanyWithRelations[];

  /**
   * Indique s'il reste des entreprises à charger
   */
  initialHasMore?: boolean;

  /**
   * Nombre d'éléments par page
   */
  limit?: number;

  /**
   * Total initial
   */
  initialTotal?: number;

  /**
   * Filtres pour le chargement
   */
  search?: string;
  quickFilter?: CompanyQuickFilter;
  sort?: {
    column: CompanySortColumn;
    direction: SortDirection;
  };

  /**
   * SearchParams de l'URL (stabilisés)
   */
  searchParams: ReadonlyURLSearchParams;
};

type UseCompaniesInfiniteLoadResult = {
  /**
   * Liste des entreprises chargées
   */
  companies: CompanyWithRelations[];

  /**
   * Indique si un chargement est en cours
   */
  isLoading: boolean;

  /**
   * Message d'erreur si un chargement a échoué
   */
  error: string | null;

  /**
   * Indique s'il reste des entreprises à charger
   */
  hasMore: boolean;

  /**
   * Fonction pour charger plus d'entreprises
   */
  loadMore: () => Promise<void>;

  /**
   * Total d'entreprises
   */
  total: number;

  /**
   * Clé de filtrage pour détecter les changements de filtres
   */
  filterKey: string;
};

/**
 * Hook pour charger les entreprises avec infinite scroll
 * 
 * @param options - Options de configuration
 * @returns État et fonctions pour la pagination infinie
 */
export function useCompaniesInfiniteLoad(
  options: UseCompaniesInfiniteLoadOptions = {}
): UseCompaniesInfiniteLoadResult {
  const {
    initialCompanies = [],
    initialHasMore = false,
    limit = DEFAULT_LIMIT
  } = options;

  const searchParams = useSearchParams();
  
  // États
  const [companies, setCompanies] = useState<CompanyWithRelations[]>(initialCompanies);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Hook de retry pour les requêtes fetch
  const { fetchWithRetry, isLoading, error: fetchError } = useRetryFetch({
    maxRetries: 2,
    retryDelay: 1000,
    timeout: 30000
  });

  // Extraire les paramètres de l'URL
  const search = useMemo(() => searchParams.get('search') || undefined, [searchParams]);
  const quickFilter = useMemo(() => {
    const filter = searchParams.get('quick');
    return filter && ['all', 'with_users', 'without_users', 'with_tickets', 'with_open_tickets', 'with_assistance'].includes(filter)
      ? (filter as CompanyQuickFilter)
      : undefined;
  }, [searchParams]);
  
  const sort = useMemo(() => {
    const sortParam = searchParams.get('sort');
    return sortParam ? parseCompanySort(sortParam) : { column: 'name' as CompanySortColumn, direction: 'asc' as SortDirection };
  }, [searchParams]);

  // Synchroniser l'erreur du hook avec l'état local
  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
    }
  }, [fetchError]);

  /**
   * Charge plus d'entreprises via l'API
   * 
   * Gère automatiquement :
   * - Les retries en cas d'erreur réseau (via useRetryFetch)
   * - La fusion des entreprises sans doublons
   * - La mise à jour de l'état (hasMore, error, total)
   * - Utilise flushSync pour synchroniser les mises à jour DOM (scroll restoration)
   */
  const loadMore = useCallback(async () => {
    // Utiliser les refs pour éviter les dépendances
    if (isLoading || !hasMoreRef.current) return;

    // Mesure du temps de chargement (dev uniquement)
    const loadStartTime = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.time('⏱️ CompaniesLoadMore');
    }

    setError(null);

    try {
      const currentLength = companiesLengthRef.current;
      const filters = filtersRef.current;

      // Construire les paramètres de la requête
      const params = buildCompanyListParams(
        currentLength,
        limit,
        filters.search,
        filters.quickFilter,
        filters.sort,
        searchParams
      );

      // Utiliser le hook useRetryFetch pour gérer les retries automatiquement
      const response = await fetchWithRetry(`/api/companies/list?${params.toString()}`);
      const data = await response.json();

      // Fusionner les entreprises avec les utilitaires extraits
      // Utiliser flushSync pour forcer la mise à jour synchrone (scroll restoration)
      flushSync(() => {
        setCompanies((prev) => {
          // Vérifier rapidement si les nouvelles entreprises existent déjà
          const existingIds = new Set(prev.map((c) => c.id));
          const trulyNewCompanies = data.companies.filter((c: CompanyWithRelations) => !existingIds.has(c.id));
          
          // Si aucune nouvelle entreprise, ne pas déclencher de re-render
          if (trulyNewCompanies.length === 0) {
            return prev;
          }
          
          // Fusionner uniquement les nouvelles entreprises
          const updated = mergeCompaniesWithoutDuplicates(prev, data.companies);
          companiesLengthRef.current = updated.length;
          return updated;
        });

        // Mettre à jour hasMore seulement si la valeur a changé
        if (hasMoreRef.current !== data.hasMore) {
          hasMoreRef.current = data.hasMore;
          setHasMore(data.hasMore);
        }

        // Mettre à jour total si fourni
        if (data.total !== undefined && data.total !== total) {
          setTotal(data.total);
        }
      });

      // Logger la performance (dev uniquement)
      if (process.env.NODE_ENV === 'development') {
        const loadDuration = performance.now() - loadStartTime;
        console.timeEnd('⏱️ CompaniesLoadMore');
        console.log(`✅ Chargé ${data.companies.length} entreprises en ${loadDuration.toFixed(2)}ms`);
      }
    } catch (err: unknown) {
      // L'erreur est déjà gérée par useRetryFetch et mise à jour dans fetchError
      // On synchronise avec l'état local pour compatibilité
      let message = 'Erreur lors du chargement';
      if (err instanceof TypeError) {
        message = err.message.includes('network') 
          ? 'Erreur de connexion réseau. Vérifiez votre connexion.'
          : 'Erreur réseau lors du chargement des entreprises';
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      
      // Logger l'erreur complète en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[ERROR] Erreur lors du chargement des entreprises:', err);
        console.timeEnd('⏱️ CompaniesLoadMore');
      }
    }
  }, [searchParams, isLoading, fetchWithRetry, limit, total]);

  return {
    companies,
    isLoading,
    error,
    hasMore,
    loadMore,
    total,
    filterKey
  };
}
