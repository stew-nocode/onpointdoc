/**
 * Route API pour les commentaires d'activités
 * 
 * GET /api/activities/[id]/comments - Récupérer les commentaires d'une activité
 * POST /api/activities/[id]/comments - Créer un commentaire sur une activité
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { createActivityComment, getActivityComments } from '@/services/activities/comments';
import { z } from 'zod';

/**
 * Schéma de validation pour créer un commentaire
 */
const createCommentSchema = z.object({
  content: z.string().min(1, 'Le contenu ne peut pas être vide').max(5000, 'Le contenu est trop long'),
  comment_type: z.enum(['comment', 'followup']).optional()
});

/**
 * GET /api/activities/[id]/comments
 * Récupère tous les commentaires d'une activité
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: activityId } = await context.params;

    if (!activityId || !z.string().uuid().safeParse(activityId).success) {
      return NextResponse.json(
        { error: 'ID d\'activité invalide' },
        { status: 400 }
      );
    }

    const comments = await getActivityComments(activityId);

    return NextResponse.json({
      success: true,
      data: comments
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/activities/[id]/comments
 * Crée un nouveau commentaire sur une activité
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: activityId } = await context.params;

    if (!activityId || !z.string().uuid().safeParse(activityId).success) {
      return NextResponse.json(
        { error: 'ID d\'activité invalide' },
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
    const comment = await createActivityComment(activityId, content, comment_type || 'comment');

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

