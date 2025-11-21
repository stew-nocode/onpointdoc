'use client';

import { useState } from 'react';
import { CheckSquare2, X, FileDown, ArrowUpDown, Flag, User } from 'lucide-react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { useBulkActions } from '@/hooks/tickets/use-bulk-actions';
import { BulkUpdateStatusDialogLazy } from './bulk-update-status-dialog-lazy';
import { BulkReassignDialogLazy } from './bulk-reassign-dialog-lazy';
import { BulkUpdatePriorityDialogLazy } from './bulk-update-priority-dialog-lazy';
import type { TicketWithRelations } from '@/types/ticket-with-relations';

type BulkActionsBarProps = {
  selectedTicketIds: string[];
  tickets: TicketWithRelations[];
  onClearSelection: () => void;
};

/**
 * Barre d'actions flottante affichée quand des tickets sont sélectionnés
 * Permet d'exécuter des actions en masse : changer statut, réassigner, priorité, exporter
 */
export function BulkActionsBar({
  selectedTicketIds,
  tickets,
  onClearSelection
}: BulkActionsBarProps) {
  const { isLoading, exportToCSV } = useBulkActions();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);

  const selectedTickets = tickets.filter((t) => selectedTicketIds.includes(t.id));

  const handleExport = async () => {
    await exportToCSV(selectedTicketIds);
  };

  if (selectedTicketIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="sticky bottom-0 z-50 mx-auto mb-4 flex w-full max-w-7xl items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare2 className="h-5 w-5 text-brand" />
            <Badge variant="outline" className="text-sm">
              {selectedTicketIds.length} ticket{selectedTicketIds.length > 1 ? 's' : ''} sélectionné
              {selectedTicketIds.length > 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4 mr-1" />
            Désélectionner
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusDialogOpen(true)}
            disabled={isLoading}
            className="h-8"
          >
            <Flag className="h-4 w-4 mr-1.5" />
            Statut
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReassignDialogOpen(true)}
            disabled={isLoading}
            className="h-8"
          >
            <User className="h-4 w-4 mr-1.5" />
            Réassigner
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPriorityDialogOpen(true)}
            disabled={isLoading}
            className="h-8"
          >
            <ArrowUpDown className="h-4 w-4 mr-1.5" />
            Priorité
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoading}
            className="h-8"
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <BulkUpdateStatusDialogLazy
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        ticketIds={selectedTicketIds}
        tickets={selectedTickets}
      />
      <BulkReassignDialogLazy
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        ticketIds={selectedTicketIds}
      />
      <BulkUpdatePriorityDialogLazy
        open={priorityDialogOpen}
        onOpenChange={setPriorityDialogOpen}
        ticketIds={selectedTicketIds}
      />
    </>
  );
}
