import { unstable_noStore as noStore } from 'next/cache';
import { PageLayoutWithDashboardFilters } from '@/components/layout/page';
import { UnifiedDashboardWithWidgets } from '@/components/dashboard/unified-dashboard-with-widgets';
import { getCachedUserDashboardConfig } from '@/services/dashboard/widgets';
import { DashboardFiltersSidebarClient } from '@/components/dashboard/ceo/filters/dashboard-filters-sidebar-client';
import { listProducts } from '@/services/products';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';
import { getCurrentUserProfile } from '@/services/users/server';
import { mapProfileRoleToDashboardRole } from '@/lib/utils/dashboard-config';
import type { UnifiedDashboardData } from '@/types/dashboard';
import type { DashboardRole } from '@/types/dashboard-widgets';

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Page du dashboard unifié
 * 
 * Affiche les KPIs selon le rôle de l'utilisateur :
 * - Direction : KPIs stratégiques globaux
 * - Manager : KPIs de l'équipe
 * - Agent : KPIs personnels
 * 
 * Avec rafraîchissement temps réel
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  noStore();

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
  const period = filters?.period || 'month';

  // Charger la configuration des widgets (affectation par rôle + préférences utilisateur)
  // ✅ OPTIMISÉ : Utilise React.cache() pour éviter les appels répétés
  const widgetConfig = await getCachedUserDashboardConfig(profile.id, dashboardRole);

  // Charger les données selon le rôle (directement via les services)
  const { getCEODashboardData } = await import('@/services/dashboard/ceo-kpis');
  const { getOperationalAlerts } = await import('@/services/dashboard/operational-alerts');
  const alerts = await getOperationalAlerts();

  let initialData: UnifiedDashboardData = {
    role: dashboardRole,
    alerts,
    period,
    periodStart: new Date().toISOString(), // TODO: calculer selon période
    periodEnd: new Date().toISOString(),
  };

  if (dashboardRole === 'direction') {
    // Direction : données stratégiques globales
    const strategic = await getCEODashboardData(period, filters || undefined);
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
    const strategic = await getCEODashboardData(period, filters || undefined);
    initialData.strategic = strategic;
    initialData.periodStart = strategic.periodStart;
    initialData.periodEnd = strategic.periodEnd;
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
      />
    </PageLayoutWithDashboardFilters>
  );
}
