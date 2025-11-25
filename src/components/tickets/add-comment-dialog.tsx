'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import { CommentForm } from './comments/comment-form';
import { toast } from 'sonner';

type AddCommentDialogProps = {
  ticketId: string;
  ticketTitle: string;
};

/**
 * Modal pour ajouter un commentaire depuis la liste des tickets
 * 
 * Affiche :
 * - Un formulaire de commentaire
 * - Gestion de l'upload des pièces jointes
 * - Toast de confirmation/erreur
 */
export function AddCommentDialog({ ticketId, ticketTitle }: AddCommentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  /**
   * Crée le commentaire via l'API
   * 
   * @param content - Contenu du commentaire
   * @returns Données du commentaire créé
   * @throws Error si la création échoue
   */
  const createComment = async (content: string): Promise<{ id: string }> => {
    const response = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Erreur lors de l\'ajout du commentaire');
    }

    const result = await response.json();
    return result.data;
  };

  /**
   * Upload les pièces jointes d'un commentaire
   * 
   * @param commentId - ID du commentaire
   * @param files - Fichiers à uploader
   */
  const uploadAttachments = async (commentId: string, files: File[]): Promise<void> => {
    try {
      const { uploadCommentAttachments } = await import('@/services/tickets/comments/attachments.client');
      await uploadCommentAttachments(commentId, files);
    } catch (uploadError) {
      toast.warning('Commentaire créé mais erreur lors de l\'upload des pièces jointes');
    }
  };

  /**
   * Gère la soumission du commentaire
   * 
   * @param content - Contenu du commentaire
   * @param files - Fichiers joints (optionnels)
   */
  const handleSubmit = async (content: string, files?: File[]): Promise<void> => {
    setIsSubmitting(true);

    try {
      const comment = await createComment(content);

      if (files && files.length > 0) {
        await uploadAttachments(comment.id, files);
      }

      toast.success('Commentaire ajouté avec succès');
      setOpen(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du commentaire';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label="Ajouter un commentaire"
          type="button"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un commentaire</DialogTitle>
          <DialogDescription>
            Ajouter un commentaire au ticket : {ticketTitle}
          </DialogDescription>
        </DialogHeader>
        <CommentForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}

