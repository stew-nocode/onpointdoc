/**
 * Route API pour un commentaire spécifique de tâche
 * 
 * DELETE /api/tasks/[id]/comments/[commentId] - Supprimer un commentaire
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { deleteTaskComment } from '@/services/tasks/comments';
import { z } from 'zod';

/**
 * DELETE /api/tasks/[id]/comments/[commentId]
 * Supprime un commentaire d'une tâche
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: taskId, commentId } = await context.params;

    if (!taskId || !z.string().uuid().safeParse(taskId).success) {
      return NextResponse.json(
        { error: 'ID de tâche invalide' },
        { status: 400 }
      );
    }

    if (!commentId || !z.string().uuid().safeParse(commentId).success) {
      return NextResponse.json(
        { error: 'ID de commentaire invalide' },
        { status: 400 }
      );
    }

    await deleteTaskComment(commentId);

    return NextResponse.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });
  } catch (error) {
    return handleApiError(error);
  }
}

