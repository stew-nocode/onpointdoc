'use client';

/**
 * Hook personnalisé pour charger les entreprises avec infinite scroll
 *
 * Pattern similaire à `useTasksInfiniteLoad` pour cohérence.
 *
 * Principes Clean Code :
 * - SRP : Gestion du chargement paginé des entreprises
 * - Gestion complète de l'état (companies, hasMore, isLoading, error, total)
 * - Retry automatique en cas d'erreur réseau
 * - Réinitialisation automatique lors des changements de filtres
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { CompanyWithRelations } from '@/types/company-with-relations';
import type { CompanyQuickFilter } from '@/types/company-filters';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
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
  searchParams?: ReadonlyURLSearchParams;
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
 * Construit les paramètres de requête pour charger des entreprises.
 */
function buildCompanyListParams(
  offset: number,
  limit: number,
  search?: string,
  quickFilter?: CompanyQuickFilter,
  sort?: { column: CompanySortColumn; direction: SortDirection },
  searchParams?: ReadonlyURLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(searchParams?.toString() || '');

  params.set('offset', offset.toString());
  params.set('limit', limit.toString());

  if (search && search.trim().length > 0) {
    params.set('search', search.trim());
  } else {
    params.delete('search');
  }

  if (quickFilter) {
    params.set('quick', quickFilter);
  } else {
    params.delete('quick');
  }

  if (sort?.column) {
    params.set('sort', `${sort.column}:${sort.direction}`);
  } else {
    params.delete('sort');
  }

  return params;
}

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
    limit = DEFAULT_LIMIT,
    initialTotal = 0,
    search,
    quickFilter,
    sort,
    searchParams
  } = options;
  
  // États
  const [companies, setCompanies] = useState<CompanyWithRelations[]>(initialCompanies);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(initialTotal);

  // Hook de retry pour les requêtes fetch
  const { fetchWithRetry, isLoading, error: fetchError } = useRetryFetch({
    maxRetries: 2,
    retryDelay: 1000,
    timeout: 30000
  });

  // Refs pour optimiser les performances et éviter les re-renders
  const companiesLengthRef = useRef(initialCompanies.length);
  const hasMoreRef = useRef(initialHasMore);

  // Référence stable pour les filtres (évite les re-créations de loadMore)
  const filtersRef = useRef({
    search,
    quickFilter,
    sort,
  });

  // Créer une clé de filtrage pour détecter les changements
  const filterKey = useMemo(() => {
    const normalizedSearch = search || '';
    const normalizedQuickFilter = quickFilter || '';
    const normalizedSort = sort?.column ? `${sort.column}:${sort.direction}` : '';

    // Inclure aussi la string des params URL pour capturer des filtres additionnels éventuels
    const normalizedParams = searchParams?.toString() || '';

    return `${normalizedSearch}-${normalizedQuickFilter}-${normalizedSort}-${normalizedParams}`;
  }, [search, quickFilter, sort?.column, sort?.direction, searchParams]);

  // Réinitialiser les entreprises quand les filtres changent OU quand initialCompanies/initialHasMore changent
  const prevFilterKeyRef = useRef<string | null>(null);
  const prevInitialCompaniesIdsRef = useRef<string>(
    initialCompanies.map((c) => c.id).join(',')
  );
  const prevInitialHasMoreRef = useRef<boolean>(initialHasMore);

  // Synchroniser l'erreur du hook avec l'état local
  useEffect(() => {
    if (fetchError) {
      setError(fetchError);
    }
  }, [fetchError]);

  useEffect(() => {
    const currentInitialCompaniesIds = initialCompanies.map((c) => c.id).join(',');

    const filterKeyChanged =
      prevFilterKeyRef.current !== null && prevFilterKeyRef.current !== filterKey;
    const initialCompaniesIdsChanged =
      prevInitialCompaniesIdsRef.current !== currentInitialCompaniesIds;
    const initialHasMoreChanged = prevInitialHasMoreRef.current !== initialHasMore;

    if (filterKeyChanged) {
      setCompanies(initialCompanies);
      setHasMore(initialHasMore);
      companiesLengthRef.current = initialCompanies.length;
      hasMoreRef.current = initialHasMore;
      setError(null);

      prevFilterKeyRef.current = filterKey;
      prevInitialCompaniesIdsRef.current = currentInitialCompaniesIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return;
    }

    if (initialCompaniesIdsChanged) {
      setCompanies(initialCompanies);
      setHasMore(initialHasMore);
      companiesLengthRef.current = initialCompanies.length;
      hasMoreRef.current = initialHasMore;
      setError(null);

      prevInitialCompaniesIdsRef.current = currentInitialCompaniesIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return;
    }

    if (initialHasMoreChanged) {
      setHasMore(initialHasMore);
      hasMoreRef.current = initialHasMore;
      prevInitialHasMoreRef.current = initialHasMore;
    }
  }, [filterKey, initialCompanies, initialHasMore]);

  // Mettre à jour les refs quand les filtres changent
  useEffect(() => {
    filtersRef.current = {
      search,
      quickFilter,
      sort,
    };
  }, [search, quickFilter, sort]);

  // Mettre à jour la ref pour hasMore
  useEffect(() => {
    if (hasMoreRef.current !== hasMore) {
      hasMoreRef.current = hasMore;
    }
  }, [hasMore]);

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
  }, [fetchWithRetry, isLoading, limit, searchParams, total]);

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
