'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Combobox } from '@/ui/combobox';
import { useBulkActions } from '@/hooks/tickets/use-bulk-actions';
import { useProfiles } from '@/hooks';
import type { BasicProfile } from '@/services/users';

type BulkReassignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketIds: string[];
};

/**
 * Dialog pour réassigner plusieurs tickets en masse
 */
export function BulkReassignDialog({
  open,
  onOpenChange,
  ticketIds
}: BulkReassignDialogProps) {
  const { reassign, isLoading } = useBulkActions();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  // Ne charger les profils que quand le dialog est ouvert pour éviter les boucles infinies
  const { profiles, isLoading: isLoadingProfiles } = useProfiles({ enabled: open });

  // Réinitialiser la sélection quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      // Utiliser setTimeout pour éviter l'appel synchrone de setState
      const timer = setTimeout(() => {
        setSelectedUserId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSubmit = async () => {
    const result = await reassign({
      ticketIds,
      assignedTo: selectedUserId
    });

    if (result?.success) {
      onOpenChange(false);
      setSelectedUserId(null);
    }
  };

  // Préparer les options pour le Combobox
  const userOptions = (profiles || []).map((profile: BasicProfile) => ({
    value: profile.id,
    label: profile.full_name || profile.email || 'Sans nom'
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-brand" />
            Réassigner les tickets
          </DialogTitle>
          <DialogDescription>
            Réassigner {ticketIds.length} ticket{ticketIds.length > 1 ? 's' : ''} à un utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Combobox
            options={userOptions}
            value={selectedUserId || ''}
            onValueChange={(value) => setSelectedUserId(value || null)}
            placeholder="Sélectionner un utilisateur..."
            emptyText="Aucun utilisateur trouvé"
            disabled={isLoadingProfiles || isLoading}
          />
          {selectedUserId === null && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Si aucun utilisateur n&apos;est sélectionné, les tickets seront désassignés.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedUserId(null);
            }}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Réassignation...' : 'Réassigner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
