import { NextRequest, NextResponse } from 'next/server';
import { getCEODashboardData } from '@/services/dashboard/ceo-kpis';
import type { Period } from '@/types/dashboard';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';
import { handleApiError } from '@/lib/errors/handlers';

/**
 * Route API pour récupérer les données du dashboard CEO
 * 
 * GET /api/dashboard/ceo?period=month&products=...&teams=...&types=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    
    const filters = parseDashboardFiltersFromParams(params);
    const period = filters?.period || 'month';

    const data = await getCEODashboardData(period, filters || undefined);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

