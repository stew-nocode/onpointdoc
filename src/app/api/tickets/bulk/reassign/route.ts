import { NextRequest, NextResponse } from 'next/server';
import { bulkReassign } from '@/services/tickets/bulk-actions';
import { bulkReassignSchema } from '@/lib/validators/bulk-actions';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';

/**
 * PATCH /api/tickets/bulk/reassign
 * Réassigne plusieurs tickets en masse
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validationResult = bulkReassignSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Paramètres invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    const result = await bulkReassign(validationResult.data);

    return NextResponse.json(result);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

