import { NextRequest, NextResponse } from 'next/server';
import { listCampaignsPaginated } from '@/services/email-marketing/list-campaigns-paginated';
import { handleApiError } from '@/lib/errors/handlers';
import type { CampaignQuickFilter } from '@/types/campaign-filters';
import { parseCampaignSort } from '@/types/campaign-sort';

/**
 * Route API pour lister les campagnes email avec pagination
 * 
 * Pattern similaire à /api/tasks/list et /api/activities/list pour cohérence
 * 
 * Query params :
 * - offset: number (défaut: 0)
 * - limit: number (défaut: 25)
 * - search: string (recherche par campaign_name et email_subject)
 * - quick: CampaignQuickFilter (filtre rapide: all, sent, draft, scheduled)
 * - sort: string (format "column:direction", ex: "sent_at:desc")
 * 
 * @param request - Requête Next.js
 * @returns Réponse JSON avec campagnes paginées
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Récupérer les paramètres de pagination
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    
    // Récupérer les paramètres de recherche et filtres
    const search = searchParams.get('search') || undefined;
    const quickFilter = searchParams.get('quick') as CampaignQuickFilter | null;
    
    // Récupérer le tri depuis l'URL (format "column:direction")
    const sortParam = searchParams.get('sort');
    const sort = parseCampaignSort(sortParam || undefined);

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
    const validQuickFilters: CampaignQuickFilter[] = ['all', 'sent', 'draft', 'scheduled'];
    if (quickFilter && !validQuickFilters.includes(quickFilter)) {
      return NextResponse.json(
        { error: `Le filtre rapide '${quickFilter}' n'est pas valide` },
        { status: 400 }
      );
    }

    // Appeler le service avec les paramètres validés
    const result = await listCampaignsPaginated(
      offset,
      limit,
      search,
      quickFilter || undefined,
      sort.column,
      sort.direction
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

