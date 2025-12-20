'use client';

/**
 * Hook pour gérer le chargement infini des tâches
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (chargement paginé des tâches)
 * - Gestion complète de l'état (tasks, hasMore, isLoading, error)
 * - Logique de retry pour les erreurs réseau
 * - Fusion intelligente des tâches (évite les doublons)
 * - Réinitialisation automatique lors des changements de filtres
 * 
 * Pattern similaire à useActivitiesInfiniteLoad pour cohérence
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { TaskWithRelations } from '@/types/task-with-relations';
import type { TaskQuickFilter } from '@/types/task-filters';
import type { TaskSortColumn, SortDirection } from '@/types/task-sort';
import { useRetryFetch } from '@/hooks/use-retry-fetch';

const ITEMS_PER_PAGE = 25;

type UseTasksInfiniteLoadProps = {
  /**
   * Tâches initiales chargées par le Server Component
   */
  initialTasks: TaskWithRelations[];

  /**
   * Indique s'il reste des tâches à charger
   */
  initialHasMore: boolean;

  /**
   * Filtres pour le chargement
   */
  search?: string;
  quickFilter?: TaskQuickFilter;
  currentProfileId?: string | null;

  /**
   * Tri pour le chargement (colonne et direction)
   */
  sort?: { column: TaskSortColumn; direction: SortDirection };

  /**
   * SearchParams de l'URL (stabilisés)
   */
  searchParams: ReadonlyURLSearchParams;
};

type UseTasksInfiniteLoadReturn = {
  /**
   * Liste des tâches chargées
   */
  tasks: TaskWithRelations[];

  /**
   * Indique s'il reste des tâches à charger
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
   * Fonction pour charger plus de tâches
   */
  loadMore: () => Promise<void>;

  /**
   * Clé de filtrage pour détecter les changements de filtres
   */
  filterKey: string;
};

/**
 * Fusionne deux tableaux de tâches sans doublons
 * 
 * @param existing - Tâches existantes
 * @param newItems - Nouvelles tâches à fusionner
 * @returns Tableau fusionné sans doublons
 */
function mergeTasksWithoutDuplicates(
  existing: TaskWithRelations[],
  newItems: TaskWithRelations[]
): TaskWithRelations[] {
  const existingIds = new Set(existing.map((t) => t.id));
  const uniqueNewItems = newItems.filter((t) => !existingIds.has(t.id));
  return [...existing, ...uniqueNewItems];
}

/**
 * Construit les paramètres de requête pour charger des tâches
 * 
 * @param offset - Décalage pour la pagination
 * @param limit - Nombre d'éléments par page
 * @param search - Terme de recherche
 * @param quickFilter - Filtre rapide
 * @param currentProfileId - ID du profil utilisateur
 * @param sort - Tri (column et direction)
 * @param searchParams - SearchParams de l'URL
 * @returns URLSearchParams pour la requête
 */
function buildTaskListParams(
  offset: number,
  limit: number,
  search?: string,
  quickFilter?: TaskQuickFilter,
  currentProfileId?: string | null,
  sort?: { column: TaskSortColumn; direction: SortDirection },
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
  
  if (sort?.column) {
    params.set('sort', `${sort.column}:${sort.direction}`);
  }
  
  return params;
}

/**
 * Hook pour gérer le chargement infini des tâches
 * 
 * Gère automatiquement :
 * - L'état des tâches chargées
 * - Le chargement paginé via l'API
 * - Les erreurs avec retry automatique
 * - La réinitialisation lors des changements de filtres
 * 
 * @param props - Propriétés du hook
 * @returns État et fonctions pour gérer le chargement infini
 */
