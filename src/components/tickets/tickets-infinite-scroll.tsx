'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
// ✅ PHASE 5 - ÉTAPE 1 : flushSync est maintenant utilisé dans useTicketsInfiniteLoad()
// ✅ PHASE 5 - ÉTAPE 4 : Link, Eye, Edit, Badge sont maintenant utilisés dans TicketRow
import { Loader2, CheckSquare2, Square, MessageSquare } from 'lucide-react';
import { Button } from '@/ui/button';
// ✅ PHASE 5 - ÉTAPE 5 : Checkbox est maintenant utilisé dans TicketsTableHeader
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip';
import { ColumnsConfigDialog } from '@/components/tickets/columns-config-dialog';
import { getVisibleColumns, type ColumnId } from '@/lib/utils/column-preferences';
import { parseADFToText } from '@/lib/utils/adf-parser';
import { getStatusBadgeVariant } from '@/lib/utils/ticket-status';
// ✅ PHASE 5 - ÉTAPE 4 : Les fonctions utilitaires sont maintenant utilisées dans TicketRow
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketWithRelations } from '@/types/ticket-with-relations';
import { useAuth, useTicketSelection } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useStableSearchParams } from '@/hooks/use-stable-search-params';
// ✅ PHASE 5 - ÉTAPE 4 : AnalysisButton, TicketStatsTooltip, UserStatsTooltip, AddCommentDialog sont maintenant utilisés dans TicketRow
// ✅ PHASE 5 - ÉTAPE 5 : SortableTableHeader est maintenant utilisé dans TicketsTableHeader
import { useTicketsSort } from '@/hooks/tickets/use-tickets-sort';
import { useTicketsInfiniteLoad } from '@/hooks/tickets/use-tickets-infinite-load';
import { BulkActionsBar } from './bulk-actions-bar';
import { useRenderCount, usePerformanceMeasure } from '@/hooks/performance';
// ✅ PHASE 5 - ÉTAPE 1 : areTicketIdsEqual n'est plus utilisé (réinitialisation gérée par le hook)
// ✅ PHASE 5 - ÉTAPE 1 : buildTicketListParams, mergeTicketsWithoutDuplicates, logTicketsLoadPerformance sont maintenant dans useTicketsInfiniteLoad
import { LoadMoreButton } from './tickets-infinite-scroll/load-more-button';
import { TicketRow } from './tickets-infinite-scroll/ticket-row';
import { TicketsTableHeader } from './tickets-infinite-scroll/tickets-table-header';

type TicketsInfiniteScrollProps = {
  initialTickets: TicketWithRelations[];
  initialHasMore: boolean;
  initialTotal: number;
  type?: string;
  status?: string;
  search?: string;
  quickFilter?: QuickFilter;
  currentProfileId?: string;
};

// ✅ PHASE 5 - ÉTAPE 1 : ITEMS_PER_PAGE est maintenant dans useTicketsInfiniteLoad

/**
 * Composant TicketsInfiniteScroll - Version interne non memoizée
 * 
 * Logique principale du composant.
 */
