import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';

/**
 * Configuration par défaut des widgets affectés à chaque rôle
 * 
 * Ces valeurs sont utilisées lors de l'initialisation ou en cas d'absence de configuration en DB
 */
export const DEFAULT_ROLE_WIDGETS: Record<DashboardRole, DashboardWidget[]> = {
  direction: [
    'mttr',
    'tickets-ouverts',
    'tickets-resolus',
    'workload',
    'health',
    'mttrEvolution',
    'ticketsDistribution',
    'topBugsModules',
    'workloadByAgent',
    'alerts',
  ],
  manager: [
    'mttr',
    'tickets-ouverts',
    'tickets-resolus',
    'workload',
    'mttrEvolution',
    'ticketsDistribution',
    'supportEvolutionChart',
    'workloadByAgent',
    'alerts',
  ],
  agent: ['alerts'], // Agents voient uniquement les alertes par défaut
  admin: [
    'mttr',
    'tickets-ouverts',
    'tickets-resolus',
    'workload',
    'health',
    'mttrEvolution',
    'ticketsDistribution',
    'supportEvolutionChart',
    'topBugsModules',
    'workloadByAgent',
    'alerts',
  ], // Admin voit tout
};

/**
 * Initialise les widgets par défaut pour tous les rôles
 * 
 * @param adminProfileId - ID du profil admin qui effectue l'initialisation
 */
export async function initializeDefaultWidgets(adminProfileId: string): Promise<void> {
  const { updateRoleWidgets } = await import('./role-widgets');

  // Initialiser les widgets pour chaque rôle
  for (const [role, widgets] of Object.entries(DEFAULT_ROLE_WIDGETS)) {
    await updateRoleWidgets(role as DashboardRole, widgets, adminProfileId);
  }
}

