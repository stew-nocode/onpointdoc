'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/ui/context-menu';
import {
  Edit,
  Copy,
  FileText,
  Archive,
  Share2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { duplicateTicketAction, archiveTicketAction } from '@/app/(main)/gestion/tickets/actions';
import { exportTicketToPDF } from '@/services/tickets/export-pdf';
import { shareTicket } from '@/lib/utils/share';
import type { TicketComment } from '@/services/tickets/comments';
import type { TicketAttachment } from '@/services/tickets/attachments/crud';

type TicketData = {
  id: string;
  title?: string | null;
  description?: string | null;
  ticket_type?: string | null;
  status?: string | null;
  priority?: string | null;
  canal?: string | null;
  jira_issue_key?: string | null;
  customer_context?: string | null;
  duration_minutes?: number | null;
  product?: { name: string } | null;
  module?: { name: string } | null;
};

type TicketActionsMenuProps = {
  children: React.ReactNode;
  ticket: TicketData;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  canEdit?: boolean;
  canArchive?: boolean;
};

/**
 * Context menu with all ticket actions
 *
 * Actions:
 * - Edit: Navigate to edit mode
 * - Duplicate: Create a copy of the ticket
 * - Export PDF: Generate and download PDF
 * - Archive: Archive the ticket
 * - Share: Copy link to clipboard
 *
 * Permissions:
 * - canEdit: Show edit action
 * - canArchive: Show archive action (typically managers only)
 */
export function TicketActionsMenu({
  children,
  ticket,
  comments,
  attachments,
  canEdit = true,
  canArchive = false
}: TicketActionsMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleEdit = () => {
    router.push(`/gestion/tickets/${ticket.id}?edit=true`);
  };

  const handleDuplicate = async () => {
    setIsLoading(true);
    setLoadingAction('duplicate');

    try {
      const newTicketId = await duplicateTicketAction(ticket.id);
      toast.success('Ticket dupliqué avec succès');
      router.push(`/gestion/tickets/${newTicketId}`);
    } catch (error) {
      toast.error('Erreur lors de la duplication du ticket');
      console.error('Duplicate error:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    setLoadingAction('export');

    try {
      await exportTicketToPDF(ticket, comments, attachments);
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce ticket ?')) {
      return;
    }

    setIsLoading(true);
    setLoadingAction('archive');

    try {
      await archiveTicketAction(ticket.id);
      toast.success('Ticket archivé avec succès');
      router.push('/gestion/tickets');
    } catch (error) {
      toast.error('Erreur lors de l\'archivage du ticket');
      console.error('Archive error:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleShare = async () => {
    await shareTicket(ticket.id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {canEdit && (
          <ContextMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Éditer</span>
          </ContextMenuItem>
        )}

        <ContextMenuItem
          onClick={handleDuplicate}
          disabled={isLoading && loadingAction === 'duplicate'}
        >
          {loadingAction === 'duplicate' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          <span>Dupliquer</span>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={handleExportPDF}
          disabled={isLoading && loadingAction === 'export'}
        >
          {loadingAction === 'export' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          <span>Exporter en PDF</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Partager le lien</span>
        </ContextMenuItem>

        {canArchive && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={handleArchive}
              disabled={isLoading && loadingAction === 'archive'}
              className="text-status-danger focus:text-status-danger"
            >
              {loadingAction === 'archive' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              <span>Archiver</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
