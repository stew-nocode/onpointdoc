'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
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
} from '@/lib/utils/ticket-display';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketWithRelations } from '@/types/ticket-with-relations';

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

export function TicketsInfiniteScroll({
  initialTickets,
  initialHasMore,
  initialTotal,
  type,
  status,
  search,
  quickFilter,
  currentProfileId
}: TicketsInfiniteScrollProps) {
  const [tickets, setTickets] = useState<TicketWithRelations[]>(initialTickets);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ticketsLengthRef = useRef(initialTickets.length);
  // Initialiser avec toutes les colonnes par défaut pour éviter l'erreur d'hydratation
  // Les préférences seront chargées après le montage côté client uniquement
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    // Toujours retourner toutes les colonnes par défaut pour l'hydratation
    return new Set(['title', 'type', 'status', 'priority', 'canal', 'product', 'module', 'jira', 'created_at', 'reporter', 'assigned'] as ColumnId[]);
  });
  const [isMounted, setIsMounted] = useState(false);

  // Charger les colonnes visibles après le montage pour éviter l'erreur d'hydratation
  useEffect(() => {
    setIsMounted(true);
    setVisibleColumns(getVisibleColumns());
  }, []);

  // Utiliser la fonction utilitaire pour mettre en surbrillance les termes recherchés
  const highlightSearchTerm = useCallback(
    (text: string, searchTerm?: string) => highlightText(text, searchTerm),
    []
  );

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      // Utiliser la ref pour obtenir la longueur actuelle de manière synchrone
      const currentLength = ticketsLengthRef.current;

      const params = new URLSearchParams({
        offset: currentLength.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });

      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (quickFilter) params.set('quick', quickFilter);
      if (currentProfileId) params.set('currentProfileId', currentProfileId);

      const response = await fetch(`/api/tickets/list?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tickets');
      }

      const data = await response.json();
      
      // Filtrer les doublons en utilisant l'ID comme clé unique
      setTickets(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTickets = data.tickets.filter((t: TicketWithRelations) => !existingIds.has(t.id));
        const updated = [...prev, ...newTickets];
        ticketsLengthRef.current = updated.length;
        return updated;
      });
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, type, status, search, quickFilter, currentProfileId]);

  // Mémoriser les IDs des tickets initiaux pour éviter les réinitialisations inutiles
  const initialTicketIdsString = initialTickets.map(t => t.id).join(',');
  const initialTicketIds = useMemo(() => 
    new Set(initialTickets.map(t => t.id)), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialTicketIdsString]
  );

  useEffect(() => {
    // Réinitialiser quand les filtres changent
    setTickets(prev => {
      const currentIds = new Set(prev.map(t => t.id));
      
      // Si les IDs sont identiques, ne pas réinitialiser
      if (initialTicketIds.size === currentIds.size && 
          Array.from(initialTicketIds).every(id => currentIds.has(id))) {
        return prev;
      }
      
      ticketsLengthRef.current = initialTickets.length;
      return initialTickets;
    });
    setHasMore(initialHasMore);
    setError(null);
  }, [type, status, search, quickFilter, initialHasMore, initialTicketIds, initialTickets]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  if (tickets.length === 0 && !isLoading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Aucun ticket enregistré pour le moment.
      </p>
    );
  }

  // Fonction pour obtenir l'icône selon le type de ticket
  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG':
        return <Bug className="h-3.5 w-3.5 text-red-500" />;
      case 'REQ':
        return <FileText className="h-3.5 w-3.5 text-blue-500" />;
      case 'ASSISTANCE':
        return <HelpCircle className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return 'text-red-600 dark:text-red-400';
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400';
      case 'MEDIUM':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'LOW':
        return 'text-slate-600 dark:text-slate-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  // Fonction pour obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Fonction pour obtenir une couleur d'avatar basée sur le nom
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
        <div className="flex justify-end">
          <ColumnsConfigDialog onColumnsChange={setVisibleColumns} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                {isColumnVisible('title') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Titre
                  </th>
                )}
                {isColumnVisible('type') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Type
                  </th>
                )}
                {isColumnVisible('status') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Statut
                  </th>
                )}
                {isColumnVisible('priority') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Priorité
                  </th>
                )}
                {isColumnVisible('canal') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Canal
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
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Créé le
                  </th>
                )}
                {isColumnVisible('reporter') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Rapporteur
                  </th>
                )}
                {isColumnVisible('assigned') && (
                  <th className="pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Assigné
                  </th>
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
                      <TooltipContent side="top" className="max-w-md">
                        <p className="text-sm">{ticket.title}</p>
                        {ticket.description && (() => {
                          const descriptionText = parseADFToText(ticket.description);
                          const truncatedText = descriptionText.length > 200 
                            ? `${descriptionText.substring(0, 200)}...` 
                            : descriptionText;
                          return (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-3 whitespace-pre-wrap">
                              {truncatedText}
                            </p>
                          );
                        })()}
                        {ticket.jira_issue_key && (
                          <p className="text-xs text-slate-400 mt-1">Jira: {ticket.jira_issue_key}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                )}

                {/* Type avec icône */}
                {isColumnVisible('type') && (
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      {getTicketTypeIconLocal(ticket.ticket_type)}
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
                        <TooltipContent>
                          <p>Rapporteur: {ticket.created_user.full_name}</p>
                        </TooltipContent>
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
                        <TooltipContent>
                          <p>{ticket.assigned_user.full_name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                )}

                {/* Actions */}
                <td className="py-2.5 text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/gestion/tickets/${ticket.id}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        aria-label="Voir le ticket"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Voir les détails</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zone de declenchement pour l'infinite scroll */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Chargement...</span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-status-danger">{error}</p>
            <Button size="sm" onClick={() => loadMore()}>
              Réessayer
            </Button>
          </div>
        )}
        {hasMore && !isLoading && !error && (
          <Button variant="outline" size="sm" onClick={() => loadMore()}>
            Charger plus
          </Button>
        )}
        {!hasMore && !isLoading && tickets.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tous les tickets ont été chargés ({tickets.length} sur {initialTotal})
          </p>
        )}
      </div>
      </div>
    </TooltipProvider>
  );
}

