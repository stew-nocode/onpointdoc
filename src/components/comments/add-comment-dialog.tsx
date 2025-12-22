'use client';

import { useState, FormEvent } from 'react';
import { Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { Switch } from '@/ui/switch';
import { Label } from '@/ui/label';
import { toast } from 'sonner';

type CommentObjectType = 'task' | 'activity';

type AddCommentDialogProps = {
  /** Type d'objet : tâche ou activité */
  objectType: CommentObjectType;
  /** ID de l'objet (tâche ou activité) */
  objectId: string;
  /** Titre de l'objet (pour l'affichage) */
  objectTitle: string;
  /** État d'ouverture du dialog */
  open: boolean;
  /** Callback quand l'état d'ouverture change */
  onOpenChange: (open: boolean) => void;
  /** Callback après succès (optionnel) */
  onSuccess?: () => void;
};

/**
 * Dialog générique pour ajouter un commentaire sur une tâche ou une activité
 * 
 * Utilise les API :
 * - POST /api/tasks/[id]/comments
 * - POST /api/activities/[id]/comments
 */
export function AddCommentDialog({
  objectType,
  objectId,
  objectTitle,
  open,
  onOpenChange,
  onSuccess
}: AddCommentDialogProps) {
  const [content, setContent] = useState('');
  const [isFollowup, setIsFollowup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeLabel = objectType === 'task' ? 'tâche' : 'activité';
  const apiPath = objectType === 'task' 
    ? `/api/tasks/${objectId}/comments`
    : `/api/activities/${objectId}/comments`;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    if (trimmedContent.length > 5000) {
      toast.error('Le commentaire est trop long (maximum 5000 caractères)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: trimmedContent,
          comment_type: isFollowup ? 'followup' : 'comment'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du commentaire');
      }

      // Réinitialiser le formulaire
      setContent('');
      setIsFollowup(false);

      // Fermer le dialog
      onOpenChange(false);

      // Toast de succès
      toast.success(
        isFollowup 
          ? `Relance ajoutée sur la ${typeLabel}` 
          : `Commentaire ajouté sur la ${typeLabel}`
      );

      // Callback de succès
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du commentaire';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Réinitialiser le formulaire à la fermeture
      setContent('');
      setIsFollowup(false);
    }
    onOpenChange(newOpen);
  };

  const isDisabled = isSubmitting || !content.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un commentaire</DialogTitle>
          <DialogDescription className="truncate">
            {objectType === 'task' ? 'Tâche' : 'Activité'} : {objectTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre commentaire..."
            rows={4}
            className="resize-none"
            disabled={isSubmitting}
            maxLength={5000}
            autoFocus
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="followup-switch"
                checked={isFollowup}
                onCheckedChange={setIsFollowup}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="followup-switch"
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Marquer comme relance
              </Label>
            </div>

            {content.trim() && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {content.length}/5000
              </span>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isDisabled}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Envoi...' : isFollowup ? 'Relancer' : 'Commenter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

