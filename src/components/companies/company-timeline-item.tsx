'use client';

import Link from 'next/link';
import { Calendar, Ticket, User, ExternalLink } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils/date-formatter';
import type { CompanyHistoryItem } from '@/services/companies/company-history';
import { cn } from '@/lib/utils';

type CompanyTimelineItemProps = {
  item: CompanyHistoryItem;
};

/**
 * Élément de timeline pour l'historique d'une entreprise
 * 
 * Pattern similaire à TicketTimelineItem pour cohérence
 * 
 * ✅ Enrichi : Tickets cliquables vers la page de détail
 */
export function CompanyTimelineItem({ item }: CompanyTimelineItemProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'ticket':
        return <Ticket className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getColor = () => {
    switch (item.type) {
      case 'ticket':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'user':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const formatDate = (dateString: string) => {
    return formatRelativeDate(dateString);
  };

  const isTicket = item.type === 'ticket';
  const ticketHref = isTicket ? `/gestion/tickets/${item.id}` : undefined;

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Ligne verticale */}
      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 last:hidden" />

      {/* Icône */}
      <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${getColor()}`}>
        {getIcon()}
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isTicket && ticketHref ? (
              <Link
                href={ticketHref}
                className={cn(
                  'group inline-flex items-center gap-1.5 text-sm font-medium',
                  'text-blue-600 hover:text-blue-800 hover:underline',
                  'dark:text-blue-400 dark:hover:text-blue-300',
                  'transition-colors duration-200'
                )}
              >
                <span>{item.title}</span>
                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-70" />
              </Link>
            ) : (
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {item.title}
              </p>
            )}
            {item.description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            )}
            {item.user && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Par {item.user.full_name}
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
            {formatDate(item.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

