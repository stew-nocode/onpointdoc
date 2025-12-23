/**
 * Route API pour un commentaire spécifique d'activité
 * 
 * DELETE /api/activities/[id]/comments/[commentId] - Supprimer un commentaire
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { deleteActivityComment } from '@/services/activities/comments';
import { z } from 'zod';

/**
 * DELETE /api/activities/[id]/comments/[commentId]
 * Supprime un commentaire d'une activité
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: activityId, commentId } = await context.params;

    if (!activityId || !z.string().uuid().safeParse(activityId).success) {
      return NextResponse.json(
        { error: 'ID d\'activité invalide' },
        { status: 400 }
      );
    }

    if (!commentId || !z.string().uuid().safeParse(commentId).success) {
      return NextResponse.json(
        { error: 'ID de commentaire invalide' },
        { status: 400 }
      );
    }

    await deleteActivityComment(commentId);

    return NextResponse.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });
  } catch (error) {
    return handleApiError(error);
  }
}

