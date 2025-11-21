import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdatePriority } from '@/services/tickets/bulk-actions';
import { bulkUpdatePrioritySchema } from '@/lib/validators/bulk-actions';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';

/**
 * PATCH /api/tickets/bulk/priority
 * Met à jour la priorité de plusieurs tickets en masse
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validationResult = bulkUpdatePrioritySchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Paramètres invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    const result = await bulkUpdatePriority(validationResult.data);

    return NextResponse.json(result);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

