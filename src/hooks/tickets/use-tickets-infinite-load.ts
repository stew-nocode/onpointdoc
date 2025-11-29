'use client';

/**
 * Hook pour gérer le chargement infini des tickets
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (chargement paginé des tickets)
 * - Gestion complète de l'état (tickets, hasMore, isLoading, error)
 * - Logique de retry pour les erreurs réseau
 * - Fusion intelligente des tickets (évite les doublons)
 * - Réinitialisation automatique lors des changements de filtres
 * 
 * ✅ PHASE 5 - ÉTAPE 1 : Hook extrait pour réduire la complexité du composant parent
 * 
 * Responsabilités :
 * - Gérer l'état des tickets chargés
 * - Charger plus de tickets via l'API
 * - Gérer les erreurs avec retry automatique
 * - Réinitialiser les tickets quand les filtres changent
 * - Optimiser les performances avec des refs stables
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { TicketWithRelations } from '@/types/ticket-with-relations';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';
import { buildTicketListParams } from '@/components/tickets/tickets-infinite-scroll/utils/filter-params-builder';
import { mergeTicketsWithoutDuplicates } from '@/components/tickets/tickets-infinite-scroll/utils/tickets-state-updater';
import { logTicketsLoadPerformance } from '@/components/tickets/tickets-infinite-scroll/utils/performance-logger';
import { areTicketIdsEqual } from '@/components/tickets/tickets-infinite-scroll/utils/tickets-reset';

const ITEMS_PER_PAGE = 25;

type UseTicketsInfiniteLoadProps = {
  /**
   * Tickets initiaux chargés par le Server Component
   */
  initialTickets: TicketWithRelations[];

  /**
   * Indique s'il reste des tickets à charger
   */
  initialHasMore: boolean;

  /**
   * Filtres pour le chargement
   */
  type?: string;
  status?: string;
  search?: string;
  quickFilter?: QuickFilter;
  currentProfileId?: string;

  /**
   * Paramètres de tri
   */
  currentSort: TicketSortColumn;
  currentSortDirection: SortDirection;

  /**
   * SearchParams de l'URL (stabilisés)
   */
  searchParams: ReadonlyURLSearchParams;
};

type UseTicketsInfiniteLoadReturn = {
  /**
   * Liste des tickets chargés
   */
  tickets: TicketWithRelations[];

  /**
   * Indique s'il reste des tickets à charger
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
   * Fonction pour charger plus de tickets
   */
  loadMore: () => Promise<void>;

  /**
   * Clé de filtrage pour détecter les changements de filtres
   */
  filterKey: string;
};

/**
 * Hook pour gérer le chargement infini des tickets
 * 
 * Gère automatiquement :
 * - L'état des tickets chargés
 * - Le chargement paginé via l'API
 * - Les erreurs avec retry automatique
 * - La réinitialisation lors des changements de filtres
 * 
 * @param props - Propriétés du hook
 * @returns État et fonctions pour gérer le chargement infini
 * 
 * @example
 * ```tsx
 * const { tickets, hasMore, isLoading, error, loadMore } = useTicketsInfiniteLoad({
 *   initialTickets,
 *   initialHasMore,
 *   type,
 *   status,
 *   search,
 *   quickFilter,
 *   currentProfileId,
 *   currentSort,
 *   currentSortDirection,
 *   searchParams
 * });
 * ```
 */
