'use client';

import { useState, useCallback, useEffect } from 'react';
import { CommentsSection } from './comments-section';
import { useComments } from '@/hooks/tickets/use-comments';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { TicketComment } from '@/services/tickets/comments';

type CommentsSectionClientProps = {
  ticketId: string;
  initialComments: TicketComment[];
};

/**
 * Wrapper Client Component pour la section commentaires
 * 
 * Gère l'état des commentaires et l'ID de l'utilisateur actuel
 */
export function CommentsSectionClient({
  ticketId,
  initialComments
}: CommentsSectionClientProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const {
    comments,
    addComment,
    deleteComment,
    isLoading,
    setIsLoading,
    deletingCommentId,
    setDeletingCommentId
  } = useComments(initialComments);

  useEffect(() => {
    async function loadCurrentUserProfileId() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setCurrentUserId(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_uid', user.id)
        .single();

      setCurrentUserId(profile?.id || null);
    }

    loadCurrentUserProfileId();
  }, []);

  const handleCommentAdded = useCallback(
    (comment: TicketComment) => {
      addComment(comment);
    },
    [addComment]
  );

  const handleCommentDeleted = useCallback(
    async (commentId: string) => {
      setDeletingCommentId(commentId);
      setIsLoading(true);

      try {
        deleteComment(commentId);
      } catch (error) {
        throw error;
      } finally {
        setDeletingCommentId(null);
        setIsLoading(false);
      }
    },
    [deleteComment, setIsLoading, setDeletingCommentId]
  );

  return (
    <CommentsSection
      ticketId={ticketId}
      initialComments={comments}
      currentUserId={currentUserId}
      onCommentAdded={handleCommentAdded}
      onCommentDeleted={handleCommentDeleted}
      isLoading={isLoading}
      deletingCommentId={deletingCommentId}
    />
  );
}

