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
  // === AGENTS ===
  'agents-support-cards': 'Agents Support',

  // === ENTREPRISES ===
  'companies-cards': 'Entreprises',

  // === KPIs STATIQUES ===
  'bug-history': 'Historique BUGs',
  'req-history': 'Historique REQs',
  'assistance-history': 'Historique Assistance',

  // === CHARTS ===
  'tickets-distribution': 'Distribution tickets',
  'tickets-evolution': 'Évolution tickets',
  'tickets-by-company': 'Tickets par entreprise',
  'bugs-by-type': 'BUGs par type',
  'campaigns-results': 'Résultats campagnes',
  'tickets-by-module': 'Tickets par module',
  'bugs-by-type-module': 'BUGs par type/module',
  'assistance-time-by-company': 'Temps assistance par entreprise',
  'assistance-time-evolution': 'Évolution temps assistance',
  'support-agents-radar': 'Radar agents support',
};

