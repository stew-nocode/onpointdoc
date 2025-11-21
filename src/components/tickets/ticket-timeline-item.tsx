'use client';

import { MessageSquare, Circle, CheckCircle2, GitBranch } from 'lucide-react';
import { Badge } from '@/ui/badge';
import type { TicketInteraction } from '@/services/tickets/comments';
import { TicketDescription } from './ticket-description';
import { TimelineItemBase } from './timeline/timeline-item-base';

type TicketTimelineItemProps = {
  interaction: TicketInteraction;
  ticketTitle: string;
};

/**
 * Composant pour afficher un élément de la timeline
 * 
 * @param interaction - L'interaction à afficher
 * @param ticketTitle - Titre du ticket pour l'événement de création
 */
export function TicketTimelineItem({
  interaction,
  ticketTitle
}: TicketTimelineItemProps) {
  switch (interaction.type) {
    case 'creation':
      return (
        <TimelineItemBase
          icon={<Circle className="h-4 w-4 fill-current" />}
          title="Ticket créé"
          titleBadge={<Badge variant="info">{ticketTitle}</Badge>}
          interaction={interaction}
        />
      );

    case 'comment':
      return (
        <TimelineItemBase
          icon={<MessageSquare className="text-slate-600 dark:text-slate-300" />}
          title="Commentaire"
          titleBadge={
            interaction.origin === 'jira' ? (
              <Badge variant="info" className="text-xs">
                <GitBranch className="mr-1 h-3 w-3" />
                JIRA
              </Badge>
            ) : undefined
          }
          content={
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <TicketDescription description={interaction.content || ''} />
            </div>
          }
          interaction={interaction}
        />
      );

    case 'status_change':
      return (
        <TimelineItemBase
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Statut modifié"
          titleBadge={
            interaction.origin === 'jira' ? (
              <Badge variant="info" className="text-xs">
                <GitBranch className="mr-1 h-3 w-3" />
                JIRA
              </Badge>
            ) : undefined
          }
          content={
            <div className="flex items-center gap-2">
              {interaction.status_from && (
                <>
                  <Badge variant="info" className="text-xs">
                    {interaction.status_from.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-500">→</span>
                </>
              )}
              {interaction.status_to && (
                <Badge variant="success" className="text-xs">
                  {interaction.status_to.replace('_', ' ')}
                </Badge>
              )}
            </div>
          }
          interaction={interaction}
        />
      );

    default:
      return null;
  }
}

