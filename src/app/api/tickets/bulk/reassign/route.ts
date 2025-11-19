import { NextRequest, NextResponse } from 'next/server';
import { bulkReassign } from '@/services/tickets/bulk-actions';
import { bulkReassignSchema } from '@/lib/validators/bulk-actions';
import { z } from 'zod';

/**
 * Route API pour réassigner plusieurs tickets en masse
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation avec Zod
    const validated = bulkReassignSchema.parse(body);
    
    // Utiliser le service pour la logique métier
    const result = await bulkReassign(validated);
    
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
      { error: error.message || 'Erreur lors de la réassignation en masse' },
      { status: 500 }
    );
  }
}

