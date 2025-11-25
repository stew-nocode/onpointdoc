'use client';

import { File, X, Download } from 'lucide-react';
import { Button } from '@/ui/button';
import type { CommentAttachment } from '@/services/tickets/comments';
import { deleteCommentAttachment } from '@/services/tickets/comments/attachments.client';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

type CommentAttachmentsProps = {
  commentId: string;
  attachments: CommentAttachment[];
  currentUserId?: string | null;
  commentUserId?: string | null;
  onDelete?: (attachmentId: string) => void;
  onAttachmentDeleted?: () => void;
};

/**
 * Composant pour afficher les pièces jointes d'un commentaire
 * 
 * Affiche :
 * - Liste des pièces jointes avec nom et taille
 * - Bouton de téléchargement pour chaque pièce jointe
 * - Bouton de suppression si l'utilisateur est l'auteur du commentaire
 */
export function CommentAttachments({
  commentId,
  attachments,
  currentUserId,
  commentUserId,
  onDelete,
  onAttachmentDeleted
}: CommentAttachmentsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const isOwner = currentUserId === commentUserId;
  const canDelete = isOwner;

  const handleDownload = async (attachment: CommentAttachment) => {
    const supabase = createSupabaseBrowserClient();
    const bucket = supabase.storage.from('comment-attachments');

    const { data, error } = await bucket.download(attachment.file_path);

    if (error || !data) {
      toast.error('Erreur lors du téléchargement du fichier');
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (attachment: CommentAttachment) => {
    if (!canDelete || deletingId) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette pièce jointe ?')) {
      return;
    }

    setDeletingId(attachment.id);

    try {
      await deleteCommentAttachment(attachment.id, attachment.file_path);
      toast.success('Pièce jointe supprimée avec succès');
      onDelete?.(attachment.id);
      onAttachmentDeleted?.();
    } catch (error) {
      toast.error('Erreur lors de la suppression de la pièce jointe');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (sizeKb: number | null) => {
    if (!sizeKb) return '';
    if (sizeKb < 1024) return `${sizeKb} KB`;
    return `${(sizeKb / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="mt-2 space-y-1">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <File className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
            <span className="truncate text-slate-700 dark:text-slate-300">
              {attachment.file_name}
            </span>
            {attachment.size_kb && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                ({formatFileSize(attachment.size_kb)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDownload(attachment)}
              aria-label={`Télécharger ${attachment.file_name}`}
            >
              <Download className="h-3 w-3" />
            </Button>
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500"
                onClick={() => handleDelete(attachment)}
                disabled={deletingId === attachment.id}
                aria-label={`Supprimer ${attachment.file_name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