export function useTasksInfiniteLoad({
  initialTasks,
  initialHasMore,
  search,
  quickFilter,
  currentProfileId,
  sort,
  searchParams
}: UseTasksInfiniteLoadProps): UseTasksInfiniteLoadReturn {
  // État des tâches
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de retry pour les requêtes fetch
  const { fetchWithRetry, isLoading, error: fetchError } = useRetryFetch({
    maxRetries: 2,
    retryDelay: 1000,
    timeout: 30000,
    onRetry: (attemptNumber) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[useTasksInfiniteLoad] Retry ${attemptNumber}/2`);
      }
    }
  });

  // Refs pour optimiser les performances et éviter les re-renders
  const tasksLengthRef = useRef(initialTasks.length);
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
    sort,
  });

  // Créer une clé de filtrage pour détecter les changements
  const filterKey = useMemo(() => {
    const normalizedSearch = search || '';
    const normalizedQuickFilter = quickFilter || '';
    const normalizedProfileId = currentProfileId || '';
    
    return `${normalizedSearch}-${normalizedQuickFilter}-${normalizedProfileId}`;
  }, [search, quickFilter, currentProfileId]);

  // Réinitialiser les tâches quand les filtres changent OU quand initialTasks/initialHasMore changent
  const prevFilterKeyRef = useRef<string | null>(null);
  const prevInitialTasksIdsRef = useRef<string>(
    initialTasks.map(t => t.id).join(',')
  );
  const prevInitialHasMoreRef = useRef<boolean>(initialHasMore);

  useEffect(() => {
    // Créer une clé pour identifier les tâches initiales (par IDs)
    const currentInitialTasksIds = initialTasks.map(t => t.id).join(',');
    
    // Détecter les changements
    const filterKeyChanged = prevFilterKeyRef.current !== null && prevFilterKeyRef.current !== filterKey;
    const initialTasksIdsChanged = prevInitialTasksIdsRef.current !== currentInitialTasksIds;
    const initialHasMoreChanged = prevInitialHasMoreRef.current !== initialHasMore;
    
    // Réinitialiser si les filtres ont changé (changement complet)
    if (filterKeyChanged) {
      // Utiliser requestAnimationFrame pour éviter les cascades de renders
      requestAnimationFrame(() => {
        setTasks(initialTasks);
        setHasMore(initialHasMore);
        setError(null);
      });
      tasksLengthRef.current = initialTasks.length;
      hasMoreRef.current = initialHasMore;
      
      // Mettre à jour les refs
      prevFilterKeyRef.current = filterKey;
      prevInitialTasksIdsRef.current = currentInitialTasksIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return;
    }
    
    // Si les tâches initiales ont changé (IDs différents), réinitialiser
    if (initialTasksIdsChanged) {
      setTasks(initialTasks);
      setHasMore(initialHasMore);
      tasksLengthRef.current = initialTasks.length;
      hasMoreRef.current = initialHasMore;
      setError(null);
      
      // Mettre à jour les refs
      prevInitialTasksIdsRef.current = currentInitialTasksIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return;
    }
    
    // Si seul hasMore a changé, mettre à jour uniquement hasMore
    if (initialHasMoreChanged) {
      setHasMore(initialHasMore);
      hasMoreRef.current = initialHasMore;
      prevInitialHasMoreRef.current = initialHasMore;
    }
  }, [filterKey, initialTasks, initialHasMore]);

  // Mettre à jour les refs quand les filtres changent
  useEffect(() => {
    filtersRef.current = {
      search,
      quickFilter,
      currentProfileId,
      sort,
    };
  }, [search, quickFilter, currentProfileId, sort]);

  // Mettre à jour la ref pour hasMore
  useEffect(() => {
    if (hasMoreRef.current !== hasMore) {
      hasMoreRef.current = hasMore;
    }
  }, [hasMore]);

  /**
   * Charge plus de tâches via l'API
   * 
   * Gère automatiquement :
   * - Les retries en cas d'erreur réseau (via useRetryFetch)
   * - La fusion des tâches sans doublons
   * - La mise à jour de l'état (hasMore, error)
   */
  const loadMore = useCallback(async () => {
    // Utiliser les refs pour éviter les dépendances
    if (isLoading || !hasMoreRef.current) return;

    // Mesure du temps de chargement (dev uniquement)
    const loadStartTime = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.time('⏱️ TasksLoadMore');
    }

    setError(null);

    try {
      const currentLength = tasksLengthRef.current;
      const filters = filtersRef.current;

      // Construire les paramètres de la requête
      const params = buildTaskListParams(
        currentLength,
        ITEMS_PER_PAGE,
        filters.search,
        filters.quickFilter,
        filters.currentProfileId,
        filters.sort,
        searchParams
      );

      // Utiliser le hook useRetryFetch pour gérer les retries automatiquement
      const response = await fetchWithRetry(`/api/tasks/list?${params.toString()}`);
      const data = await response.json();

      // Fusionner les tâches avec les utilitaires extraits
      // Utiliser flushSync pour forcer la mise à jour synchrone
      flushSync(() => {
        setTasks((prev) => {
          // Vérifier rapidement si les nouvelles tâches existent déjà
          const existingIds = new Set(prev.map((t) => t.id));
          const trulyNewTasks = data.tasks.filter((t: TaskWithRelations) => !existingIds.has(t.id));
          
          // Si aucune nouvelle tâche, ne pas déclencher de re-render
          if (trulyNewTasks.length === 0) {
            return prev;
          }
          
          // Fusionner uniquement les nouvelles tâches
          const updated = mergeTasksWithoutDuplicates(prev, data.tasks);
          tasksLengthRef.current = updated.length;
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
        console.timeEnd('⏱️ TasksLoadMore');
        console.log(`✅ Chargé ${data.tasks.length} tâches en ${loadDuration.toFixed(2)}ms`);
      }
    } catch (err: unknown) {
      // L'erreur est déjà gérée par useRetryFetch et mise à jour dans fetchError
      // On synchronise avec l'état local pour compatibilité
      let message = 'Erreur lors du chargement';
      if (err instanceof TypeError) {
        message = err.message.includes('network') 
          ? 'Erreur de connexion réseau. Vérifiez votre connexion.'
          : 'Erreur réseau lors du chargement des tâches';
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      
      // Logger l'erreur complète en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[ERROR] Erreur lors du chargement des tâches:', err);
        console.timeEnd('⏱️ TasksLoadMore');
      }
    }
  }, [searchParams, isLoading, fetchWithRetry]);

  return {
    tasks,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  };
}

