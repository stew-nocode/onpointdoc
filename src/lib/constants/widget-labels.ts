import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';

/**
 * Labels des rôles pour l'affichage (centralisé)
 */
export const ROLE_LABELS: Record<DashboardRole, string> = {
  direction: 'Direction',
  manager: 'Manager',
  agent: 'Agent',
  admin: 'Admin',
};

/**
 * Labels des widgets pour l'affichage (centralisé)
 */
export const WIDGET_LABELS: Record<DashboardWidget, string> = {
  mttr: 'MTTR (Temps moyen de résolution)',
  'tickets-ouverts': 'Tickets Ouverts',
  'tickets-resolus': 'Tickets Résolus',
  workload: 'Charge de travail',
  health: 'Santé des produits',
  alerts: 'Alertes opérationnelles',
  mttrEvolution: 'Évolution MTTR',
  ticketsDistribution: 'Distribution des tickets',
  topBugsModules: 'Top modules avec bugs',
  workloadByAgent: 'Charge par agent',
};

