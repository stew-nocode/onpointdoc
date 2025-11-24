import { NextRequest, NextResponse } from 'next/server';
import { listTicketsPaginated } from '@/services/tickets';
import type { QuickFilter } from '@/types/ticket-filters';
import { ticketsListParamsSchema } from '@/lib/validators/api-params';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';
import { parseAdvancedFiltersFromParams } from '@/lib/validators/advanced-filters';

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = string; // Accepte tous les statuts (JIRA ou locaux)

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Logger uniquement en développement pour éviter de ralentir en production
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] /api/tickets/list - Début de la requête');
    }
    
    // Extraire et valider les paramètres avec Zod
    const searchParams = request.nextUrl.searchParams;
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] SearchParams:', Object.fromEntries(searchParams.entries()));
    }
    
    const rawParams: Record<string, string | string[] | undefined> = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      quick: searchParams.get('quick') || undefined,
      currentProfileId: searchParams.get('currentProfileId') || undefined,
      offset: searchParams.get('offset') || '0',
      limit: searchParams.get('limit') || '25',
      sortColumn: searchParams.get('sortColumn') || undefined,
      sortDirection: searchParams.get('sortDirection') || undefined
    };
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] rawParams de base:', rawParams);
    }

    // Extraire les paramètres de filtres avancés (peuvent être multiples)
    const arrayFilterKeys = [
      'types',
      'statuses',
      'priorities',
      'assignedTo',
      'products',
      'modules',
      'channels',
      'origins'
    ];

    // Traiter les paramètres de type tableau (peuvent avoir plusieurs valeurs)
    arrayFilterKeys.forEach((key) => {
      const values = searchParams.getAll(key);
      if (values.length > 0) {
        rawParams[key] = values.length === 1 ? values[0] : values;
      }
    });

    // Extraire les paramètres de date (spécifiques)
    const dateFilterKeys = [
      'createdAtPreset',
      'createdAtStart',
      'createdAtEnd',
      'resolvedAtPreset',
      'resolvedAtStart',
      'resolvedAtEnd'
    ];

    dateFilterKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        rawParams[key] = value;
      }
    });

    // Extraire hasJiraSync comme booléen unique (pas un tableau)
    const hasJiraSyncValue = searchParams.get('hasJiraSync');
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] hasJiraSyncValue:', hasJiraSyncValue);
    }
    if (hasJiraSyncValue !== null) {
      rawParams.hasJiraSync = hasJiraSyncValue;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] rawParams complets après extraction:', rawParams);
    }

    // Séparer les paramètres de base des paramètres de filtres avancés
    // car ticketsListParamsSchema ne contient pas les filtres avancés
    const baseParams: Record<string, string | string[] | undefined> = {
      type: rawParams.type,
      status: rawParams.status,
      search: rawParams.search,
      quick: rawParams.quick,
      currentProfileId: rawParams.currentProfileId,
      offset: rawParams.offset,
      limit: rawParams.limit,
      sortColumn: rawParams.sortColumn,
      sortDirection: rawParams.sortDirection
    };
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] baseParams pour validation Zod:', baseParams);
    }

    // Valider les paramètres de base avec Zod (sans les filtres avancés)
    const validationResult = ticketsListParamsSchema.safeParse(baseParams);
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Validation Zod result:', validationResult.success);
    }
    if (!validationResult.success) {
      return handleApiError(
        createError.validationError('Paramètres invalides', {
          issues: validationResult.error.issues
        })
      );
    }

    const params = validationResult.data;
    const type = params.type as TicketTypeFilter | undefined;
    const status = params.status as TicketStatusFilter | undefined;
    const search = params.search || null;
    const quickFilterParam = params.quick as QuickFilter | undefined;
    const currentProfileIdParam = params.currentProfileId || null;
    const offset = params.offset;
    const limit = params.limit;
    const sortColumn = params.sortColumn as TicketSortColumn | undefined;
    const sortDirection = params.sortDirection as SortDirection | undefined;

    // Parser les filtres avancés depuis rawParams (qui contient tous les paramètres)
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Début du parsing des filtres avancés');
    }
    const advancedFilters = parseAdvancedFiltersFromParams(rawParams);
    if (process.env.NODE_ENV === 'development' && advancedFilters) {
      console.log('[DEBUG] Filtres avancés parsés:', JSON.stringify(advancedFilters, null, 2));
    }

    // Utiliser le service listTicketsPaginated pour une logique cohérente
    const result = await listTicketsPaginated(
      type,
      status,
      offset,
      limit,
      search || undefined,
      quickFilterParam,
      currentProfileIdParam || null,
      sortColumn,
      sortDirection,
      advancedFilters || undefined
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[ERROR] Erreur dans /api/tickets/list:', error);
    if (error instanceof Error) {
      console.error('[ERROR] Message:', error.message);
      console.error('[ERROR] Stack:', error.stack);
    }
    return handleApiError(error);
  }
}

