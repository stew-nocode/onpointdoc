import type { DashboardWidget, WidgetLayoutType } from '@/types/dashboard-widgets';
import type { ComponentType } from 'react';
import type { UnifiedDashboardData } from '@/types/dashboard';
import type { WidgetProps } from '@/types/dashboard-widget-props';

// === IMPORTS DES WIDGETS ===
// Agents
import { AgentsSupportCards } from '@/components/dashboard/agents/support/agents-support-cards';
// Entreprises
import { CompaniesCards } from '@/components/dashboard/companies/companies-cards';
// KPIs Statiques
import { BugHistoryCard } from '@/components/dashboard/static-kpis/bug-history-card';
import { ReqHistoryCard } from '@/components/dashboard/static-kpis/req-history-card';
import { AssistanceHistoryCard } from '@/components/dashboard/static-kpis/assistance-history-card';
// Charts - ✅ Lazy loaded pour réduire le bundle initial
import {
  TicketsDistributionChart,
  TicketsEvolutionChart,
  TicketsByCompanyChart,
  BugsByTypeChart,
  CampaignsResultsChart,
  TicketsByModuleChart,
  BugsByTypeAndModuleChart,
  AssistanceTimeByCompanyChart,
  AssistanceTimeEvolutionChart,
  SupportAgentsRadarChart,
} from './lazy-widgets';

/**
 * Définition d'un widget avec son composant et son type de layout
 * 
 * layoutType détermine automatiquement la section où le widget sera placé :
 * - 'kpi-static' → Section KPIs Statiques (non filtrés, Admin/Direction only)
 * - 'kpi' → Section KPIs Filtrés (selon période)
 * - 'chart' → Section Charts
 * - 'table' → Section Tables
 * - 'full-width' → Section Full-width (bas de page)
 */
export type WidgetDefinition = {
  component: ComponentType<any>;
  layoutType: WidgetLayoutType;
  title: string;
  description?: string;
  /** Tags pour filtrage et affectation granulaire */
  tags?: {
    products: ('OBC' | 'SNI' | 'CREDIT_FACTORY' | 'ALL')[];
    departments: ('SUPPORT' | 'MARKETING' | 'IT' | 'ALL')[];
    roles: ('direction' | 'manager' | 'agent' | 'admin' | 'ALL')[];
  };
};

/**
 * Mapping des données aux widgets
 * 
 * Retourne un objet avec les props à passer au composant widget.
 */
type WidgetDataMapper = (data: UnifiedDashboardData) => WidgetProps;

/**
 * Registry centralisé de tous les widgets disponibles
 * 
 * Pour ajouter un nouveau widget :
 * 1. Créer le composant du widget (suivre les best practices de la doc)
 * 2. L'importer ici
 * 3. L'ajouter dans WIDGET_REGISTRY avec layoutType approprié
 * 4. Ajouter l'ID dans le type DashboardWidget (dashboard-widgets.ts)
 * 5. Ajouter le mapper dans WIDGET_DATA_MAPPERS
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md
 */
