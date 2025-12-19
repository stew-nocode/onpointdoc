'use client';

import { Trash2, GitBranch } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { TicketDescription } from '../ticket-description';
import { CommentAttachments } from './comment-attachments';
import { getUserDisplayName } from '@/lib/utils/user-display';
import { formatRelativeDate } from '@/lib/utils/date-formatter';
import type { TicketComment } from '@/services/tickets/comments';
import { cn } from '@/lib/utils';

type CommentItemProps = {
  comment: TicketComment;
  currentUserId?: string | null;
  onDelete: (commentId: string) => Promise<void>;
  isDeleting?: boolean;
};

/**
 * Composant pour afficher un commentaire individuel
 * 
 * Affiche :
 * - Le contenu du commentaire
 * - L'auteur et la date
 * - Un badge si le commentaire vient de JIRA
 * - Un bouton de suppression si l'utilisateur est l'auteur
 */
export function CommentItem({
  comment,
  currentUserId,
  onDelete,
  isDeleting = false
}: CommentItemProps) {
  const isOwner = comment.user_id === currentUserId;
  const isFromJira = comment.origin === 'jira';
  const isFollowup = comment.comment_type === 'followup';
  const canDelete = isOwner && !isFromJira;

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    await onDelete(comment.id);
  };

  return (
    <div className="flex gap-3 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 last:pb-0">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-medium">
          {getUserDisplayName(comment.user).charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {getUserDisplayName(comment.user)}
            </span>
            {isFromJira && (
              <Badge variant="info" className="text-xs">
                <GitBranch className="mr-1 h-3 w-3" />
                JIRA
              </Badge>
            )}
            {isFollowup && !isFromJira && (
              <Badge variant="warning" className="text-xs">
                Relance
              </Badge>
            )}
          </div>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Supprimer le commentaire"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 mb-2">
          <TicketDescription description={comment.content} />
        </div>
        {comment.attachments && comment.attachments.length > 0 && (
          <CommentAttachments
            commentId={comment.id}
            attachments={comment.attachments}
            currentUserId={currentUserId}
            commentUserId={comment.user_id}
          />
        )}
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {formatRelativeDate(comment.created_at)}
        </div>
      </div>
    </div>
  );
}

