/**
 * API Route pour la recherche d'entités liables aux activités
 * 
 * Recherche optimisée avec lazy loading côté client
 * Supporte AbortController pour annuler les requêtes précédentes
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchLinkableEntities } from '@/services/activities/search-links';
import { searchLinkableEntitiesSchema } from '@/lib/validators/activity-links';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Lire le corps de la requête
    const body = await request.json();
    
    // Valider les paramètres avec Zod
    const validationResult = searchLinkableEntitiesSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Paramètres invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    const { entityType, searchKey, limit } = validationResult.data;

    // Effectuer la recherche
    const entities = await searchLinkableEntities(entityType, searchKey, limit);

    return NextResponse.json({ entities }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
