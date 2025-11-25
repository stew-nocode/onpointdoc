'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Eye, Edit, Loader2, CheckSquare2, Square, MessageSquare } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip';
import { ColumnsConfigDialog } from '@/components/tickets/columns-config-dialog';
import { getVisibleColumns, type ColumnId } from '@/lib/utils/column-preferences';
import { parseADFToText } from '@/lib/utils/adf-parser';
import { getStatusBadgeVariant } from '@/lib/utils/ticket-status';
import {
  highlightText,
  getTicketTypeIcon,
  getPriorityColorClass,
  getUserInitials,
  getAvatarColorClass
} from './utils/ticket-display';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketWithRelations } from '@/types/ticket-with-relations';
import { useAuth, useTicketSelection } from '@/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnalysisButton } from '@/components/n8n/analysis-button';
import { SortableTableHeader } from './sortable-table-header';
import { parseTicketSort, DEFAULT_TICKET_SORT } from '@/types/ticket-sort';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';
import { BulkActionsBar } from './bulk-actions-bar';
import { TicketStatsTooltip } from './tooltips/ticket-stats-tooltip';
import { UserStatsTooltip } from './tooltips/user-stats-tooltip';
import { AddCommentDialog } from './add-comment-dialog';
import { useRenderCount, usePerformanceMeasure } from '@/hooks/performance';
import {
  buildTicketListParams,
} from './tickets-infinite-scroll/utils/filter-params-builder';
import {
  mergeTicketsWithoutDuplicates,
} from './tickets-infinite-scroll/utils/tickets-state-updater';
import { areTicketIdsEqual } from './tickets-infinite-scroll/utils/tickets-reset';
import { logTicketsLoadPerformance } from './tickets-infinite-scroll/utils/performance-logger';
import { LoadMoreButton } from './tickets-infinite-scroll/load-more-button';

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

