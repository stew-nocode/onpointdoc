'use client';

/**
 * Hook pour gérer le chargement infini des activités
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (chargement paginé des activités)
 * - Gestion complète de l'état (activities, hasMore, isLoading, error)
 * - Logique de retry pour les erreurs réseau
 * - Fusion intelligente des activités (évite les doublons)
 * - Réinitialisation automatique lors des changements de filtres
 * 
 * Pattern similaire à useTicketsInfiniteLoad pour cohérence
 * 
 * Responsabilités :
 * - Gérer l'état des activités chargées
 * - Charger plus d'activités via l'API
 * - Gérer les erreurs avec retry automatique
 * - Réinitialiser les activités quand les filtres changent
 * - Optimiser les performances avec des refs stables
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { ActivityWithRelations } from '@/types/activity-with-relations';
import type { ActivityQuickFilter } from '@/types/activity-filters';
import { useRetryFetch } from '@/hooks/use-retry-fetch';

const ITEMS_PER_PAGE = 25;

type UseActivitiesInfiniteLoadProps = {
  /**
   * Activités initiales chargées par le Server Component
   */
  initialActivities: ActivityWithRelations[];

  /**
   * Indique s'il reste des activités à charger
   */
  initialHasMore: boolean;

  /**
   * Filtres pour le chargement
   */
  search?: string;
  quickFilter?: ActivityQuickFilter;
  currentProfileId?: string | null;

  /**
   * SearchParams de l'URL (stabilisés)
   */
  searchParams: ReadonlyURLSearchParams;
};

type UseActivitiesInfiniteLoadReturn = {
  /**
   * Liste des activités chargées
   */
  activities: ActivityWithRelations[];

  /**
   * Indique s'il reste des activités à charger
   */
  hasMore: boolean;

  /**
   * Indique si un chargement est en cours
   */
  isLoading: boolean;

  /**
   * Message d'erreur si un chargement a échoué
   */
  error: string | null;

  /**
   * Fonction pour charger plus d'activités
   */
  loadMore: () => Promise<void>;

  /**
   * Clé de filtrage pour détecter les changements de filtres
   */
  filterKey: string;
};

/**
 * Fusionne deux tableaux d'activités sans doublons
 * 
 * @param existing - Activités existantes
 * @param newItems - Nouvelles activités à fusionner
 * @returns Tableau fusionné sans doublons
 */
function mergeActivitiesWithoutDuplicates(
  existing: ActivityWithRelations[],
  newItems: ActivityWithRelations[]
): ActivityWithRelations[] {
  const existingIds = new Set(existing.map((a) => a.id));
  const uniqueNewItems = newItems.filter((a) => !existingIds.has(a.id));
  return [...existing, ...uniqueNewItems];
}

/**
 * Construit les paramètres de requête pour charger des activités
 * 
 * @param offset - Décalage pour la pagination
 * @param limit - Nombre d'éléments par page
 * @param search - Terme de recherche
 * @param quickFilter - Filtre rapide
 * @param currentProfileId - ID du profil utilisateur
 * @param searchParams - SearchParams de l'URL
 * @returns URLSearchParams pour la requête
 */
function buildActivityListParams(
  offset: number,
  limit: number,
  search?: string,
  quickFilter?: ActivityQuickFilter,
  currentProfileId?: string | null,
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
  
  if (currentProfileId) {
    params.set('profileId', currentProfileId);
  } else {
    params.delete('profileId');
  }
  
  return params;
}

/**
 * Hook pour gérer le chargement infini des activités
 * 
 * Gère automatiquement :
 * - L'état des activités chargées
 * - Le chargement paginé via l'API
 * - Les erreurs avec retry automatique
 * - La réinitialisation lors des changements de filtres
 * 
 * @param props - Propriétés du hook
 * @returns État et fonctions pour gérer le chargement infini
 * 
 * @example
 * ```tsx
 * const { activities, hasMore, isLoading, error, loadMore } = useActivitiesInfiniteLoad({
 *   initialActivities,
 *   initialHasMore,
 *   search,
 *   quickFilter,
 *   currentProfileId,
 *   searchParams
 * });
 * ```
 */
