import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateStatus } from '@/services/tickets/bulk-actions';
import { bulkUpdateStatusSchema } from '@/lib/validators/bulk-actions';
import { z } from 'zod';

/**
 * Route API pour mettre à jour le statut de plusieurs tickets en masse
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation avec Zod
    const validated = bulkUpdateStatusSchema.parse(body);
    
    // Utiliser le service pour la logique métier
    const result = await bulkUpdateStatus(validated);
    
    return NextResponse.json(result);
  } catch (error: any) {
    // Gestion des erreurs Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour en masse' },
      { status: 500 }
    );
  }
}