const ITEMS_PER_PAGE = 25;

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
  const searchParams = useSearchParams();
  const { role } = useAuth();
  
  // Stabiliser searchParams avec une ref pour éviter les re-renders
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  
  // Mesures de performance (dev uniquement)
  const renderCount = useRenderCount({
    componentName: 'TicketsInfiniteScroll',
    warningThreshold: 10,
    logToConsole: process.env.NODE_ENV === 'development',
  });
  
  // Parser les paramètres de tri depuis l'URL (memoizé pour éviter les recalculs)
  const sort = useMemo(() => {
    const sortColumnParam = searchParamsRef.current.get('sortColumn') || undefined;
    const sortDirectionParam = searchParamsRef.current.get('sortDirection') || undefined;
    return parseTicketSort(sortColumnParam, sortDirectionParam);
  }, [searchParams]); // Seulement si searchParams change (référence)
  
  const [currentSort, setCurrentSort] = useState<TicketSortColumn>(sort.column);
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>(sort.direction);
  const [tickets, setTickets] = useState<TicketWithRelations[]>(initialTickets);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ticketsLengthRef = useRef(initialTickets.length);
  
  // Refs pour stabiliser les valeurs utilisées dans loadMore (évite les re-renders)
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  // Initialiser avec toutes les colonnes par défaut pour éviter l'erreur d'hydratation
  // Les préférences seront chargées après le montage côté client uniquement
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    // Toujours retourner toutes les colonnes par défaut pour l'hydratation
    return new Set(['title', 'type', 'status', 'priority', 'canal', 'company', 'product', 'module', 'jira', 'created_at', 'reporter', 'assigned'] as ColumnId[]);
  });
  const [isMounted, setIsMounted] = useState(false);
  
  // Vérifier les permissions pour l'édition (admin/manager)
  const canEdit = role === 'admin' || role === 'manager';

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

  /**
   * Réinitialiser la sélection quand les filtres changent
   * 
   * Mémorisé pour éviter les re-renders inutiles.
   */
  const filterKey = useMemo(
    () => `${type}-${status}-${search}-${quickFilter}-${currentSort}-${currentSortDirection}`,
    [type, status, search, quickFilter, currentSort, currentSortDirection]
  );

  // Réinitialiser la sélection quand les filtres changent
  // Utilise une ref pour éviter la dépendance à clearSelection
  useEffect(() => {
    clearSelectionRef.current();
  }, [filterKey]); // Pas de dépendance à clearSelection

  /**
   * Initialiser les colonnes visibles après le montage
   * Une seule fois au montage pour éviter les re-renders.
   */
  useEffect(() => {
    setIsMounted(true);
    setVisibleColumns(getVisibleColumns());
  }, []);

  /**
   * Synchroniser le tri avec l'URL au montage uniquement
   * Utilise une ref pour éviter les re-renders si le tri n'a pas changé
   */
  const sortInitializedRef = useRef(false);
  useEffect(() => {
    if (!sortInitializedRef.current) {
      setCurrentSort(sort.column);
      setCurrentSortDirection(sort.direction);
      sortInitializedRef.current = true;
    }
  }, [sort.column, sort.direction]);

  /**
   * Handler pour le tri d'une colonne
   * Met à jour l'URL avec les nouveaux paramètres de tri
   * 
   * Optimisé : utilise searchParamsRef déjà défini plus haut
   */
  const handleSort = useCallback(
    (column: TicketSortColumn, direction: SortDirection) => {
      setCurrentSort(column);
      setCurrentSortDirection(direction);

      const params = new URLSearchParams(searchParamsRef.current.toString());
      params.set('sortColumn', column);
      params.set('sortDirection', direction);

      router.push(`/gestion/tickets?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Utiliser la fonction utilitaire pour mettre en surbrillance les termes recherchés
  const highlightSearchTerm = useCallback(
    (text: string, searchTerm?: string) => highlightText(text, searchTerm),
    []
  );

  /**
   * Handler pour l'édition d'un ticket
   * Redirige vers la page de détail du ticket avec le paramètre edit
   * 
   * @param ticketId - ID du ticket à éditer
   */
  const handleEdit = useCallback((ticketId: string) => {
    router.push(`/gestion/tickets/${ticketId}?edit=true`);
  }, [router]);

  /**
   * Références stables pour les filtres (évite les re-créations de loadMore)
   */
  const filtersRef = useRef({
    type,
    status,
    search,
    quickFilter,
    currentProfileId,
    currentSort,
    currentSortDirection,
  });

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

  // Mettre à jour les refs pour isLoading et hasMore (évite les re-créations de loadMore)
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  /**
   * Charge plus de tickets via l'API
   * 
   * Optimisé avec utilitaires extraits et refs stables pour respecter Clean Code.
   * Utilise des refs pour isLoading et hasMore pour éviter les re-créations de la fonction.
   */
  const loadMoreRef = useRef<() => Promise<void>>();
  
  // Mettre à jour la fonction loadMore dans la ref
  loadMoreRef.current = async () => {
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

      // Construire les paramètres avec les utilitaires extraits
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
        searchParamsRef.current
      );

      const response = await fetch(`/api/tickets/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tickets');
      }

      const data = await response.json();

      // Fusionner les tickets avec les utilitaires extraits
      // Optimisation : vérifier s'il y a vraiment de nouveaux tickets avant de mettre à jour l'état
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

      // Logger avec l'utilitaire centralisé
      if (process.env.NODE_ENV === 'development') {
        const loadDuration = performance.now() - loadStartTime;
        console.timeEnd('⏱️ TicketsLoadMore');
        logTicketsLoadPerformance(loadDuration, data.tickets.length);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('⏱️ TicketsLoadMore');
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  // Fonction wrapper stable pour compatibilité
  const loadMore = useCallback(() => {
    loadMoreRef.current?.();
  }, []); // Pas de dépendances - utilise toujours la version actuelle dans la ref

  // Référence stable pour les tickets initiaux (évite les re-renders)
  const initialTicketsRef = useRef(initialTickets);
  const initialHasMoreRef = useRef(initialHasMore);

  // Mettre à jour les refs quand les props changent (sans déclencher de re-render)
  useEffect(() => {
    initialTicketsRef.current = initialTickets;
    initialHasMoreRef.current = initialHasMore;
  }, [initialTickets, initialHasMore]);

  /**
   * Réinitialiser les tickets quand les filtres changent
   * 
   * Utilise une comparaison par IDs pour éviter les re-renders inutiles.
   */
  useEffect(() => {
    setTickets((prev) => {
      // Comparer par IDs uniquement (évite les re-renders si contenu identique)
      if (areTicketIdsEqual(prev, initialTicketsRef.current)) {
        return prev;
      }

      ticketsLengthRef.current = initialTicketsRef.current.length;
      return initialTicketsRef.current;
    });
    setHasMore(initialHasMoreRef.current);
    setError(null);
  }, [type, status, search, quickFilter, currentSort, currentSortDirection]); // Pas de dépendance aux tickets


  if (tickets.length === 0 && !isLoading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Aucun ticket enregistré pour le moment.
      </p>
    );
  }

  // Wrappers pour compatibilité avec le code existant
  const getPriorityColor = getPriorityColorClass;
  const getInitials = getUserInitials;
  const getAvatarColor = getAvatarColorClass;

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
      <div className="space-y-3">
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
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                {/* Colonne checkbox Select All */}
                <th className="w-12 pb-2.5 pr-2">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={areAllTicketsSelected(tickets)}
                      indeterminate={areSomeTicketsSelected(tickets)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllTickets(tickets);
                        } else {
                          clearSelection();
                        }
                      }}
                      aria-label="Sélectionner tous les tickets"
                    />
                  </div>
                </th>
                {isColumnVisible('title') && (
                  <SortableTableHeader
                    column="title"
                    label="Titre"
                    currentSortColumn={currentSort}
                    currentSortDirection={currentSortDirection}
                    onSort={handleSort}
                  />
                )}
                {isColumnVisible('type') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Type
                  </th>
                )}
                {isColumnVisible('status') && (
                  <SortableTableHeader
                    column="status"
                    label="Statut"
                    currentSortColumn={currentSort}
                    currentSortDirection={currentSortDirection}
                    onSort={handleSort}
                  />
                )}
                {isColumnVisible('priority') && (
                  <SortableTableHeader
                    column="priority"
                    label="Priorité"
                    currentSortColumn={currentSort}
                    currentSortDirection={currentSortDirection}
                    onSort={handleSort}
                  />
                )}
                {isColumnVisible('canal') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Canal
                  </th>
                )}
                {isColumnVisible('company') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Entreprise
                  </th>
                )}
                {isColumnVisible('product') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Produit
                  </th>
                )}
                {isColumnVisible('module') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Module
                  </th>
                )}
                {isColumnVisible('jira') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Jira
                  </th>
                )}
                {isColumnVisible('created_at') && (
                  <SortableTableHeader
                    column="created_at"
                    label="Créé le"
                    currentSortColumn={currentSort}
                    currentSortDirection={currentSortDirection}
                    onSort={handleSort}
                  />
                )}
                {isColumnVisible('reporter') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Rapporteur
                  </th>
                )}
                {isColumnVisible('assigned') && (
                  <SortableTableHeader
                    column="assigned_to"
                    label="Assigné"
                    currentSortColumn={currentSort}
                    currentSortDirection={currentSortDirection}
                    onSort={handleSort}
                  />
                )}
                <th className="pb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" />
              </tr>
            </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Checkbox de sélection */}
                      <td className="w-12 py-2.5 pr-2">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isTicketSelected(ticket.id)}
                            onCheckedChange={() => toggleTicketSelection(ticket.id)}
                            aria-label={`Sélectionner le ticket ${ticket.title}`}
                          />
                        </div>
                      </td>
                      {/* Titre avec tooltip */}
                      {isColumnVisible('title') && (
                  <td className="py-2.5 pr-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 min-w-0">
                          <Link
                            href={`/gestion/tickets/${ticket.id}`}
                            className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info truncate block max-w-[300px]"
                          >
                            {search ? highlightSearchTerm(ticket.title, search) : ticket.title}
                          </Link>
                        </div>
                      </TooltipTrigger>
                      <TicketStatsTooltip
                        ticketId={ticket.id}
                        createdAt={ticket.created_at}
                        title={ticket.title}
                        description={ticket.description}
                        jiraIssueKey={ticket.jira_issue_key ?? null}
                      />
                    </Tooltip>
                  </td>
                )}

                {/* Type avec icône */}
                {isColumnVisible('type') && (
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      {getTicketTypeIcon(ticket.ticket_type)}
                      <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ticket.ticket_type}
                      </span>
                    </div>
                  </td>
                )}

                {/* Statut */}
                {isColumnVisible('status') && (
                  <td className="py-2.5 pr-4">
                    <Badge
                      variant={getStatusBadgeVariant(ticket.status)}
                      className="text-[10px] px-2 py-0.5 whitespace-nowrap"
                    >
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </td>
                )}

                {/* Priorité avec couleur */}
                {isColumnVisible('priority') && (
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-medium capitalize whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                )}

                {/* Canal */}
                {isColumnVisible('canal') && (
                  <td className="py-2.5 pr-4">
                    <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {ticket.canal || '-'}
                    </span>
                  </td>
                )}

                {/* Entreprise */}
                {isColumnVisible('company') && (
                  <td className="py-2.5 pr-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[150px]">
                          {ticket.company?.name || '-'}
                        </span>
                      </TooltipTrigger>
                      {ticket.company?.name && (
                        <TooltipContent>
                          <p>{ticket.company.name}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>
                )}

                {/* Produit */}
                {isColumnVisible('product') && (
                  <td className="py-2.5 pr-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[120px]">
                          {ticket.product?.name || '-'}
                        </span>
                      </TooltipTrigger>
                      {ticket.product?.name && (
                        <TooltipContent>
                          <p>{ticket.product.name}</p>
                          {ticket.module?.name && <p className="text-xs text-slate-400 mt-1">Module: {ticket.module.name}</p>}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>
                )}

                {/* Module */}
                {isColumnVisible('module') && (
                  <td className="py-2.5 pr-4">
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[120px]">
                      {ticket.module?.name || '-'}
                    </span>
                  </td>
                )}

                {/* Jira */}
                {isColumnVisible('jira') && (
                  <td className="py-2.5 pr-4">
                    {ticket.jira_issue_key ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                            {ticket.jira_issue_key}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ticket Jira: {ticket.jira_issue_key}</p>
                          <p className="text-xs text-slate-400 mt-1">Origine: {ticket.origin || 'Supabase'}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                )}

                {/* Date de création */}
                {isColumnVisible('created_at') && (
                  <td className="py-2.5 pr-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : '-'}
                        </span>
                      </TooltipTrigger>
                      {ticket.created_at && (
                        <TooltipContent>
                          <p>
                            {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>
                )}

                {/* Rapporteur avec avatar */}
                {isColumnVisible('reporter') && (
                  <td className="py-2.5 pr-4">
                    {ticket.created_user?.full_name ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${getAvatarColor(ticket.created_user.full_name)}`}
                            >
                              {getInitials(ticket.created_user.full_name)}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                              {ticket.created_user.full_name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <UserStatsTooltip
                          profileId={ticket.created_by ?? null}
                          type="reporter"
                        />
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                )}

                {/* Assigné avec avatar */}
                {isColumnVisible('assigned') && (
                  <td className="py-2.5 pr-4">
                    {ticket.assigned_user?.full_name ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${getAvatarColor(ticket.assigned_user.full_name)}`}
                            >
                              {getInitials(ticket.assigned_user.full_name)}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                              {ticket.assigned_user.full_name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <UserStatsTooltip
                          profileId={ticket.assigned_to ?? null}
                          type="assigned"
                        />
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                )}

                {/* Actions */}
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Voir les détails */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/gestion/tickets/${ticket.id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                          aria-label="Voir les détails"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Voir les détails</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Éditer - Admin/Manager uniquement */}
                    {canEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleEdit(ticket.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                            aria-label="Éditer le ticket"
                            type="button"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Éditer</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Générer une analyse - Tous les utilisateurs authentifiés */}
                    <AnalysisButton
                      context="ticket"
                      id={ticket.id}
                      tooltip="Générer une analyse IA"
                    />

                    {/* Ajouter un commentaire */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <AddCommentDialog ticketId={ticket.id} ticketTitle={ticket.title} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ajouter un commentaire</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </td>
              </tr>
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
 * Composant exporté avec memoization pour éviter les re-renders inutiles
 * 
 * Ne se re-rend que si les props changent réellement.
 * Utilise une comparaison personnalisée pour éviter les re-renders si les arrays
 * initialTickets ont les mêmes IDs même si la référence change.
 */
export const TicketsInfiniteScroll = React.memo(
  TicketsInfiniteScrollComponent,
  (prevProps, nextProps) => {
    // Comparer les props primitives
    if (
      prevProps.initialHasMore !== nextProps.initialHasMore ||
      prevProps.initialTotal !== nextProps.initialTotal ||
      prevProps.type !== nextProps.type ||
      prevProps.status !== nextProps.status ||
      prevProps.search !== nextProps.search ||
      prevProps.quickFilter !== nextProps.quickFilter ||
      prevProps.currentProfileId !== nextProps.currentProfileId
    ) {
      return false; // Props différentes = re-render
    }

    // Comparer initialTickets par IDs uniquement (évite les re-renders si contenu identique)
    if (prevProps.initialTickets.length !== nextProps.initialTickets.length) {
      return false; // Longueur différente = re-render
    }

    const prevIds = new Set(prevProps.initialTickets.map((t) => t.id));
    const nextIds = new Set(nextProps.initialTickets.map((t) => t.id));

    // Si les IDs sont identiques, pas de re-render
    if (prevIds.size !== nextIds.size) {
      return false;
    }

    for (const id of prevIds) {
      if (!nextIds.has(id)) {
        return false; // IDs différents = re-render
      }
    }

    // Props identiques = pas de re-render
    return true;
  }
);

TicketsInfiniteScroll.displayName = 'TicketsInfiniteScroll';

