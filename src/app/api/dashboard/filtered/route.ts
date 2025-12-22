import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getCEODashboardData } from '@/services/dashboard/ceo-kpis';
import type { Period } from '@/types/dashboard';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';
import { getCurrentUserProfile } from '@/services/users/server';
import { handleApiError } from '@/lib/errors/handlers';

/**
 * Route API pour les données filtrées du dashboard
 *
 * GET /api/dashboard/filtered?period=month&startDate=...&endDate=...&includeOld=true
 *
 * Charge uniquement les données qui dépendent des filtres de période :
 * - KPIs stratégiques filtrés
 * - Charts d'évolution
 * - Statistiques par entreprise/module/agent
 *
 * ✅ OPTIMISATION : Endpoint séparé pour ne recharger que ce qui change
 * - Gain : -40% données chargées lors changement de filtre
 * - Les KPIs statiques sont déjà en cache (endpoint /static)
 */
export async function GET(request: NextRequest) {
  // Désactiver le cache Next.js (on utilise Cache-Control HTTP)
  noStore();

  try {
    // Récupérer le profil utilisateur
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Parser les filtres depuis l'URL
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    const filters = parseDashboardFiltersFromParams(params);
    const period = filters?.period || 'month';
    const includeOld = filters?.includeOld ?? true;

    // Vérifier si des dates personnalisées sont fournies
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    // Utiliser les dates personnalisées si fournies, sinon calculer selon la période
    let startDate: string;
    let endDate: string;

    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const { getPeriodDates } = await import('@/services/dashboard/period-utils');
      const periodDates = getPeriodDates(period);
      startDate = periodDates.startDate;
      endDate = periodDates.endDate;
    }

    const responseData: any = {
      period: period as Period,
      periodStart: startDate,
      periodEnd: endDate,
    };

    // Charger les données selon le rôle
    const role = profile.role;

    if (role === 'direction' || role === 'admin') {
      // Direction ou Admin : données stratégiques globales
      const strategic = await getCEODashboardData(
        period,
        filters || undefined,
        customStartDate || undefined,
        customEndDate || undefined
      );

      responseData.strategic = strategic;
      responseData.periodStart = strategic.periodStart;
      responseData.periodEnd = strategic.periodEnd;
    }

    // === CHARTS (filtrés par période) - Direction, Manager, Admin ===
    if (role !== 'agent') {
      const OBC_PRODUCT_ID = '91304e02-2ce6-4811-b19d-1cae091a6fde';

      // Importer les services de stats des charts
      const { getTicketsDistributionStats } = await import('@/services/dashboard/tickets-distribution-stats');
      const { getTicketsEvolutionStats } = await import('@/services/dashboard/tickets-evolution-stats');
      const { getTicketsByCompanyStats } = await import('@/services/dashboard/tickets-by-company-stats');
      const { getBugsByTypeStats } = await import('@/services/dashboard/bugs-by-type-stats');
      const { getCampaignsResultsStats } = await import('@/services/dashboard/campaigns-results-stats');
      const { getTicketsByModuleStats } = await import('@/services/dashboard/tickets-by-module-stats');
      const { getBugsByTypeAndModuleStats } = await import('@/services/dashboard/bugs-by-type-and-module-stats');
      const { getAssistanceTimeByCompanyStats } = await import('@/services/dashboard/assistance-time-by-company-stats');
      const { getAssistanceTimeEvolutionStats } = await import('@/services/dashboard/assistance-time-evolution-stats');
      const { getSupportAgentsStats } = await import('@/services/dashboard/support-agents-stats');
      const { getSupportAgentsRadarStats } = await import('@/services/dashboard/support-agents-radar-stats');
      const { getCompaniesCardsStats } = await import('@/services/dashboard/companies-cards-stats');

      // Charger les stats charts en parallèle
      const [
        distributionStats,
        evolutionStats,
        byCompanyStats,
        bugsByTypeStats,
        campaignsStats,
        byModuleStats,
        bugsByTypeModuleStats,
        assistanceTimeStats,
        assistanceTimeEvolutionStats,
        supportAgentsStats,
        supportAgentsRadarStats,
        companiesCardsStats,
      ] = await Promise.all([
        getTicketsDistributionStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          includeOld
        ),
        getTicketsEvolutionStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          period,
          includeOld
        ),
        getTicketsByCompanyStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          10,
          includeOld
        ),
        getBugsByTypeStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          10,
          includeOld
        ),
        getCampaignsResultsStats(
          responseData.periodStart,
          responseData.periodEnd,
          10
        ),
        getTicketsByModuleStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          10,
          includeOld
        ),
        getBugsByTypeAndModuleStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          15,
          includeOld
        ),
        getAssistanceTimeByCompanyStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          10,
          includeOld
        ),
        getAssistanceTimeEvolutionStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          period,
          includeOld
        ),
        getSupportAgentsStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          includeOld
        ),
        getSupportAgentsRadarStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          6,
          includeOld
        ),
        getCompaniesCardsStats(
          OBC_PRODUCT_ID,
          responseData.periodStart,
          responseData.periodEnd,
          10,
          includeOld
        ),
      ]);

      // Ajouter les stats des charts à la réponse
      responseData.ticketsDistributionStats = distributionStats ?? undefined;
      responseData.ticketsEvolutionStats = evolutionStats ?? undefined;
      responseData.ticketsByCompanyStats = byCompanyStats ?? undefined;
      responseData.bugsByTypeStats = bugsByTypeStats ?? undefined;
      responseData.campaignsResultsStats = campaignsStats ?? undefined;
      responseData.ticketsByModuleStats = byModuleStats ?? undefined;
      responseData.bugsByTypeAndModuleStats = bugsByTypeModuleStats ?? undefined;
      responseData.assistanceTimeByCompanyStats = assistanceTimeStats ?? undefined;
      responseData.assistanceTimeEvolutionStats = assistanceTimeEvolutionStats ?? undefined;
      responseData.supportAgentsStats = supportAgentsStats ?? undefined;
      responseData.supportAgentsRadarStats = supportAgentsRadarStats ?? undefined;
      responseData.companiesCardsStats = companiesCardsStats ?? undefined;
    }

    // ✅ OPTIMISATION : Headers Cache-Control pour données filtrées
    // - Cache plus court (30s) car données changent avec les filtres
    // - stale-while-revalidate pour UX fluide
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
    });

    return NextResponse.json(responseData, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}
