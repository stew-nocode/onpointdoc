'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { CommentList } from './comment-list';
import { CommentForm } from './comment-form';
import { toast } from 'sonner';
import type { TicketComment } from '@/services/tickets/comments';

type CommentsSectionProps = {
  ticketId: string;
  initialComments: TicketComment[];
  currentUserId?: string | null;
  onCommentAdded: (comment: TicketComment) => void;
  onCommentDeleted: (commentId: string) => void;
  isLoading?: boolean;
  deletingCommentId?: string | null;
};

/**
 * Section principale pour les commentaires d'un ticket
 * 
 * Affiche :
 * - La liste des commentaires existants
 * - Le formulaire pour ajouter un nouveau commentaire
 */
export function CommentsSection({
  ticketId,
  initialComments,
  currentUserId,
  onCommentAdded,
  onCommentDeleted,
  isLoading = false,
  deletingCommentId = null
}: CommentsSectionProps) {
  const handleAdd = async (content: string, files?: File[]): Promise<void> => {
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
    const comment = result.data;

    // Upload des pièces jointes si présentes
    if (files && files.length > 0) {
      try {
        const { uploadCommentAttachments } = await import('@/services/tickets/comments/attachments.client');
        const uploadedAttachments = await uploadCommentAttachments(comment.id, files);
        
        // Ajouter les pièces jointes uploadées au commentaire
        comment.attachments = uploadedAttachments.map((att) => ({
          id: att.id,
          comment_id: comment.id,
          file_path: att.file_path,
          file_name: att.file_name,
          mime_type: att.mime_type,
          size_kb: att.size_kb,
          stored_at: new Date().toISOString()
        }));
      } catch (error) {
        toast.warning('Commentaire créé mais erreur lors de l\'upload des pièces jointes');
      }
    }

    onCommentAdded(comment);
  };

  const handleDelete = async (commentId: string): Promise<void> => {
    const response = await fetch(`/api/tickets/${ticketId}/comments/${commentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Erreur lors de la suppression du commentaire');
    }

    onCommentDeleted(commentId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commentaires ({initialComments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentList
          comments={initialComments}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          deletingCommentId={deletingCommentId}
        />
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <CommentForm onSubmit={handleAdd} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  );
}

