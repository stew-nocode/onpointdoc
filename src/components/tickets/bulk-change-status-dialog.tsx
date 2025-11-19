'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TICKET_STATUSES } from '@/lib/constants/tickets';

type BulkChangeStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketIds: string[];
  onSuccess: () => void;
};

export function BulkChangeStatusDialog({
  open,
  onOpenChange,
  ticketIds,
  onSuccess
}: BulkChangeStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error('Veuillez sélectionner un statut');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tickets/bulk/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds,
          status: selectedStatus
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour');
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.updated} tickets mis à jour, ${result.errors.length} erreurs`);
      } else {
        toast.success(`${result.updated} ticket${result.updated > 1 ? 's' : ''} mis à jour`);
      }

      onOpenChange(false);
      setSelectedStatus('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le statut de {ticketIds.length} ticket{ticketIds.length > 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            Sélectionnez le nouveau statut pour les tickets sélectionnés.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
            <div className="grid grid-cols-2 gap-3">
              {TICKET_STATUSES.map((status) => (
                <RadioCard
                  key={status}
                  value={status}
                  label={status.replace('_', ' ')}
                />
              ))}
            </div>
          </RadioGroup>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !selectedStatus}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

