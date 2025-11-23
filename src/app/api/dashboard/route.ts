import { NextRequest, NextResponse } from 'next/server';
import { getCEODashboardData } from '@/services/dashboard/ceo-kpis';
import type { Period } from '@/types/dashboard';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';
import { mapProfileRoleToDashboardRole } from '@/lib/utils/dashboard-config';
import { getCurrentUserProfile } from '@/services/users/server';
import { handleApiError } from '@/lib/errors/handlers';

/**
 * Route API unifiée pour récupérer les données du dashboard selon le rôle
 * 
 * GET /api/dashboard?period=month&products=...&teams=...&types=...
 * 
 * Charge automatiquement les données appropriées selon le rôle de l'utilisateur :
 * - Direction : données stratégiques globales
 * - Manager : données de l'équipe
 * - Agent : données personnelles
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer le profil utilisateur
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Mapper le rôle du profil vers DashboardRole
    const dashboardRole = mapProfileRoleToDashboardRole(profile.role);

    // Parser les filtres depuis l'URL
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    const filters = parseDashboardFiltersFromParams(params);
    const period = filters?.period || 'month';

    // Récupérer les alertes (tous les rôles)
    const { getOperationalAlerts } = await import('@/services/dashboard/operational-alerts');
    const alerts = await getOperationalAlerts();

    // Charger les données selon le rôle
    let responseData: any = {
      role: dashboardRole,
      alerts,
      period,
      periodStart: new Date().toISOString(), // TODO: calculer selon période
      periodEnd: new Date().toISOString(),
    };

    if (dashboardRole === 'direction') {
      // Direction : données stratégiques globales
      const strategic = await getCEODashboardData(period, filters || undefined);
      responseData.strategic = strategic;
    } else if (dashboardRole === 'manager') {
      // Manager : données de l'équipe
      // TODO: Implémenter getTeamDashboardData
      responseData.team = {
        teamId: profile.id, // Temporaire
        teamName: profile.department || 'Équipe',
        // TODO: Charger les données de l'équipe
      };
    } else if (dashboardRole === 'agent') {
      // Agent : données personnelles
      // TODO: Implémenter getAgentDashboardData
      responseData.personal = {
        agentId: profile.id,
        agentName: profile.full_name || 'Agent',
        // TODO: Charger les données personnelles
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}

