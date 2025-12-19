import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getCEODashboardData } from '@/services/dashboard/ceo-kpis';
import type { Period, UnifiedDashboardData, CEODashboardData, TeamDashboardData, AgentDashboardData } from '@/types/dashboard';
import type { DashboardRole } from '@/types/dashboard';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';
import { mapProfileRoleToDashboardRole } from '@/lib/utils/dashboard-config';
import { getCurrentUserProfile } from '@/services/users/server';
import { handleApiError } from '@/lib/errors/handlers';
import { getPeriodDates } from '@/services/dashboard/period-utils';

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
  // Désactiver le cache pour forcer le rechargement des données
  // Le cache React.cache() pourrait bloquer les mises à jour avec les nouvelles périodes
  noStore();
  
  try {
    // Récupérer le profil utilisateur
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Mapper le rôle du profil vers DashboardRole
    const dashboardRole = mapProfileRoleToDashboardRole(profile.role);

    // Log pour debug (dev uniquement)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Dashboard] User profile:', {
        profileRole: profile.role,
        dashboardRole,
        profileId: profile.id,
      });
    }

    // Parser les filtres depuis l'URL
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    const filters = parseDashboardFiltersFromParams(params);
    const period = filters?.period || 'month';

    // Vérifier si des dates personnalisées sont fournies
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    // Utiliser les dates personnalisées si fournies, sinon calculer selon la période
    let startDate: string;
    let endDate: string;
    
    if (customStartDate && customEndDate) {
      // Utiliser les dates personnalisées
      startDate = customStartDate;
      endDate = customEndDate;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Dashboard] Using custom dates:', {
          period,
          startDate,
          endDate,
        });
      }
    } else {
      // Calculer les dates de période (gère aussi les années spécifiques comme "2024")
      const periodDates = getPeriodDates(period);
      startDate = periodDates.startDate;
      endDate = periodDates.endDate;
    }

    // Récupérer les alertes (tous les rôles)
    const { getOperationalAlerts } = await import('@/services/dashboard/operational-alerts');
    const alerts = await getOperationalAlerts();

    // Charger les données selon le rôle
    const responseData: UnifiedDashboardData = {
      role: dashboardRole,
      alerts,
      period: period as 'week' | 'month' | 'quarter' | 'year',
      periodStart: startDate,
      periodEnd: endDate,
    };

    if (dashboardRole === 'direction' || dashboardRole === 'admin') {
      // Direction ou Admin : données stratégiques globales
      
      // Log pour debug (dev uniquement)
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Dashboard] Loading strategic data:', {
          dashboardRole,
          period,
          startDate,
          endDate,
          filters,
        });
      }
      
      // Passer les dates personnalisées si disponibles
      const strategic = await getCEODashboardData(
        period, 
        filters || undefined,
        customStartDate || undefined,
        customEndDate || undefined
      );
      
      // Log pour debug (dev uniquement)
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Dashboard] Strategic data loaded:', {
          period,
          mttr: strategic.mttr.global,
          fluxOpened: strategic.flux.opened,
          fluxResolved: strategic.flux.resolved,
          resolutionRate: strategic.flux.resolutionRate,
        });
      }
      
      responseData.strategic = strategic;
    } else if (dashboardRole === 'manager') {
      // Manager : données de l'équipe
      // TODO: Implémenter getTeamDashboardData
      const teamData: TeamDashboardData = {
        teamId: profile.id, // Temporaire
        teamName: profile.department || 'Équipe',
        mttr: { global: 0, byProduct: [], byType: [], trend: 0 },
        flux: { opened: 0, resolved: 0, resolutionRate: 0, byProduct: [], trend: { openedTrend: 0, resolvedTrend: 0 } },
        workload: { byTeam: [], byAgent: [], totalActive: 0 },
        health: { byProduct: [], topBugModules: [] },
        alerts: [],
        period: period as 'week' | 'month' | 'quarter' | 'year',
        periodStart: responseData.periodStart,
        periodEnd: responseData.periodEnd,
      };
      responseData.team = teamData;
    } else if (dashboardRole === 'agent') {
      // Agent : données personnelles
      // TODO: Implémenter getAgentDashboardData
      const personalData: AgentDashboardData = {
        agentId: profile.id,
        agentName: profile.full_name || 'Agent',
        myTickets: { active: 0, resolved: 0, pending: 0 },
        myTasks: { todo: 0, inProgress: 0, done: 0, blocked: 0 },
        myActivities: { upcoming: 0, completed: 0 },
        alerts: [],
        period: period as 'week' | 'month' | 'quarter' | 'year',
        periodStart: responseData.periodStart,
        periodEnd: responseData.periodEnd,
      };
      responseData.personal = personalData;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}