export function useTicketsInfiniteLoad({
  initialTickets,
  initialHasMore,
  type,
  status,
  search,
  quickFilter,
  currentProfileId,
  currentSort,
  currentSortDirection,
  searchParams
}: UseTicketsInfiniteLoadProps): UseTicketsInfiniteLoadReturn {
  // État des tickets
  const [tickets, setTickets] = useState<TicketWithRelations[]>(initialTickets);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs pour optimiser les performances et éviter les re-renders
  const ticketsLengthRef = useRef(initialTickets.length);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);

  // Référence stable pour les filtres (évite les re-créations de loadMore)
  const filtersRef = useRef({
    type,
    status,
    search,
    quickFilter,
    currentProfileId,
    currentSort,
    currentSortDirection,
  });

  // Créer une clé de filtrage pour détecter les changements
  const filterKey = useMemo(() => {
    const normalizedType = type || '';
    const normalizedStatus = status || '';
    const normalizedSearch = search || '';
    const normalizedQuickFilter = quickFilter || '';
    const normalizedSortColumn = currentSort || '';
    const normalizedSortDirection = currentSortDirection || '';
    
    return `${normalizedType}-${normalizedStatus}-${normalizedSearch}-${normalizedQuickFilter}-${normalizedSortColumn}-${normalizedSortDirection}`;
  }, [type, status, search, quickFilter, currentSort, currentSortDirection]);

  // Réinitialiser les tickets quand les filtres changent OU quand initialTickets/initialHasMore changent
  // (par exemple après une revalidation du Server Component)
  const prevFilterKeyRef = useRef<string | null>(null);
  const prevInitialTicketsIdsRef = useRef<string>(
    initialTickets.map(t => t.id).join(',')
  );
  const prevInitialHasMoreRef = useRef<boolean>(initialHasMore);

  useEffect(() => {
    // Créer une clé pour identifier les tickets initiaux (par IDs)
    const currentInitialTicketsIds = initialTickets.map(t => t.id).join(',');
    
    // Détecter les changements
    const filterKeyChanged = prevFilterKeyRef.current !== null && prevFilterKeyRef.current !== filterKey;
    const initialTicketsIdsChanged = prevInitialTicketsIdsRef.current !== currentInitialTicketsIds;
    const initialHasMoreChanged = prevInitialHasMoreRef.current !== initialHasMore;
    
    // Réinitialiser si les filtres ont changé (changement complet)
    if (filterKeyChanged) {
      setTickets(initialTickets);
      setHasMore(initialHasMore);
      ticketsLengthRef.current = initialTickets.length;
      hasMoreRef.current = initialHasMore;
      setError(null);
      
      // Mettre à jour les refs
      prevFilterKeyRef.current = filterKey;
      prevInitialTicketsIdsRef.current = currentInitialTicketsIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return; // Sortir tôt pour éviter les traitements supplémentaires
    }
    
    // Si les tickets initiaux ont changé (IDs différents), réinitialiser
    // Cela peut arriver après une revalidation du Server Component
    if (initialTicketsIdsChanged) {
      setTickets(initialTickets);
      setHasMore(initialHasMore);
      ticketsLengthRef.current = initialTickets.length;
      hasMoreRef.current = initialHasMore;
      setError(null);
      
      // Mettre à jour les refs
      prevInitialTicketsIdsRef.current = currentInitialTicketsIds;
      prevInitialHasMoreRef.current = initialHasMore;
      return;
    }
    
    // Si seul hasMore a changé, mettre à jour uniquement hasMore
    if (initialHasMoreChanged) {
      setHasMore(initialHasMore);
      hasMoreRef.current = initialHasMore;
      prevInitialHasMoreRef.current = initialHasMore;
    }
  }, [filterKey, initialTickets, initialHasMore]);

  // Mettre à jour les refs quand les filtres changent
  useEffect(() => {
    filtersRef.current = {
      type,
      status,
      search,
      quickFilter,
      currentProfileId,
      currentSort,
      currentSortDirection,
    };
  }, [type, status, search, quickFilter, currentProfileId, currentSort, currentSortDirection]);

  // Mettre à jour les refs pour isLoading et hasMore
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (hasMoreRef.current !== hasMore) {
      hasMoreRef.current = hasMore;
    }
  }, [hasMore]);

  /**
   * Charge plus de tickets via l'API
   * 
   * Gère automatiquement :
   * - Les retries en cas d'erreur réseau
   * - La fusion des tickets sans doublons
   * - La mise à jour de l'état (hasMore, error)
   * - Les logs de performance (dev uniquement)
   */
  const loadMore = useCallback(async () => {
    // Utiliser les refs pour éviter les dépendances
    if (isLoadingRef.current || !hasMoreRef.current) return;

    // Mesure du temps de chargement (dev uniquement)
    const loadStartTime = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.time('⏱️ TicketsLoadMore');
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const currentLength = ticketsLengthRef.current;
      const filters = filtersRef.current;

      // Construire les paramètres de la requête
      const params = buildTicketListParams(
        currentLength,
        ITEMS_PER_PAGE,
        filters.currentSort,
        filters.currentSortDirection,
        filters.type,
        filters.status,
        filters.search,
        filters.quickFilter,
        filters.currentProfileId,
        searchParams
      );

      // Gestion d'erreur avec retry pour les erreurs réseau
      let response: Response | null = null;
      let retries = 0;
      const maxRetries = 2;
      let lastError: Error | null = null;
      
      while (retries <= maxRetries) {
        try {
          response = await fetch(`/api/tickets/list?${params.toString()}`, {
            signal: AbortSignal.timeout(30000) // Timeout de 30 secondes
          });
          
          if (!response.ok) {
            // Si erreur serveur (500), retry une fois
            if (response.status >= 500 && retries < maxRetries) {
              retries++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Backoff exponentiel
              continue;
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }
          
          // Succès, sortir de la boucle
          break;
        } catch (fetchError: unknown) {
          // Gérer différents types d'erreurs réseau
          let errorMessage = 'Erreur réseau inconnue';
          if (fetchError instanceof TypeError) {
            errorMessage = fetchError.message || 'Erreur réseau';
          } else if (fetchError instanceof Error) {
            errorMessage = fetchError.message;
          }
          
          lastError = fetchError instanceof Error 
            ? fetchError 
            : new Error(errorMessage);
          
          // Si c'est une erreur réseau et qu'on peut retry
          if (retries < maxRetries && (
            fetchError instanceof TypeError ||
            (fetchError instanceof Error && (
              fetchError.name === 'AbortError' ||
              fetchError.message.toLowerCase().includes('network') ||
              fetchError.message.toLowerCase().includes('fetch')
            ))
          )) {
            retries++;
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[DEBUG] Tentative ${retries}/${maxRetries + 1} après erreur réseau:`, fetchError);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Backoff exponentiel
            continue;
          }
          
          // Erreur finale ou non retryable
          throw lastError;
        }
      }
      
      // Vérifier que response est défini
      if (!response) {
        throw lastError || new Error('Erreur réseau lors du chargement des tickets');
      }
      
      const data = await response.json();

      // Fusionner les tickets avec les utilitaires extraits
      // Utiliser flushSync pour forcer la mise à jour synchrone
      flushSync(() => {
        setTickets((prev) => {
          // Vérifier rapidement si les nouveaux tickets existent déjà
          const existingIds = new Set(prev.map((t) => t.id));
          const trulyNewTickets = data.tickets.filter((t: TicketWithRelations) => !existingIds.has(t.id));
          
          // Si aucun nouveau ticket, ne pas déclencher de re-render
          if (trulyNewTickets.length === 0) {
            return prev;
          }
          
          // Fusionner uniquement les nouveaux tickets
          const updated = mergeTicketsWithoutDuplicates(prev, data.tickets);
          ticketsLengthRef.current = updated.length;
          return updated;
        });

        // Mettre à jour hasMore seulement si la valeur a changé
        if (hasMoreRef.current !== data.hasMore) {
          hasMoreRef.current = data.hasMore;
          setHasMore(data.hasMore);
        }
      });

      // Logger avec l'utilitaire centralisé
      if (process.env.NODE_ENV === 'development') {
        const loadDuration = performance.now() - loadStartTime;
        console.timeEnd('⏱️ TicketsLoadMore');
        logTicketsLoadPerformance(loadDuration, data.tickets.length);
      }
    } catch (err: unknown) {
      // Gérer différents types d'erreurs réseau
      let message = 'Erreur lors du chargement';
      if (err instanceof TypeError) {
        message = err.message.includes('network') 
          ? 'Erreur de connexion réseau. Vérifiez votre connexion.'
          : 'Erreur réseau lors du chargement des tickets';
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setError(message);
      
      // Logger l'erreur complète en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('[ERROR] Erreur lors du chargement des tickets:', err);
        console.timeEnd('⏱️ TicketsLoadMore');
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [searchParams]);

  return {
    tickets,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  };
}

