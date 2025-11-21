import { NextRequest, NextResponse } from 'next/server';
import { listTicketsPaginated } from '@/services/tickets';
import type { QuickFilter } from '@/types/ticket-filters';
import { ticketsListParamsSchema } from '@/lib/validators/api-params';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = string; // Accepte tous les statuts (JIRA ou locaux)

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extraire et valider les paramètres avec Zod
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
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

    // Valider avec Zod
    const validationResult = ticketsListParamsSchema.safeParse(rawParams);
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
      sortDirection
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

