import { NextRequest, NextResponse } from 'next/server';
import { validateTicket } from '@/services/tickets/index';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { z } from 'zod';

/**
 * Route API pour valider un ticket en tant que manager
 * PATCH /api/tickets/[id]/validate
 * 
 * Met à jour le champ validated_by_manager = true (non bloquant, pour reporting)
 * Accessible uniquement aux managers
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await context.params;

    // Valider l'ID du ticket
    const validationResult = z.object({ id: z.string().uuid() }).safeParse(paramsData);
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('ID de ticket invalide', {
          issues: validationResult.error.issues
        })
      );
    }

    const { id } = validationResult.data;

    // Valider le ticket (vérifie aussi que l'utilisateur est manager)
    const updatedTicket = await validateTicket(id);

    return NextResponse.json(
      {
        success: true,
        data: updatedTicket,
        message: 'Ticket validé avec succès'
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

