'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { useBulkActions } from '@/hooks/tickets/use-bulk-actions';
import { ASSISTANCE_LOCAL_STATUSES } from '@/lib/constants/tickets';
import type { TicketWithRelations } from '@/types/ticket-with-relations';

type BulkUpdateStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketIds: string[];
  tickets: TicketWithRelations[];
};

/**
 * Dialog pour changer le statut de plusieurs tickets en masse
 * Vérifie que tous les tickets sont de type ASSISTANCE et non transférés
 */
export function BulkUpdateStatusDialog({
  open,
  onOpenChange,
  ticketIds,
  tickets
}: BulkUpdateStatusDialogProps) {
  const { updateStatus, isLoading } = useBulkActions();
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Filtrer les tickets valides (ASSISTANCE non transférés)
  const validTickets = tickets.filter(
    (t) => t.ticket_type === 'ASSISTANCE' && t.status !== 'Transfere'
  );
  const validTicketIds = validTickets.map((t) => t.id);
  const hasInvalidTickets = validTicketIds.length < ticketIds.length;

  const handleSubmit = async () => {
    if (!selectedStatus) {
      return;
    }

    const result = await updateStatus({
      ticketIds: validTicketIds,
      status: selectedStatus as 'Nouveau' | 'En_cours' | 'Resolue'
    });

    if (result?.success) {
      onOpenChange(false);
      setSelectedStatus('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-brand" />
            Changer le statut
          </DialogTitle>
          <DialogDescription>
            Modifier le statut de {validTicketIds.length} ticket{validTicketIds.length > 1 ? 's' : ''} ASSISTANCE
            {hasInvalidTickets && (
              <span className="block mt-1 text-status-warning text-xs">
                {ticketIds.length - validTicketIds.length} ticket(s) ignoré(s) (non ASSISTANCE ou transféré)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
            <div className="grid grid-cols-1 gap-2">
              {ASSISTANCE_LOCAL_STATUSES.map((status) => (
                <RadioCard
                  key={status}
                  value={status}
                  label={status.replace('_', ' ')}
                  className="p-3"
                />
              ))}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedStatus('');
            }}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedStatus || isLoading || validTicketIds.length === 0}>
            {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

