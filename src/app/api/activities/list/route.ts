import { NextRequest, NextResponse } from 'next/server';
import { listActivitiesPaginated } from '@/services/activities';
import { handleApiError } from '@/lib/errors/handlers';
import type { ActivityQuickFilter } from '@/types/activity-filters';
import { getCachedCurrentUserProfileId } from '@/lib/auth/cached-auth';

/**
 * Route API pour lister les activités avec pagination
 * 
 * Pattern similaire à /api/tickets/list pour cohérence
 * 
 * Query params :
 * - offset: number (défaut: 0)
 * - limit: number (défaut: 25)
 * - search: string (recherche par titre)
 * - quick: ActivityQuickFilter (filtre rapide)
 * - profileId: string (ID du profil utilisateur pour filtres conditionnels)
 * 
 * @param request - Requête Next.js
 * @returns Réponse JSON avec activités paginées
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Récupérer les paramètres de pagination
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    
    // Récupérer les paramètres de recherche et filtres
    const search = searchParams.get('search') || undefined;
    const quickFilter = searchParams.get('quick') as ActivityQuickFilter | null;
    
    // Récupérer le profil utilisateur (pour filtres conditionnels)
    // Si profileId est fourni dans les params, l'utiliser, sinon récupérer depuis l'auth
    let currentProfileId: string | null | undefined;
    const profileIdParam = searchParams.get('profileId');
    if (profileIdParam) {
      currentProfileId = profileIdParam;
    } else {
      currentProfileId = await getCachedCurrentUserProfileId();
    }

    // Valider les paramètres
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Le paramètre offset doit être un nombre positif' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Le paramètre limit doit être entre 1 et 100' },
        { status: 400 }
      );
    }

    // Valider le quick filter
    const validQuickFilters: ActivityQuickFilter[] = ['all', 'mine', 'planned', 'unplanned', 'week', 'month'];
    if (quickFilter && !validQuickFilters.includes(quickFilter)) {
      return NextResponse.json(
        { error: `Le filtre rapide '${quickFilter}' n'est pas valide` },
        { status: 400 }
      );
    }

    // Appeler le service
    const result = await listActivitiesPaginated(
      offset,
      limit,
      search,
      quickFilter || undefined,
      currentProfileId
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
