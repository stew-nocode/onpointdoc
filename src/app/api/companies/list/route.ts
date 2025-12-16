/**
 * Route API pour lister les entreprises avec pagination
 * 
 * Pattern similaire à /api/tasks/list pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (exposer listCompaniesPaginated)
 * - Gestion d'erreur centralisée avec handleApiError
 * - Validation des paramètres avec Zod (optionnel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { listCompaniesPaginated } from '@/services/companies/list-companies-paginated';
import { handleApiError } from '@/lib/errors/handlers';
import type { CompanyQuickFilter } from '@/types/company-filters';
import { parseCompanySort } from '@/types/company-sort';

/**
 * GET /api/companies/list
 * 
 * Liste les entreprises avec pagination, recherche, filtres et tri
 * 
 * Query params:
 * - offset: number (défaut: 0)
 * - limit: number (défaut: 25)
 * - search: string (optionnel)
 * - quick: CompanyQuickFilter (optionnel)
 * - sort: string (format: "column:direction", ex: "name:asc")
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search') || undefined;
    const quickParam = searchParams.get('quick');
    const quickFilter = quickParam && ['all', 'with_users', 'without_users', 'with_tickets', 'with_open_tickets', 'with_assistance'].includes(quickParam)
      ? (quickParam as CompanyQuickFilter)
      : undefined;
    
    const sortParam = searchParams.get('sort');
    const sort = sortParam ? parseCompanySort(sortParam) : { column: 'name' as const, direction: 'asc' as const };

    const result = await listCompaniesPaginated(
      offset,
      limit,
      search,
      quickFilter,
      sort.column,
      sort.direction
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération des entreprises');
  }
}