function TicketsInfiniteScrollComponent({
  initialTickets,
  initialHasMore,
  initialTotal,
  type,
  status,
  search,
  quickFilter,
  currentProfileId
}: TicketsInfiniteScrollProps) {
  const router = useRouter();
  const searchParams = useStableSearchParams();
  const authState = useAuth();
  
  // ✅ PHASE 5 - ÉTAPE 3 : Utiliser le hook de tri extrait
  const {
    currentSort,
    currentSortDirection,
    handleSort,
    sortColumnValue,
    sortDirectionValue
  } = useTicketsSort();
  
  // Mémoriser le rôle avec une ref pour éviter les re-renders
  // Comparer les valeurs réelles plutôt que la référence de l'objet
  const roleRef = useRef(authState.role);
  if (roleRef.current !== authState.role) {
    roleRef.current = authState.role;
  }
  const role = roleRef.current;
  
  // Mémoriser canEdit pour éviter les recalculs
  const canEdit = useMemo(() => {
    return role === 'admin' || role === 'manager';
  }, [role]);
  
  // searchParams est déjà stabilisé par useStableSearchParams()
  // Pas besoin de duplication supplémentaire
  
  // Mesures de performance (dev uniquement)
  // DÉSACTIVÉ TEMPORAIREMENT pour éviter les re-renders dus aux hooks de mesure
  // Note: Les logs sont réduits automatiquement par le hook (seulement si > 1 render)
  // const renderCount = useRenderCount({
  //   componentName: 'TicketsInfiniteScroll',
  //   warningThreshold: 10,
  //   logToConsole: process.env.NODE_ENV === 'development',
  // });
  
  // ✅ PHASE 5 - ÉTAPE 1 : La logique de chargement est maintenant dans useTicketsInfiniteLoad()
  const {
    tickets,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  } = useTicketsInfiniteLoad({
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
  });
  // Initialiser avec toutes les colonnes par défaut pour éviter l'erreur d'hydratation
  // Les préférences seront chargées après le montage côté client uniquement
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    // Toujours retourner toutes les colonnes par défaut pour l'hydratation
    return new Set(['title', 'type', 'status', 'priority', 'canal', 'company', 'product', 'module', 'jira', 'created_at', 'reporter', 'assigned'] as ColumnId[]);
  });
  const [isMounted, setIsMounted] = useState(false);

  // Gestion de la sélection multiple
  const {
    selectedTicketIdsArray,
    selectedCount,
    toggleTicketSelection,
    selectAllTickets,
    clearSelection,
    isTicketSelected,
    areAllTicketsSelected,
    areSomeTicketsSelected
  } = useTicketSelection();

  // Stabiliser clearSelection avec une ref pour éviter les dépendances dans useEffect
  const clearSelectionRef = useRef(clearSelection);
  clearSelectionRef.current = clearSelection;

  // ✅ PHASE 5 - ÉTAPE 1 : filterKey est maintenant fourni par useTicketsInfiniteLoad()
  
  // Réinitialiser la sélection quand les filtres changent
  // Utilise une ref pour éviter la dépendance à clearSelection et les boucles
  const prevFilterKeyForSelectionRef = useRef<string | null>(null);
  
  // Utiliser useEffect avec une garde stricte pour éviter les boucles
  useEffect(() => {
    // Ne réinitialiser que si filterKey a réellement changé
    if (prevFilterKeyForSelectionRef.current !== filterKey) {
      prevFilterKeyForSelectionRef.current = filterKey;
      // Utiliser setTimeout pour éviter les mises à jour pendant le render
      const timeoutId = setTimeout(() => {
        clearSelectionRef.current();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [filterKey]); // Dépendance uniquement à filterKey, pas à clearSelection

  /**
   * Initialiser les colonnes visibles après le montage
   * Une seule fois au montage pour éviter les re-renders.
   */
  useEffect(() => {
    setIsMounted(true);
    setVisibleColumns(getVisibleColumns());
  }, []);

  // ✅ PHASE 5 - ÉTAPE 3 : La logique de tri est maintenant dans useTicketsSort()
  // handleSort, currentSort, currentSortDirection, sortColumnValue, sortDirectionValue sont fournis par le hook

  // ✅ PHASE 5 - ÉTAPE 4 : highlightSearchTerm est maintenant utilisé dans TicketRow

  /**
   * Handler pour l'édition d'un ticket
   * Redirige vers la page de détail du ticket avec le paramètre edit
   * 
   * @param ticketId - ID du ticket à éditer
   */
  const handleEdit = useCallback((ticketId: string) => {
    router.push(`/gestion/tickets/${ticketId}?edit=true`);
  }, [router]);

  // ✅ PHASE 5 - ÉTAPE 1 : La logique de chargement (filtersRef, loadMoreRef, etc.) est maintenant dans useTicketsInfiniteLoad()

  // ✅ SIMPLIFIÉ : Avec le refactoring, les causes racines sont corrigées
  // Plus besoin de protection agressive, juste la restauration après "Voir plus"
  // 
  // Le refactoring a corrigé :
  // - Recompilations réduites → Plus de re-renders inutiles
  // - searchParams stabilisés → Plus de changements de référence
  // - router.refresh() supprimés → Plus de recompilations forcées
  // - Composant simplifié → Moins de re-renders
  //
  // Next.js gère automatiquement le scroll restoration pour les client-side transitions,
  // mais pour l'infinite scroll, on restaure manuellement après chargement.
  useLayoutEffect(() => {
    // Restaurer le scroll après le chargement de nouveaux tickets
    // L'ID du ticket est sauvegardé dans LoadMoreButton avant le clic
    const storedTicketId = sessionStorage.getItem('tickets-scroll-ticket-id');
    if (storedTicketId && !isLoading && tickets.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        const ticketElement = document.getElementById(storedTicketId);
        if (ticketElement) {
          ticketElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          sessionStorage.removeItem('tickets-scroll-ticket-id');
        }
      });
    }
  }, [tickets, isLoading]);

  // Fonction wrapper stable pour compatibilité
  // ✅ PHASE 5 - ÉTAPE 1 : loadMore est maintenant fourni directement par useTicketsInfiniteLoad()
  // La sauvegarde de la position se fait dans le bouton lui-même (load-more-button.tsx)

  // Référence stable pour les tickets initiaux (évite les re-renders)
  // Comparer par IDs plutôt que par référence pour éviter les mises à jour inutiles
  // ✅ PHASE 5 - ÉTAPE 1 : La réinitialisation des tickets est maintenant gérée par useTicketsInfiniteLoad()
  // Le hook réinitialise automatiquement les tickets quand filterKey ou initialTickets changent


  if (tickets.length === 0 && !isLoading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Aucun ticket enregistré pour le moment.
      </p>
    );
  }

  // ✅ PHASE 5 - ÉTAPE 4 : Les fonctions utilitaires sont maintenant utilisées dans TicketRow

  // Utiliser toutes les colonnes pendant l'hydratation, puis les préférences après le montage
  const isColumnVisible = (columnId: ColumnId) => {
    if (!isMounted) {
      // Pendant l'hydratation, utiliser toutes les colonnes pour éviter les erreurs
      return true;
    }
    return visibleColumns.has(columnId);
  };

  return (
    <TooltipProvider>
      <div className="space-y-3" style={{ overflowAnchor: 'none' }} data-scroll-container>
        {/* Barre d'actions flottante pour les tickets sélectionnés */}
        {selectedCount > 0 && (
          <BulkActionsBar
            selectedTicketIds={selectedTicketIdsArray}
            tickets={tickets}
            onClearSelection={clearSelection}
          />
        )}
        <div className="flex justify-end">
          <ColumnsConfigDialog onColumnsChange={setVisibleColumns} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            {/* ✅ PHASE 5 - ÉTAPE 5 : L'en-tête est maintenant dans le composant TicketsTableHeader */}
            <TicketsTableHeader
              tickets={tickets}
              areAllTicketsSelected={areAllTicketsSelected}
              areSomeTicketsSelected={areSomeTicketsSelected}
              selectAllTickets={selectAllTickets}
              clearSelection={clearSelection}
              currentSort={currentSort}
              currentSortDirection={currentSortDirection}
              handleSort={handleSort}
              isColumnVisible={isColumnVisible}
            />
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                isTicketSelected={isTicketSelected}
                toggleTicketSelection={toggleTicketSelection}
                handleEdit={handleEdit}
                canEdit={canEdit}
                search={search}
                isColumnVisible={isColumnVisible}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex flex-col items-center gap-2 py-6">
          <p className="text-sm text-status-danger">{error}</p>
          <Button size="sm" onClick={() => loadMore()}>
            Réessayer
          </Button>
        </div>
      )}

      {/* Bouton "Voir plus" */}
      {!error && (
        <LoadMoreButton
          onLoadMore={loadMore}
          isLoading={isLoading}
          hasMore={hasMore}
          label="Voir plus"
        />
      )}

      {/* Message de fin de liste */}
      {!hasMore && !isLoading && tickets.length > 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tous les tickets ont été chargés ({tickets.length} sur {initialTotal})
          </p>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Fonction de comparaison optimisée pour React.memo
 * 
 * Compare en profondeur les props pour éviter les re-renders inutiles.
 * Vérifie d'abord les props primitives, puis compare les IDs des tickets.
 * 
 * OPTIMISÉ : Normalise les valeurs undefined/null pour éviter les comparaisons fausses
 */
function arePropsEqual(
  prevProps: TicketsInfiniteScrollProps,
  nextProps: TicketsInfiniteScrollProps
): boolean {
  // Normaliser les valeurs undefined/null pour comparaison stricte
  const normalize = (val: string | undefined) => val ?? '';
  
  // Comparer les props primitives en premier (rapide)
  // Normaliser undefined/null pour comparaison stricte
  if (
    prevProps.initialHasMore !== nextProps.initialHasMore ||
    prevProps.initialTotal !== nextProps.initialTotal ||
    normalize(prevProps.type) !== normalize(nextProps.type) ||
    normalize(prevProps.status) !== normalize(nextProps.status) ||
    normalize(prevProps.search) !== normalize(nextProps.search) ||
    normalize(prevProps.quickFilter) !== normalize(nextProps.quickFilter) ||
    normalize(prevProps.currentProfileId) !== normalize(nextProps.currentProfileId)
  ) {
    return false; // Props différentes = re-render
  }

  // Comparer initialTickets : d'abord par référence (le plus rapide)
  if (prevProps.initialTickets === nextProps.initialTickets) {
    return true; // Même référence = pas de re-render
  }

  // Ensuite par longueur
  if (prevProps.initialTickets.length !== nextProps.initialTickets.length) {
    return false; // Longueur différente = re-render
  }

  // Si longueur identique mais référence différente, comparer par IDs uniquement
  // On ignore l'ordre car cela ne nécessite pas un re-render si les IDs sont identiques
  // (le composant gère l'affichage basé sur son état interne)
  for (let i = 0; i < prevProps.initialTickets.length; i++) {
    if (prevProps.initialTickets[i].id !== nextProps.initialTickets[i].id) {
      return false; // IDs différents = re-render
    }
  }

  // Toutes les props sont identiques (mêmes IDs, mêmes valeurs primitives) = pas de re-render
  return true;
}

/**
 * Composant exporté avec memoization pour éviter les re-renders inutiles
 * 
 * Ne se re-rend que si les props changent réellement.
 * Utilise une comparaison personnalisée optimisée pour éviter les re-renders
 * si les arrays initialTickets ont les mêmes IDs dans le même ordre.
 */
export const TicketsInfiniteScroll = React.memo(
  TicketsInfiniteScrollComponent,
  arePropsEqual
);

TicketsInfiniteScroll.displayName = 'TicketsInfiniteScroll';

