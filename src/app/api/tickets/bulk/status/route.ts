import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateStatus } from '@/services/tickets/bulk-actions';
import { bulkUpdateStatusSchema } from '@/lib/validators/bulk-actions';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';

/**
 * PATCH /api/tickets/bulk/status
 * Met à jour le statut de plusieurs tickets en masse
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validationResult = bulkUpdateStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Paramètres invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    const result = await bulkUpdateStatus(validationResult.data);

    return NextResponse.json(result);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

