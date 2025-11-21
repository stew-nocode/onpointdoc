'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
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
import { ticketPriorities } from '@/lib/validators/ticket';

type BulkUpdatePriorityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketIds: string[];
};

/**
 * Dialog pour changer la priorité de plusieurs tickets en masse
 */
export function BulkUpdatePriorityDialog({
  open,
  onOpenChange,
  ticketIds
}: BulkUpdatePriorityDialogProps) {
  const { updatePriority, isLoading } = useBulkActions();
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  const handleSubmit = async () => {
    if (!selectedPriority) {
      return;
    }

    const result = await updatePriority({
      ticketIds,
      priority: selectedPriority as 'Low' | 'Medium' | 'High' | 'Critical'
    });

    if (result?.success) {
      onOpenChange(false);
      setSelectedPriority('');
    }
  };

  // Icônes pour les priorités
  const priorityIcons = {
    Low: '🔵',
    Medium: '🟡',
    High: '🟠',
    Critical: '🔴'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-brand" />
            Changer la priorité
          </DialogTitle>
          <DialogDescription>
            Modifier la priorité de {ticketIds.length} ticket{ticketIds.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedPriority} onValueChange={setSelectedPriority}>
            <div className="grid grid-cols-2 gap-2">
              {ticketPriorities.map((priority) => (
                <RadioCard
                  key={priority}
                  value={priority}
                  label={`${priorityIcons[priority]} ${priority}`}
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
              setSelectedPriority('');
            }}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPriority || isLoading}>
            {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

