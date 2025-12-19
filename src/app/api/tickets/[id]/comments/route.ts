import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createComment } from '@/services/tickets/comments/crud';
import { createCommentSchema } from '@/lib/validators/comment';

/**
 * Route API pour créer un commentaire sur un ticket
 * POST /api/tickets/[id]/comments
 * 
 * Body :
 * {
 *   "content": "Contenu du commentaire"
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await context.params;
    const body = await request.json();

    // Valider les paramètres de l'URL
    const paramsValidation = createCommentSchema.pick({ ticket_id: true }).safeParse({
      ticket_id: paramsData.id
    });

    if (!paramsValidation.success) {
      return handleApiError(
        paramsValidation.error.issues[0]?.message
          ? new Error(paramsValidation.error.issues[0].message)
          : new Error('ID de ticket invalide')
      );
    }

    // Valider le body
    const bodyValidation = createCommentSchema.pick({ content: true, comment_type: true }).safeParse(body);

    if (!bodyValidation.success) {
      return handleApiError(
        bodyValidation.error.issues[0]?.message
          ? new Error(bodyValidation.error.issues[0].message)
          : new Error('Données invalides')
      );
    }

    const { content, comment_type } = bodyValidation.data;
    const { ticket_id } = paramsValidation.data;

    // Créer le commentaire
    const comment = await createComment(ticket_id, content, comment_type || 'comment');

    return NextResponse.json(
      {
        success: true,
        data: comment,
        message: 'Commentaire ajouté avec succès'
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

