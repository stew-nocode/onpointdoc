import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { deleteComment } from '@/services/tickets/comments/crud';
import { deleteCommentSchema } from '@/lib/validators/comment';

/**
 * Route API pour supprimer un commentaire
 * DELETE /api/tickets/[id]/comments/[commentId]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const paramsData = await context.params;

    // Valider les paramètres
    const validationResult = deleteCommentSchema.safeParse({
      comment_id: paramsData.commentId
    });

    if (!validationResult.success) {
      return handleApiError(
        validationResult.error.issues[0]?.message
          ? new Error(validationResult.error.issues[0].message)
          : new Error('ID de commentaire invalide')
      );
    }

    const { comment_id } = validationResult.data;

    // Supprimer le commentaire
    await deleteComment(comment_id);

    return NextResponse.json(
      {
        success: true,
        message: 'Commentaire supprimé avec succès'
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

