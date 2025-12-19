import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';

/**
 * Configuration par défaut des widgets affectés à chaque rôle
 * 
 * Ces valeurs sont utilisées lors de l'initialisation ou en cas d'absence de configuration en DB
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md
 */
export const DEFAULT_ROLE_WIDGETS: Record<DashboardRole, DashboardWidget[]> = {
  direction: [
    // === AGENTS (Support) ===
    'agents-support-cards',
    // === ENTREPRISES (Support) ===
    'companies-cards',
    // === KPIs STATIQUES (temps réel, non filtrés) ===
    'bug-history',
    'req-history',
    'assistance-history',
    // === KPIs FILTRÉS (à implémenter) ===
    // === CHARTS ===
    'tickets-distribution',
    'tickets-evolution',
    'tickets-by-company',
    'bugs-by-type',
    'campaigns-results',
    'tickets-by-module',
    'bugs-by-type-module',
    'assistance-time-by-company',
    'assistance-time-evolution',
    'support-agents-radar',
    // === TABLES (à implémenter) ===
    // === FULL-WIDTH (à implémenter) ===
  ],
  manager: [
    // === AGENTS (Support) ===
    'agents-support-cards',
    // === ENTREPRISES (Support) ===
    'companies-cards',
    // === KPIs FILTRÉS (à implémenter) ===
    // === CHARTS ===
    'tickets-distribution',
    'tickets-evolution',
    'tickets-by-company',
    'bugs-by-type',
    'campaigns-results',
    'tickets-by-module',
    'bugs-by-type-module',
    'assistance-time-by-company',
    'assistance-time-evolution',
    'support-agents-radar',
    // === TABLES (à implémenter) ===
    // === FULL-WIDTH (à implémenter) ===
  ],
  agent: [
    // === KPIs PERSONNELS (à implémenter) ===
    // === FULL-WIDTH (à implémenter) ===
  ],
  admin: [
    // === AGENTS (Support) ===
    'agents-support-cards',
    // === ENTREPRISES (Support) ===
    'companies-cards',
    // === KPIs STATIQUES (temps réel, non filtrés) ===
    'bug-history',
    'req-history',
    'assistance-history',
    // === KPIs FILTRÉS (à implémenter) ===
    // === CHARTS ===
    'tickets-distribution',
    'tickets-evolution',
    'tickets-by-company',
    'bugs-by-type',
    'campaigns-results',
    'tickets-by-module',
    'bugs-by-type-module',
    'assistance-time-by-company',
    'assistance-time-evolution',
    'support-agents-radar',
    // === TABLES (à implémenter) ===
    // === FULL-WIDTH (à implémenter) ===
  ],
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

