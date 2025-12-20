'use client';

/**
 * Hook pour gérer le tri des tickets
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (gestion du tri)
 * - Fonction pure pour le parsing
 * - Synchronisation automatique avec l'URL
 * - Évite les re-renders inutiles avec useMemo et refs
 * 
 * Responsabilités :
 * - Extraire les paramètres de tri depuis l'URL (searchParams)
 * - Maintenir l'état local du tri synchronisé avec l'URL
 * - Fournir un handler pour changer le tri (met à jour l'URL)
 * - Stabiliser les valeurs pour éviter les re-renders
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import {
  parseTicketSort,
  DEFAULT_TICKET_SORT,
  type TicketSortColumn,
  type SortDirection
} from '@/types/ticket-sort';
import { useStableSearchParams } from '@/hooks/use-stable-search-params';

type UseTicketsSortReturn = {
  /**
   * Colonne de tri actuelle
   */
  currentSort: TicketSortColumn;

  /**
   * Direction de tri actuelle
   */
  currentSortDirection: SortDirection;

  /**
   * Handler pour changer le tri
   * Met à jour l'URL avec les nouveaux paramètres de tri
   */
  handleSort: (column: TicketSortColumn, direction: SortDirection) => void;

  /**
   * Valeurs primitives stabilisées pour utiliser dans filterKey
   * (évite de recréer filterKey à chaque render)
   */
  sortColumnValue: TicketSortColumn;
  sortDirectionValue: SortDirection;
};

/**
 * Hook pour gérer le tri des tickets
 * 
 * Synchronise automatiquement l'état local avec l'URL (searchParams).
 * Utilise des valeurs stabilisées pour éviter les re-renders inutiles.
 * 
 * @returns Objet contenant l'état du tri et le handler pour le changer
 * 
 * @example
 * ```tsx
 * const { currentSort, currentSortDirection, handleSort } = useTicketsSort();
 * 
 * // Utiliser dans un composant
 * <SortableHeader
 *   column="title"
 *   currentSortColumn={currentSort}
 *   currentSortDirection={currentSortDirection}
 *   onSort={handleSort}
 * />
 * ```
 */
export function useTicketsSort(): UseTicketsSortReturn {
  const router = useRouter();
  const searchParams = useStableSearchParams();

  // Parser les paramètres de tri depuis l'URL (stabilisé avec useMemo)
  const sortColumnParam = searchParams.get('sortColumn') || undefined;
  const sortDirectionParam = searchParams.get('sortDirection') || undefined;

  // Créer l'objet sort une seule fois et le stabiliser
  const sort = useMemo(() => {
    return parseTicketSort(sortColumnParam, sortDirectionParam);
  }, [sortColumnParam, sortDirectionParam]);

  // Stabiliser les valeurs primitives pour éviter les recréations inutiles
  const sortColumnValue = sort.column;
  const sortDirectionValue = sort.direction;

  // Initialiser les states avec les valeurs du tri depuis l'URL
  const [currentSort, setCurrentSort] = useState<TicketSortColumn>(() => sort.column);
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>(() => sort.direction);

  /**
   * Synchroniser le tri avec l'URL
   * 
   * OPTIMISÉ : Utilise les valeurs primitives stabilisées pour éviter les dépendances à l'objet sort
   * Ne synchronise que si les valeurs ont réellement changé
   */
  const prevSortColumnRef = useRef<TicketSortColumn>(sortColumnValue);
  const prevSortDirectionRef = useRef<SortDirection>(sortDirectionValue);

  useEffect(() => {
    // Vérifier si le tri a réellement changé (comparaison directe avec valeurs primitives)
    const sortChanged =
      prevSortColumnRef.current !== sortColumnValue ||
      prevSortDirectionRef.current !== sortDirectionValue;

    if (sortChanged) {
      // Mettre à jour les refs AVANT de mettre à jour les states
      prevSortColumnRef.current = sortColumnValue;
      prevSortDirectionRef.current = sortDirectionValue;

      // Utiliser une fonction de mise à jour pour éviter les re-renders si la valeur est identique
      // ✅ Synchronisation avec prop externe : pattern acceptable pour synchroniser l'état avec les props
       
      setCurrentSort((prev) => {
        if (prev !== sortColumnValue) {
          return sortColumnValue;
        }
        return prev;
      });
      setCurrentSortDirection((prev) => {
        if (prev !== sortDirectionValue) {
          return sortDirectionValue;
        }
        return prev;
      });
    }
  }, [sortColumnValue, sortDirectionValue]); // Dépendances strictes : valeurs primitives stabilisées

  /**
   * Handler pour le tri d'une colonne
   * Met à jour l'URL avec les nouveaux paramètres de tri
   * 
   * Utilise searchParams stabilisé par useStableSearchParams()
   */
  const handleSort = useCallback(
    (column: TicketSortColumn, direction: SortDirection) => {
      setCurrentSort(column);
      setCurrentSortDirection(direction);

      const params = new URLSearchParams(searchParams.toString());
      params.set('sortColumn', column);
      params.set('sortDirection', direction);

      router.push(`/gestion/tickets?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return {
    currentSort,
    currentSortDirection,
    handleSort,
    sortColumnValue,
    sortDirectionValue
  };
}

