'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { TicketDescription } from './ticket-description';
import { TicketTimeline } from './ticket-timeline';
import { CommentsSectionClient } from './comments/comments-section-client';
import { TicketAttachments } from './ticket-attachments';
import { TicketInfoCard } from './ticket-info-card';
import type { TicketInteraction, TicketComment } from '@/services/tickets/comments';
import type { TicketAttachment } from '@/services/tickets/attachments/crud';

type TicketWithDetails = {
  id: string;
  title: string;
  description?: string | null;
  ticket_type: string;
  status: string;
  priority: string;
  canal?: string | null;
  product?: { name: string } | null;
  module?: { name: string } | null;
  jira_issue_key?: string | null;
  customer_context?: string | null;
  duration_minutes?: number | null;
  created_at: string;
  validated_by_manager?: boolean;
};

type TicketDetailTabsProps = {
  ticket: TicketWithDetails;
  interactions: TicketInteraction[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  isValidated: boolean;
};

/**
 * Mobile-optimized tabs layout for ticket details
 *
 * Displays three tabs:
 * - Détails: Ticket information and fields
 * - Timeline: Interaction timeline
 * - Commentaires: Comments section
 *
 * Only rendered on mobile/tablet (< lg breakpoint)
 */
export function TicketDetailTabs({
  ticket,
  interactions,
  comments,
  attachments,
  isValidated
}: TicketDetailTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="timeline">
          Timeline
          {interactions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {interactions.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="comments">
          Commentaires
          {comments.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {comments.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Détails du ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <TicketDescription description={ticket.description} />
            </div>

            {ticket.customer_context && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contexte client
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {ticket.customer_context}
                </p>
              </div>
            )}

            {ticket.duration_minutes && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Durée de l&apos;assistance
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {ticket.duration_minutes} minutes
                </p>
              </div>
            )}

            {attachments.length > 0 && (
              <TicketAttachments ticketId={ticket.id} attachments={attachments} />
            )}
          </CardContent>
        </Card>

        <TicketInfoCard ticket={ticket} isValidated={isValidated} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        <TicketTimeline interactions={interactions} ticketTitle={ticket.title} />
      </TabsContent>

      <TabsContent value="comments" className="mt-4">
        <CommentsSectionClient ticketId={ticket.id} initialComments={comments} />
      </TabsContent>
    </Tabs>
  );
}
