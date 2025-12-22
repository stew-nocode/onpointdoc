/**
 * Route API pour les commentaires de tâches
 * 
 * GET /api/tasks/[id]/comments - Récupérer les commentaires d'une tâche
 * POST /api/tasks/[id]/comments - Créer un commentaire sur une tâche
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createTaskComment, getTaskComments } from '@/services/tasks/comments';
import { z } from 'zod';

/**
 * Schéma de validation pour créer un commentaire
 */
const createCommentSchema = z.object({
  content: z.string().min(1, 'Le contenu ne peut pas être vide').max(5000, 'Le contenu est trop long'),
  comment_type: z.enum(['comment', 'followup']).optional()
});

/**
 * GET /api/tasks/[id]/comments
 * Récupère tous les commentaires d'une tâche
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await context.params;

    if (!taskId || !z.string().uuid().safeParse(taskId).success) {
      return NextResponse.json(
        { error: 'ID de tâche invalide' },
        { status: 400 }
      );
    }

    const comments = await getTaskComments(taskId);

    return NextResponse.json({
      success: true,
      data: comments
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tasks/[id]/comments
 * Crée un nouveau commentaire sur une tâche
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await context.params;

    if (!taskId || !z.string().uuid().safeParse(taskId).success) {
      return NextResponse.json(
        { error: 'ID de tâche invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { content, comment_type } = validation.data;
    const comment = await createTaskComment(taskId, content, comment_type || 'comment');

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

