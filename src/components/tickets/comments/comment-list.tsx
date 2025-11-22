'use client';

import { MessageSquare } from 'lucide-react';
import { CommentItem } from './comment-item';
import type { TicketComment } from '@/services/tickets/comments';

type CommentListProps = {
  comments: TicketComment[];
  currentUserId?: string | null;
  onDelete: (commentId: string) => Promise<void>;
  deletingCommentId?: string | null;
};

/**
 * Composant pour afficher la liste des commentaires
 * 
 * Affiche :
 * - Une liste de commentaires triés par date (plus ancien en premier)
 * - Un message si aucun commentaire
 */
export function CommentList({
  comments,
  currentUserId,
  onDelete,
  deletingCommentId
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
        <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">Aucun commentaire pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onDelete={onDelete}
          isDeleting={deletingCommentId === comment.id}
        />
      ))}
    </div>
  );
}

