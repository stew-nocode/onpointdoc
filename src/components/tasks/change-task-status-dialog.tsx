/**
 * Dialog pour changer le statut d'une tâche
 * 
 * Composant atomique pour respecter les principes Clean Code
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Badge } from '@/ui/badge';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';

const taskStatuses = [
  { value: 'A_faire', label: 'A faire', variant: 'outline' as const },
  { value: 'En_cours', label: 'En cours', variant: 'info' as const },
  { value: 'Termine', label: 'Terminé', variant: 'success' as const },
  { value: 'Bloque', label: 'Bloqué', variant: 'danger' as const },
  { value: 'Annule', label: 'Annulé', variant: 'outline' as const }
] as const;

type TaskStatus = 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque';

type ChangeTaskStatusDialogProps = {
  /**
   * ID de la tâche à modifier
   */
  taskId: string;

  /**
   * Statut actuel de la tâche
   */
  currentStatus: TaskStatus;

  /**
   * Fonction appelée lors de la soumission
   * Peut recevoir soit un statut seul, soit un objet avec statut et durée réelle
   */
  onSubmit: (status: TaskStatus, actualDurationHours?: number) => Promise<void>;

  /**
   * Contrôle l'ouverture du dialog
   */
  open: boolean;

  /**
   * Callback appelé quand l'état d'ouverture change
   */
  onOpenChange: (open: boolean) => void;
};

/**
 * Dialog pour changer le statut d'une tâche
 * 
 * @param props - Propriétés du composant
 */
export function ChangeTaskStatusDialog({
  taskId,
  currentStatus,
  onSubmit,
  open,
  onOpenChange
}: ChangeTaskStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(currentStatus);
  const [actualDurationHours, setActualDurationHours] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser le statut sélectionné quand le Dialog s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus);
      setActualDurationHours('');
    }
  }, [open, currentStatus]);

  /**
   * Vérifie si le formulaire est valide
   */
  const isFormValid = useCallback(() => {
    if (selectedStatus === currentStatus) {
      return true; // Pas de changement, valide
    }
    
    // Si le statut est "Terminé", la durée réelle est obligatoire
    if (selectedStatus === 'Termine') {
      const duration = parseFloat(actualDurationHours);
      return !isNaN(duration) && duration > 0;
    }
    
    return true;
  }, [selectedStatus, currentStatus, actualDurationHours]);

  /**
   * Valide et enregistre le nouveau statut
   */
  const handleSubmit = useCallback(async () => {
    if (selectedStatus === currentStatus) {
      onOpenChange(false);
      return;
    }

    // Vérifier que si "Terminé" est sélectionné, la durée réelle est renseignée
    if (selectedStatus === 'Termine') {
      const duration = parseFloat(actualDurationHours);
      if (isNaN(duration) || duration <= 0) {
        return; // Ne pas soumettre si la durée n'est pas valide
      }
    }

    setIsSubmitting(true);
    try {
      const duration = selectedStatus === 'Termine' ? parseFloat(actualDurationHours) : undefined;
      await onSubmit(selectedStatus, duration);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      // L'erreur sera gérée par le composant parent
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedStatus, currentStatus, actualDurationHours, onSubmit, onOpenChange]);

  /**
   * Annule le changement de statut
   */
  const handleCancel = useCallback(() => {
    onOpenChange(false);
    // Réinitialiser le statut sélectionné au statut actuel
    setSelectedStatus(currentStatus);
    setActualDurationHours('');
  }, [onOpenChange, currentStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le statut de la tâche</DialogTitle>
          <DialogDescription>
            Sélectionnez le nouveau statut pour cette tâche
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {taskStatuses.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => setSelectedStatus(status.value as TaskStatus)}
                className={`rounded-lg border-2 p-3 text-left transition-colors ${
                  selectedStatus === status.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
                disabled={isSubmitting}
              >
                <Badge variant={status.variant} className="mb-2">
                  {status.label}
                </Badge>
              </button>
            ))}
          </div>

          {/* Champ de durée réelle si "Terminé" est sélectionné */}
          {selectedStatus === 'Termine' && (
            <div className="grid gap-2 pt-2">
              <Label htmlFor="actual-duration-hours">
                Durée réelle (heures) <span className="text-status-danger">*</span>
              </Label>
              <Input
                id="actual-duration-hours"
                type="number"
                step="0.5"
                min="0.5"
                value={actualDurationHours}
                onChange={(e) => setActualDurationHours(e.target.value)}
                placeholder="Ex: 2.5"
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La durée réelle est obligatoire pour terminer une tâche
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

