'use client';

/**
 * Composant de confirmation de suppression de ticket style JIRA
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (confirmation et suppression)
 * - Validation explicite (saisie "supprimer" requise)
 * - Feedback utilisateur clair
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type DeleteTicketDialogProps = {
  /**
   * ID du ticket à supprimer
   */
  ticketId: string;

  /**
   * Titre du ticket (pour affichage)
   */
  ticketTitle: string;

  /**
   * Clé JIRA du ticket (si présente)
   */
  jiraIssueKey?: string | null;

  /**
   * Contrôle l'ouverture du dialog
   */
  open: boolean;

  /**
   * Callback appelé quand le dialog se ferme
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Callback appelé après suppression réussie
   */
  onDeleted?: () => void;
};

const CONFIRMATION_TEXT = 'supprimer';

/**
 * Dialog de confirmation de suppression de ticket
 * 
 * Style inspiré de JIRA :
 * - Demande de taper "supprimer" pour confirmer
 * - Bouton désactivé jusqu'à confirmation
 * - Avertissement clair sur l'irréversibilité
 */
export function DeleteTicketDialog({
  ticketId,
  ticketTitle,
  jiraIssueKey,
  open,
  onOpenChange,
  onDeleted
}: DeleteTicketDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isConfirmed = confirmationText.toLowerCase().trim() === CONFIRMATION_TEXT;
  const canDelete = isConfirmed && !isDeleting;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur lors de la suppression' }));
        const errorMessage = error.message || error.error || 'Erreur lors de la suppression';
        throw new Error(errorMessage);
      }

      toast.success('Ticket supprimé avec succès');
      onOpenChange(false);
      setConfirmationText('');
      
      // Callback optionnel
      if (onDeleted) {
        onDeleted();
      }
      
      // Rafraîchir la page pour mettre à jour la liste
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false);
      setConfirmationText('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-status-danger" />
            Supprimer 1 ticket ?
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>
              Vous êtes sur le point de supprimer définitivement ce ticket, ainsi que tous les commentaires, toutes les pièces jointes et toutes les données du ticket. Cette action est irréversible.
            </p>
            {jiraIssueKey && (
              <p className="font-medium text-status-warning">
                ⚠️ Le ticket sera également supprimé dans JIRA ({jiraIssueKey}).
              </p>
            )}
            <p className="text-slate-500 dark:text-slate-500">
              En cas de doute, vous pouvez résoudre ou fermer ce ticket.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <label htmlFor="confirmation-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Saisissez <span className="font-mono font-semibold">{CONFIRMATION_TEXT}</span> pour continuer
          </label>
          <Input
            id="confirmation-input"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={CONFIRMATION_TEXT}
            disabled={isDeleting}
            className="font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canDelete) {
                handleDelete();
              }
            }}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
            className="min-w-[100px]"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

