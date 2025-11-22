'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { TicketComment } from '@/services/tickets/comments';

type UseCommentsReturn = {
  comments: TicketComment[];
  addComment: (comment: TicketComment) => void;
  deleteComment: (commentId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  deletingCommentId: string | null;
  setDeletingCommentId: (id: string | null) => void;
};

/**
 * Hook pour gérer l'état des commentaires d'un ticket
 * 
 * Fournit :
 * - Liste des commentaires
 * - Fonctions pour ajouter/supprimer des commentaires (optimistic update)
 * - État de chargement
 */
export function useComments(initialComments: TicketComment[]): UseCommentsReturn {
  const [comments, setComments] = useState<TicketComment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const addComment = useCallback((comment: TicketComment) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  const deleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  return {
    comments,
    addComment,
    deleteComment,
    isLoading,
    setIsLoading,
    deletingCommentId,
    setDeletingCommentId
  };
}

