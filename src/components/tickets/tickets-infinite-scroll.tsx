'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/ui/badge';

type Ticket = {
  id: string;
  title: string;
  ticket_type: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
};

type TicketsInfiniteScrollProps = {
  initialTickets: Ticket[];
  initialHasMore: boolean;
  initialTotal: number;
  type?: string;
  status?: string;
};

const ITEMS_PER_PAGE = 25;

export function TicketsInfiniteScroll({
  initialTickets,
  initialHasMore,
  initialTotal,
  type,
  status
}: TicketsInfiniteScrollProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        offset: tickets.length.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });

      if (type) params.set('type', type);
      if (status) params.set('status', status);

      const response = await fetch(`/api/tickets/list?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tickets');
      }

      const data = await response.json();
      
      setTickets(prev => [...prev, ...data.tickets]);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [tickets.length, isLoading, hasMore, type, status]);

  useEffect(() => {
    // Réinitialiser quand les filtres changent
    setTickets(initialTickets);
    setHasMore(initialHasMore);
    setError(null);
  }, [type, status, initialTickets, initialHasMore]);

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

  return (
    <>
      <table className="min-w-full text-left">
        <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <tr>
            <th className="pb-2">Titre</th>
            <th className="pb-2">Type</th>
            <th className="pb-2">Statut</th>
            <th className="pb-2">Priorité</th>
            <th className="pb-2">Assigné</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-3 text-xs font-medium">
                <Link
                  href={`/gestion/tickets/${ticket.id}`}
                  className="text-brand hover:underline dark:text-status-info dark:hover:text-status-info/80"
                >
                  {ticket.title}
                </Link>
              </td>
              <td className="py-3 text-xs text-slate-600 dark:text-slate-300">{ticket.ticket_type}</td>
              <td className="py-3 text-xs">
                <Badge
                  variant={
                    ticket.status === 'Resolue'
                      ? 'success'
                      : ticket.status === 'Transfere'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="py-3 text-xs capitalize text-slate-600 dark:text-slate-300">
                {ticket.priority}
              </td>
              <td className="py-3 text-xs text-slate-600 dark:text-slate-300">
                {ticket.assigned_to ?? '-'}
              </td>
              <td className="py-3 text-right text-xs">
                <div className="flex justify-end gap-1.5">
                  <Link
                    href={`/gestion/tickets/${ticket.id}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md p-0 text-slate-600 hover:bg-slate-600/10 dark:text-slate-200 dark:hover:bg-slate-200/10"
                    aria-label="Voir le ticket"
                  >
                    <Eye className="h-3 w-3" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Zone de déclenchement pour l'infinite scroll */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Chargement...</span>
          </div>
        )}
        {error && (
          <p className="text-sm text-status-danger">{error}</p>
        )}
        {!hasMore && tickets.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tous les tickets ont été chargés ({tickets.length} sur {initialTotal})
          </p>
        )}
      </div>
    </>
  );
}

