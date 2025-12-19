import { PageLayoutWithDashboardFilters } from '@/components/layout/page';
import { UnifiedDashboardWithWidgets } from '@/components/dashboard/unified-dashboard-with-widgets';
import { getCachedUserDashboardConfig } from '@/services/dashboard/widgets';
import { DashboardFiltersSidebarClient } from '@/components/dashboard/ceo/filters/dashboard-filters-sidebar-client';
import { listProducts } from '@/services/products';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';
import { getCurrentUserProfile } from '@/services/users/server';
import { mapProfileRoleToDashboardRole } from '@/lib/utils/dashboard-config';
import { getPeriodDates } from '@/services/dashboard/period-utils';
import type { UnifiedDashboardData } from '@/types/dashboard';
import type { DashboardRole } from '@/types/dashboard-widgets';

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Configuration ISR désactivée pour permettre les filtres dynamiques
 *
 * IMPORTANT: Le cache ISR (60s) empêchait les filtres de fonctionner
 * car la page était servie depuis le cache même quand les URL params changeaient.
 *
 * Solution: Désactiver le cache ISR (revalidate = 0) pour forcer le rendu
 * à chaque changement de filtre.
 */
export const revalidate = 0;

/**
 * Page du dashboard unifié
 *
 * Affiche les KPIs selon le rôle de l'utilisateur :
 * - Direction : KPIs stratégiques globaux
 * - Manager : KPIs de l'équipe
 * - Agent : KPIs personnels
 *
 * Avec rafraîchissement temps réel + cache ISR 60s
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // ISR activé - plus besoin de noStore()

  // Récupérer le profil utilisateur pour déterminer le rôle
  const profile = await getCurrentUserProfile();
  
  if (!profile) {
    // Redirection gérée par middleware
    return null;
  }

  const dashboardRole = mapProfileRoleToDashboardRole(profile.role) as DashboardRole;

  const resolvedSearchParams = await searchParams;
  const params = resolvedSearchParams || {};
  const filters = parseDashboardFiltersFromParams(params);
  // Accepter à la fois les périodes (week, month, quarter, year) ET les années spécifiques ("2024")
  const period = filters?.period || 'month';

  const customRange = getCustomRangeFromParams(params);
  let effectivePeriodStart: string;
  let effectivePeriodEnd: string;

  if (customRange) {
    effectivePeriodStart = customRange.start;
    effectivePeriodEnd = customRange.end;
  } else {
    const periodDates = getPeriodDates(period);
    effectivePeriodStart = periodDates.startDate;
    effectivePeriodEnd = periodDates.endDate;
  }

  // Charger la configuration des widgets (affectation par rôle + préférences utilisateur)
  // ✅ OPTIMISÉ : Utilise React.cache() pour éviter les appels répétés
  const widgetConfig = await getCachedUserDashboardConfig(profile.id, dashboardRole);

  // Charger les données selon le rôle (directement via les services)
  const { getCEODashboardData } = await import('@/services/dashboard/ceo-kpis');
  const { getOperationalAlerts } = await import('@/services/dashboard/operational-alerts');
  const { getBugHistoryStats } = await import('@/services/dashboard/bug-history-stats');
  const { getReqHistoryStats } = await import('@/services/dashboard/req-history-stats');
  const { getAssistanceHistoryStats } = await import('@/services/dashboard/assistance-history-stats');
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
  const alerts = await getOperationalAlerts();

  let initialData: UnifiedDashboardData = {
    role: dashboardRole,
    alerts,
    period,
    periodStart: effectivePeriodStart,
    periodEnd: effectivePeriodEnd,
  };

  // === KPIs STATIQUES (temps réel, non filtrés) - Admin & Direction uniquement ===
  if (dashboardRole === 'admin' || dashboardRole === 'direction') {
    // ID du produit OBC pour les stats temps réel
    const OBC_PRODUCT_ID = '91304e02-2ce6-4811-b19d-1cae091a6fde';

    // ✅ OPTIMISATION : 1 seule requête au lieu de 6 (3 services × 2 requêtes each)
    const { getAllTicketStats } = await import('@/services/dashboard/all-ticket-stats');
    const allStats = await getAllTicketStats(OBC_PRODUCT_ID);

    // Transformer en format attendu par le dashboard
    // ✅ S'assurer que toutes les valeurs sont des nombres (pas undefined)
    initialData.bugHistoryStats = {
      total: Number(allStats.bug?.total ?? 0),
      ouverts: Number(allStats.bug?.ouverts ?? 0),
      resolus: Number(allStats.bug?.resolus ?? 0),
      tauxResolution: Number(allStats.bug?.tauxResolution ?? 0),
      critiquesOuverts: 0, // Retiré de l'affichage
      highOuverts: 0,      // Retiré de l'affichage
      mttrHeures: null,    // Retiré de l'affichage
    };

    // ✅ Mapper correctement : resolus → implementees, ouverts → enCours
    // Note: Le mapping n'est pas parfait car "ouverts" = tous non-résolus,
    // mais "enCours" = seulement ceux en développement. On utilise une approximation.
    initialData.reqHistoryStats = {
      total: Number(allStats.req?.total ?? 0),
      enCours: Number(allStats.req?.ouverts ?? 0), // Approximation : ouverts = en cours
      implementees: Number(allStats.req?.resolus ?? 0), // resolus = implémentées
      tauxImplementation: Number(allStats.req?.tauxResolution ?? 0),
    };

    // ✅ Pour ASSISTANCE, on ne peut pas mapper directement car la structure est différente
    // On utilise les valeurs de base mais il faudrait une fonction dédiée pour les stats détaillées
    // Pour l'instant, on utilise une approximation
    initialData.assistanceHistoryStats = {
      total: Number(allStats.assistance?.total ?? 0),
      ouvertes: Number(allStats.assistance?.ouverts ?? 0),
      resolues: Number(allStats.assistance?.resolus ?? 0),
      transferees: 0, // Non disponible dans getAllTicketStats, nécessiterait une requête séparée
      tauxResolutionDirecte: Number(allStats.assistance?.tauxResolution ?? 0),
      tauxTransfert: 0, // Non disponible dans getAllTicketStats
    };
  }

  if (dashboardRole === 'direction') {
    // Direction : données stratégiques globales
    const strategic = await getCEODashboardData(
      period,
      filters || undefined,
      customRange?.start,
      customRange?.end
    );
    initialData.strategic = strategic;
    initialData.periodStart = strategic.periodStart;
    initialData.periodEnd = strategic.periodEnd;
  } else if (dashboardRole === 'manager') {
    // Manager : données de l'équipe
    // TODO: Implémenter getTeamDashboardData
    initialData.team = {
      teamId: profile.id,
      teamName: profile.department || 'Équipe',
      // TODO: Charger les données de l'équipe
      mttr: { global: 0, byProduct: [], byType: [], trend: 0 },
      flux: { opened: 0, resolved: 0, resolutionRate: 0, byProduct: [], trend: { openedTrend: 0, resolvedTrend: 0 } },
      workload: { byTeam: [], byAgent: [], totalActive: 0 },
      health: { byProduct: [], topBugModules: [] },
      alerts: [],
      period,
      periodStart: initialData.periodStart,
      periodEnd: initialData.periodEnd,
    };
  } else if (dashboardRole === 'agent') {
    // Agent : données personnelles
    // TODO: Implémenter getAgentDashboardData
    initialData.personal = {
      agentId: profile.id,
      agentName: profile.full_name || 'Agent',
      myTickets: { active: 0, resolved: 0, pending: 0 },
      myTasks: { todo: 0, inProgress: 0, done: 0, blocked: 0 },
      myActivities: { upcoming: 0, completed: 0 },
      alerts: [],
      period,
      periodStart: initialData.periodStart,
      periodEnd: initialData.periodEnd,
    };
  } else if (dashboardRole === 'admin') {
    // Admin : données stratégiques globales (comme direction) pour tester toutes les fonctionnalités
    const strategic = await getCEODashboardData(
      period,
      filters || undefined,
      customRange?.start,
      customRange?.end
    );
    initialData.strategic = strategic;
    initialData.periodStart = strategic.periodStart;
    initialData.periodEnd = strategic.periodEnd;
  }

  // === CHARTS (filtrés par période) - Direction, Manager, Admin ===
  if (dashboardRole !== 'agent' && initialData.periodStart && initialData.periodEnd) {
    const OBC_PRODUCT_ID = '91304e02-2ce6-4811-b19d-1cae091a6fde';
    
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
        initialData.periodStart,
        initialData.periodEnd
      ),
      getTicketsEvolutionStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        period // Passer la période pour adapter la granularité
      ),
      getTicketsByCompanyStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        10 // Top 10 entreprises
      ),
      getBugsByTypeStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        10 // Top 10 types de BUGs
      ),
      getCampaignsResultsStats(
        initialData.periodStart,
        initialData.periodEnd,
        10 // Top 10 campagnes
      ),
      getTicketsByModuleStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        10 // Top 10 modules
      ),
      getBugsByTypeAndModuleStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        15 // Top 15 types de BUGs (avec modules empilés)
      ),
      getAssistanceTimeByCompanyStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        10 // Top 10 entreprises
      ),
      getAssistanceTimeEvolutionStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        period // Passer la période pour adapter la granularité
      ),
      getSupportAgentsStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd
      ),
      getSupportAgentsRadarStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        6
      ),
      getCompaniesCardsStats(
        OBC_PRODUCT_ID,
        initialData.periodStart,
        initialData.periodEnd,
        10
      ),
    ]);
    
    initialData.ticketsDistributionStats = distributionStats ?? undefined;
    initialData.ticketsEvolutionStats = evolutionStats ?? undefined;
    initialData.ticketsByCompanyStats = byCompanyStats ?? undefined;
    initialData.bugsByTypeStats = bugsByTypeStats ?? undefined;
    initialData.campaignsResultsStats = campaignsStats ?? undefined;
    initialData.ticketsByModuleStats = byModuleStats ?? undefined;
    initialData.bugsByTypeAndModuleStats = bugsByTypeModuleStats ?? undefined;
    initialData.assistanceTimeByCompanyStats = assistanceTimeStats ?? undefined;
    initialData.assistanceTimeEvolutionStats = assistanceTimeEvolutionStats ?? undefined;
    initialData.supportAgentsStats = supportAgentsStats ?? undefined;
    initialData.supportAgentsRadarStats = supportAgentsRadarStats ?? undefined;
    initialData.companiesCardsStats = companiesCardsStats ?? undefined;
  }

  // Récupérer les produits pour les filtres (si Direction, Manager ou Admin)
  const products = await listProducts();

  // Déterminer le titre selon le rôle
  const headerConfigs = {
    direction: {
      label: 'Dashboard',
      title: 'Tableau de bord Direction',
      description: 'Vue stratégique des performances et indicateurs clés',
    },
    manager: {
      label: 'Dashboard',
      title: 'Tableau de bord Équipe',
      description: 'Vue des performances et indicateurs de votre équipe',
    },
    agent: {
      label: 'Dashboard',
      title: 'Mon Tableau de bord',
      description: 'Vue de vos activités et indicateurs personnels',
    },
    admin: {
      label: 'Dashboard',
      title: 'Tableau de bord Admin',
      description: 'Vue complète des performances et indicateurs (configuration admin)',
    },
  };

  const headerConfig = headerConfigs[dashboardRole] || headerConfigs.agent;

  return (
    <PageLayoutWithDashboardFilters
      sidebar={<DashboardFiltersSidebarClient products={products.map(p => ({ id: p.id, name: p.name }))} />}
      header={headerConfig}
      kpis={
        // KPIs Statiques (temps réel, non filtrés) - Section séparée AVANT les filtres
        // Visible uniquement pour Admin et Direction
        (dashboardRole === 'admin' || dashboardRole === 'direction') && initialData.bugHistoryStats ? (
          <UnifiedDashboardWithWidgets
            role={dashboardRole}
            profileId={profile.id}
            initialData={initialData}
            initialPeriod={period}
            initialWidgetConfig={widgetConfig}
            staticOnly={true}
          />
        ) : undefined
      }
      card={{
        title: 'Indicateurs de performance'
      }}
    >
      <UnifiedDashboardWithWidgets
        role={dashboardRole}
        profileId={profile.id}
        initialData={initialData}
        initialPeriod={period}
        initialWidgetConfig={widgetConfig}
        filteredOnly={true}
      />
    </PageLayoutWithDashboardFilters>
  );
}

function getCustomRangeFromParams(
  params: Record<string, string | string[] | undefined>
): { start: string; end: string } | null {
  const startParam = typeof params.startDate === 'string' ? params.startDate : undefined;
  const endParam = typeof params.endDate === 'string' ? params.endDate : undefined;
  if (!startParam || !endParam) return null;

  const start = new Date(startParam);
  const end = new Date(endParam);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start.getTime() > end.getTime()) return null;

  return { start: start.toISOString(), end: end.toISOString() };
}
