'use client';

import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import type { TicketInteraction } from '@/services/tickets/comments';
import { TicketTimelineItem } from './ticket-timeline-item';

type TicketTimelineProps = {
  interactions: TicketInteraction[];
  ticketTitle: string;
};

/**
 * Composant Timeline pour afficher les interactions d'un ticket
 * Affiche une timeline verticale avec les commentaires, changements de statut et création
 * 
 * @param interactions - Liste des interactions triées chronologiquement
 * @param ticketTitle - Titre du ticket pour la création
 */
export function TicketTimeline({
  interactions,
  ticketTitle
}: TicketTimelineProps) {

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <CardTitle className="text-lg">Timeline des interactions</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-4">
        {interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
            <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Aucune interaction pour le moment</p>
          </div>
        ) : (
          <div className="space-y-0">
            {interactions.map((interaction) => (
              <TicketTimelineItem
                key={interaction.id}
                interaction={interaction}
                ticketTitle={ticketTitle}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