export const WIDGET_REGISTRY: Record<DashboardWidget, WidgetDefinition> = {
  // === SECTION : AGENTS ===
  'agents-support-cards': {
    component: AgentsSupportCards,
    layoutType: 'agents',
    title: 'Agents Support',
    description: 'Cartes par agent (photo + résumé activité sur la période)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },

  // === SECTION : ENTREPRISES ===
  'companies-cards': {
    component: CompaniesCards,
    layoutType: 'companies',
    title: 'Entreprises',
    description: 'Cartes par entreprise (résumé activité sur la période)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },

  // === SECTION : KPIs STATIQUES ===
  'bug-history': {
    component: BugHistoryCard,
    layoutType: 'kpi-static',
    title: 'Historique BUG',
    description: 'Vue historique complète des tickets BUG (temps réel)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT', 'IT'],
      roles: ['admin', 'direction'],  // Visible uniquement Admin & Direction
    },
  },
  'req-history': {
    component: ReqHistoryCard,
    layoutType: 'kpi-static',
    title: 'Historique REQ',
    description: 'Vue historique complète des tickets REQ (temps réel)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT', 'IT'],
      roles: ['admin', 'direction'],  // Visible uniquement Admin & Direction
    },
  },
  'assistance-history': {
    component: AssistanceHistoryCard,
    layoutType: 'kpi-static',
    title: 'Historique ASSISTANCE',
    description: 'Vue historique complète des tickets ASSISTANCE (temps réel)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT'],
      roles: ['admin', 'direction'],  // Visible uniquement Admin & Direction
    },
  },

  // === SECTION : CHARTS ===
  'tickets-distribution': {
    component: TicketsDistributionChart,
    layoutType: 'chart',
    title: 'Distribution par Type',
    description: 'Répartition des tickets BUG/REQ/Assistance (filtré par période)',
    tags: {
      products: ['ALL'],
      departments: ['ALL'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'tickets-evolution': {
    component: TicketsEvolutionChart,
    layoutType: 'chart',
    title: 'Évolution des tickets',
    description: 'Tendance des tickets créés (filtré par période)',
    tags: {
      products: ['ALL'],
      departments: ['ALL'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'tickets-by-company': {
    component: TicketsByCompanyChart,
    layoutType: 'chart',
    title: 'Top entreprises',
    description: 'Répartition des tickets par entreprise (filtré par période)',
    tags: {
      products: ['ALL'],
      departments: ['ALL'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'bugs-by-type': {
    component: BugsByTypeChart,
    layoutType: 'chart',
    title: 'BUGs par Type',
    description: 'Répartition des BUGs par type de dysfonctionnement (filtré par période)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT', 'IT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'campaigns-results': {
    component: CampaignsResultsChart,
    layoutType: 'chart',
    title: 'Campagnes Emails',
    description: 'Résultats des campagnes emails : Envoyés | Ouverts | Cliqués (filtré par période)',
    tags: {
      products: ['ALL'],
      departments: ['MARKETING'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'tickets-by-module': {
    component: TicketsByModuleChart,
    layoutType: 'chart',
    title: 'Tickets par Module',
    description: 'Répartition des tickets par module : BUG | REQ | ASSISTANCE (filtré par période)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT', 'IT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'bugs-by-type-module': {
    component: BugsByTypeAndModuleChart,
    layoutType: 'chart',
    title: 'BUGs par Type et Module',
    description: 'Répartition des types de BUG par module (barres empilées)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT', 'IT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'assistance-time-by-company': {
    component: AssistanceTimeByCompanyChart,
    layoutType: 'chart',
    title: 'Temps d\'assistance par entreprise',
    description: 'Répartition du temps d\'assistance par entreprise (en heures)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'assistance-time-evolution': {
    component: AssistanceTimeEvolutionChart,
    layoutType: 'chart',
    title: 'Évolution du temps d\'assistance',
    description: 'Tendance du temps d\'assistance avec granularité adaptative',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
  'support-agents-radar': {
    component: SupportAgentsRadarChart,
    layoutType: 'chart',
    title: 'Radar Agents Support',
    description: 'Comparaison des agents Support (tickets créés & assistances)',
    tags: {
      products: ['ALL'],
      departments: ['SUPPORT'],
      roles: ['admin', 'direction', 'manager'],
    },
  },
};

/**
 * Mappe les données du dashboard aux props nécessaires pour chaque widget
 */
export const WIDGET_DATA_MAPPERS: Record<DashboardWidget, WidgetDataMapper> = {
  // === SECTION : AGENTS ===
  'agents-support-cards': (data) => ({
    data: data.supportAgentsStats || null,
  }),
  // === SECTION : ENTREPRISES ===
  'companies-cards': (data) => ({
    data: data.companiesCardsStats || null,
  }),

  // === SECTION : KPIs STATIQUES ===
  'bug-history': (data) => ({
    data: data.bugHistoryStats || null,
  }),
  'req-history': (data) => ({
    data: data.reqHistoryStats || null,
  }),
  'assistance-history': (data) => ({
    data: data.assistanceHistoryStats || null,
  }),

  // === SECTION : CHARTS ===
  'tickets-distribution': (data) => ({
    data: data.ticketsDistributionStats || null,
  }),
  'tickets-evolution': (data) => ({
    data: data.ticketsEvolutionStats || null,
  }),
  'tickets-by-company': (data) => ({
    data: data.ticketsByCompanyStats || null,
  }),
  'bugs-by-type': (data) => ({
    data: data.bugsByTypeStats || null,
  }),
  'campaigns-results': (data) => ({
    data: data.campaignsResultsStats || null,
  }),
  'tickets-by-module': (data) => ({
    data: data.ticketsByModuleStats || null,
  }),
  'bugs-by-type-module': (data) => ({
    data: data.bugsByTypeAndModuleStats || null,
  }),
  'assistance-time-by-company': (data) => ({
    data: data.assistanceTimeByCompanyStats || null,
  }),
  'assistance-time-evolution': (data) => ({
    data: data.assistanceTimeEvolutionStats || null,
  }),
  'support-agents-radar': (data) => ({
    data: data.supportAgentsRadarStats || null,
  }),
};

/**
 * Obtient la définition d'un widget
 * 
 * @param widgetId - Identifiant du widget
 * @returns Définition du widget ou null si introuvable
 */
export function getWidgetDefinition(widgetId: DashboardWidget): WidgetDefinition | null {
  return WIDGET_REGISTRY[widgetId] || null;
}

/**
 * Obtient les props nécessaires pour un widget à partir des données du dashboard
 * 
 * @param widgetId - Identifiant du widget
 * @param dashboardData - Données complètes du dashboard
 * @returns Props à passer au composant du widget
 */
export function getWidgetProps(
  widgetId: DashboardWidget,
  dashboardData: UnifiedDashboardData
): WidgetProps {
  const mapper = WIDGET_DATA_MAPPERS[widgetId];
  if (!mapper) return { alerts: [] };
  return mapper(dashboardData);
}
