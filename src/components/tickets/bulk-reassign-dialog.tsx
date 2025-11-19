'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Combobox } from '@/ui/combobox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BasicProfile } from '@/services/users';

type BulkReassignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketIds: string[];
  onSuccess: () => void;
};

export function BulkReassignDialog({
  open,
  onOpenChange,
  ticketIds,
  onSuccess
}: BulkReassignDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [profiles, setProfiles] = useState<BasicProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfiles();
    }
  }, [open]);

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const response = await fetch('/api/users/profiles');
      if (!response.ok) throw new Error('Erreur lors du chargement des profils');
      const data = await response.json();
      setProfiles(data);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement des profils');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tickets/bulk/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds,
          assignedTo: selectedUserId || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la réassignation');
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        toast.warning(`${result.updated} tickets réassignés, ${result.errors.length} erreurs`);
      } else {
        toast.success(`${result.updated} ticket${result.updated > 1 ? 's' : ''} réassigné${result.updated > 1 ? 's' : ''}`);
      }

      onOpenChange(false);
      setSelectedUserId('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réassignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réassigner {ticketIds.length} ticket{ticketIds.length > 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            Sélectionnez un utilisateur pour réassigner les tickets sélectionnés. Laissez vide pour désassigner.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoadingProfiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <Combobox
              options={[
                { value: '', label: 'Désassigner (aucun)' },
                ...profiles.map(p => ({
                  value: p.id,
                  label: p.full_name || p.email || 'Utilisateur sans nom',
                  searchable: `${p.full_name || ''} ${p.email || ''}`.trim()
                }))
              ]}
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Sélectionner un utilisateur..."
              searchPlaceholder="Rechercher un utilisateur..."
              emptyText="Aucun utilisateur trouvé"
            />
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingProfiles}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