export function useActivitiesInfiniteLoad({
  initialActivities,
  initialHasMore,
  search,
  quickFilter,
  currentProfileId,
  searchParams
}: UseActivitiesInfiniteLoadProps): UseActivitiesInfiniteLoadReturn {
  // État des activités
  const [activities, setActivities] = useState<ActivityWithRelations[]>(initialActivities);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de retry pour les requêtes fetch
  const { fetchWithRetry, isLoading, error: fetchError } = useRetryFetch({
    maxRetries: 2,
    retryDelay: 1000,
    timeout: 30000,
    onRetry: (attemptNumber) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[useActivitiesInfiniteLoad] Retry ${attemptNumber}/2`);
      }
    }
  });

  // Refs pour optimiser les performances et éviter les re-renders
  const activitiesLengthRef = useRef(initialActivities.length);
  const hasMoreRef = useRef(initialHasMore);
  
  // Synchroniser l'erreur du hook avec l'état local
  useEffect(() => {
    if (fetchError) {
      // Utiliser requestAnimationFrame pour éviter les cascades de renders
      requestAnimationFrame(() => {
        setError(fetchError);
      });
    }
  }, [fetchError]);

  // Référence stable pour les filtres (évite les re-créations de loadMore)
  const filtersRef = useRef({
    search,
    quickFilter,
    currentProfileId,
  });

  // Créer une clé de filtrage pour détecter les changements
  const filterKey = useMemo(() => {
    const normalizedSearch = search || '';
    const normalizedQuickFilter = quickFilter || '';
    const normalizedProfileId = currentProfileId || '';
    
    return `${normalizedSearch}-${normalizedQuickFilter}-${normalizedProfileId}`;
  }, [search, quickFilter, currentProfileId]);

  // Réinitialiser les activités quand les filtres changent OU quand initialActivities/initialHasMore changent
  // (par exemple après une revalidation du Server Component)
  const prevFilterKeyRef = useRef<string | null>(null);
  const prevInitialActivitiesIdsRef = useRef<string>(
    initialActivities.map(a => a.id).join(',')
  );
  const prevInitialHasMoreRef = useRef<boolean>(initialHasMore);

  useEffect(() => {
    // Créer une clé pour identifier les activités initiales (par IDs)
    const currentInitialActivitiesIds = initialActivities.map(a => a.id).join(',');
    
    // Détecter les changements
    const filterKeyChanged = prevFilterKeyRef.current !== null && prevFilterKeyRef.current !== filterKey;
    const initialActivitiesIdsChanged = prevInitialActivitiesIdsRef.current !== currentInitialActivitiesIds;
    const initialHasMoreChanged = prevInitialHasMoreRef.current !== initialHasMore;
    
    // Réinitialiser si les filtres ont changé (changement complet)
    if (filterKeyChanged) {
      // Utiliser requestAnimationFrame pour éviter les cascades de renders
      requestAnimationFrame(() => {
        setActivities(initialActivities);
        setHasMore(initialHasMore);
        setError(null);
      });
      activitiesLengthRef.current = initialActivities.length;
      hasMoreRef.current = initialHasMore;
      
      // Mettre à jour les refs
      prevFilterKeyRef.current = filterKey;
      prevInitialActivitiesIdsRef.current = currentInitialActivitiesIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return; // Sortir tôt pour éviter les traitements supplémentaires
    }
    
    // Si les activités initiales ont changé (IDs différents), réinitialiser
    // Cela peut arriver après une revalidation du Server Component
    if (initialActivitiesIdsChanged) {
       
      setActivities(initialActivities);
       
      setHasMore(initialHasMore);
      activitiesLengthRef.current = initialActivities.length;
      hasMoreRef.current = initialHasMore;
       
      setError(null);

      // Mettre à jour les refs
      prevInitialActivitiesIdsRef.current = currentInitialActivitiesIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return;
    }
    
    // Si seul hasMore a changé, mettre à jour uniquement hasMore
    if (initialHasMoreChanged) {
      setHasMore(initialHasMore);
      hasMoreRef.current = initialHasMore;
      prevInitialHasMoreRef.current = initialHasMore;
    }
  }, [filterKey, initialActivities, initialHasMore]);

  // Mettre à jour les refs quand les filtres changent
  useEffect(() => {
    filtersRef.current = {
      search,
      quickFilter,
      currentProfileId,
    };
  }, [search, quickFilter, currentProfileId]);

  // Mettre à jour la ref pour hasMore
  useEffect(() => {
    if (hasMoreRef.current !== hasMore) {
      hasMoreRef.current = hasMore;
    }
  }, [hasMore]);

  /**
   * Charge plus d'activités via l'API
   * 
   * Gère automatiquement :
   * - Les retries en cas d'erreur réseau (via useRetryFetch)
   * - La fusion des activités sans doublons
   * - La mise à jour de l'état (hasMore, error)
   * - Les logs de performance (dev uniquement)
   */
  const loadMore = useCallback(async () => {
    // Utiliser les refs pour éviter les dépendances
    if (isLoading || !hasMoreRef.current) return;

    // Mesure du temps de chargement (dev uniquement)
    const loadStartTime = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.time('⏱️ ActivitiesLoadMore');
    }

    setError(null);

    try {
      const currentLength = activitiesLengthRef.current;
      const filters = filtersRef.current;

      // Construire les paramètres de la requête
      const params = buildActivityListParams(
        currentLength,
        ITEMS_PER_PAGE,
        filters.search,
        filters.quickFilter,
        filters.currentProfileId,
        searchParams
      );

      // Utiliser le hook useRetryFetch pour gérer les retries automatiquement
      const response = await fetchWithRetry(`/api/activities/list?${params.toString()}`);
      const data = await response.json();

      // Fusionner les activités avec les utilitaires extraits
      // Utiliser flushSync pour forcer la mise à jour synchrone
      flushSync(() => {
        setActivities((prev) => {
          // Vérifier rapidement si les nouvelles activités existent déjà
          const existingIds = new Set(prev.map((a) => a.id));
          const trulyNewActivities = data.activities.filter((a: ActivityWithRelations) => !existingIds.has(a.id));
          
          // Si aucune nouvelle activité, ne pas déclencher de re-render
          if (trulyNewActivities.length === 0) {
            return prev;
          }
          
          // Fusionner uniquement les nouvelles activités
          const updated = mergeActivitiesWithoutDuplicates(prev, data.activities);
          activitiesLengthRef.current = updated.length;
          return updated;
        });

        // Mettre à jour hasMore seulement si la valeur a changé
        if (hasMoreRef.current !== data.hasMore) {
          hasMoreRef.current = data.hasMore;
          setHasMore(data.hasMore);
        }
      });

      // Logger la performance (dev uniquement)
      if (process.env.NODE_ENV === 'development') {
        const loadDuration = performance.now() - loadStartTime;
        console.timeEnd('⏱️ ActivitiesLoadMore');
        console.log(`✅ Chargé ${data.activities.length} activités en ${loadDuration.toFixed(2)}ms`);
      }
    } catch (err: unknown) {
      // L'erreur est déjà gérée par useRetryFetch et mise à jour dans fetchError
      // On synchronise avec l'état local pour compatibilité
      let message = 'Erreur lors du chargement';
      if (err instanceof TypeError) {
        message = err.message.includes('network') 
          ? 'Erreur de connexion réseau. Vérifiez votre connexion.'
          : 'Erreur réseau lors du chargement des activités';
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      
      // Logger l'erreur complète en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[ERROR] Erreur lors du chargement des activités:', err);
        console.timeEnd('⏱️ ActivitiesLoadMore');
      }
    }
  }, [searchParams, isLoading, fetchWithRetry]);

  return {
    activities,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  };
}
