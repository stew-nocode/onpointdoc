import type { DashboardWidget, WidgetLayoutType } from '@/types/dashboard-widgets';
import type { ComponentType } from 'react';
import type { UnifiedDashboardData } from '@/types/dashboard';
import type { WidgetProps } from '@/types/dashboard-widget-props';
import { MTTRKPICard } from '../ceo/mttr-kpi-card';
import { TicketsOuvertsKPICard } from '../ceo/tickets-ouverts-kpi-card';
import { TicketsResolusKPICard } from '../ceo/tickets-resolus-kpi-card';
import { WorkloadKPICard } from '../ceo/workload-kpi-card';
import { HealthKPICard } from '../ceo/health-kpi-card';
import { MTTREvolutionChart } from '../ceo/mttr-evolution-chart';
import { TicketsDistributionChart } from '../ceo/tickets-distribution-chart';
import { TopBugsModulesTable } from '../ceo/top-bugs-modules-table';
import { WorkloadByAgentTable } from '../ceo/workload-by-agent-table';
import { OperationalAlertsSection } from '../ceo/operational-alerts-section';
import { SupportEvolutionChartServerV2 } from '../manager/support-evolution-chart-server-v2';
import { TicketsByTypePieChartServer } from '../manager/tickets-by-type-pie-chart-server';
import { TicketsByCompanyPieChartServer } from '../manager/tickets-by-company-pie-chart-server';

/**
 * Définition d'un widget avec son composant et son type de layout
 * 
 * Utilise ComponentType<any> car chaque widget a ses propres props spécifiques.
 * La sécurité de type est assurée par les types spécifiques de chaque composant widget.
 */
export type WidgetDefinition = {
  component: ComponentType<any>;
  layoutType: WidgetLayoutType;
  title: string;
  description?: string;
};

/**
 * Mapping des données aux widgets
 * 
 * Retourne un objet avec les props à passer au composant widget.
 * Chaque mapper garantit le type correct via les types spécifiques des props.
 */
type WidgetDataMapper = (data: UnifiedDashboardData) => WidgetProps;

/**
 * Registry centralisé de tous les widgets disponibles
 * 
 * Pour ajouter un nouveau widget :
 * 1. Créer le composant du widget
 * 2. L'importer ici
 * 3. L'ajouter dans WIDGET_REGISTRY
 * 4. Ajouter l'ID dans le type DashboardWidget
 */
export const WIDGET_REGISTRY: Record<DashboardWidget, WidgetDefinition> = {
  mttr: {
    component: MTTRKPICard,
    layoutType: 'kpi',
    title: 'Temps moyen de résolution (MTTR)',
    description: 'Temps moyen nécessaire pour résoudre un ticket',
  },
  'tickets-ouverts': {
    component: TicketsOuvertsKPICard,
    layoutType: 'kpi',
    title: 'Tickets Ouverts',
    description: 'Nombre de tickets créés sur la période',
  },
  'tickets-resolus': {
    component: TicketsResolusKPICard,
    layoutType: 'kpi',
    title: 'Tickets Résolus',
    description: 'Nombre de tickets résolus sur la période avec taux de résolution',
  },
  workload: {
    component: WorkloadKPICard,
    layoutType: 'kpi',
    title: 'Charge de travail',
    description: 'Répartition de la charge par équipe et agent',
  },
  health: {
    component: HealthKPICard,
    layoutType: 'kpi',
    title: 'Santé des produits',
    description: 'Taux de bugs et modules les plus affectés',
  },
  alerts: {
    component: OperationalAlertsSection,
    layoutType: 'full-width',
    title: 'Alertes opérationnelles',
    description: 'Alertes critiques nécessitant une attention immédiate',
  },
  mttrEvolution: {
    component: MTTREvolutionChart,
    layoutType: 'chart',
    title: 'Évolution MTTR',
    description: 'Tendance du temps moyen de résolution dans le temps',
  },
  ticketsDistribution: {
    component: TicketsDistributionChart,
    layoutType: 'chart',
    title: 'Distribution des tickets',
    description: 'Répartition des tickets par type (BUG/REQ/ASSISTANCE)',
  },
  topBugsModules: {
    component: TopBugsModulesTable,
    layoutType: 'table',
    title: 'Top modules avec bugs',
    description: 'Modules les plus affectés par des bugs avec taux et tendance',
  },
  workloadByAgent: {
    component: WorkloadByAgentTable,
    layoutType: 'table',
    title: 'Charge par agent',
    description: 'Détails de la charge de travail par agent',
  },
  supportEvolutionChart: {
    component: SupportEvolutionChartServerV2,
    layoutType: 'chart',
    title: 'Évolution Performance Support',
    description: 'Tendances globales par dimension (BUG, REQ, ASSISTANCE, Temps d\'assistance) avec filtres personnalisables',
  },
  ticketsByTypePieChart: {
    component: TicketsByTypePieChartServer,
    layoutType: 'chart',
    title: 'Répartition par Type',
    description: 'Répartition des tickets créés par type (BUG, REQ, ASSISTANCE) avec filtre par agent Support',
  },
  ticketsByCompanyPieChart: {
    component: TicketsByCompanyPieChartServer,
    layoutType: 'chart',
    title: 'Répartition par Entreprise',
    description: 'Répartition des tickets créés par entreprise avec filtre par type de ticket (BUG, REQ, ASSISTANCE)',
  },
};

/**
 * Données par défaut pour éviter les erreurs quand les données sont manquantes
 */
const DEFAULT_MTTR_DATA = {
  global: 0,
  byProduct: [],
  byType: [],
  trend: 0,
};

const DEFAULT_FLUX_DATA = {
  opened: 0,
  resolved: 0,
  resolutionRate: 0,
  byProduct: [],
  trend: {
    openedTrend: 0,
    resolvedTrend: 0,
  },
};

const DEFAULT_WORKLOAD_DATA = {
  byTeam: [],
  byAgent: [],
  totalActive: 0,
};

const DEFAULT_HEALTH_DATA = {
  byProduct: [],
  topBugModules: [],
};

/**
 * Mappe les données du dashboard aux props nécessaires pour chaque widget
 * Retourne des données par défaut si les données sont manquantes pour éviter les erreurs
 */
export const WIDGET_DATA_MAPPERS: Record<DashboardWidget, WidgetDataMapper> = {
  mttr: (data) => {
    const mttrData = data.strategic?.mttr || data.team?.mttr || DEFAULT_MTTR_DATA;
    return { 
      data: mttrData,
      period: data.period, // Période globale pour cohérence
    };
  },
  'tickets-ouverts': (data) => {
    const fluxData = data.strategic?.flux || data.team?.flux || DEFAULT_FLUX_DATA;
    return { 
      data: fluxData,
      period: data.period, // Période globale pour cohérence
    };
  },
  'tickets-resolus': (data) => {
    const fluxData = data.strategic?.flux || data.team?.flux || DEFAULT_FLUX_DATA;
    return { 
      data: fluxData,
      period: data.period, // Période globale pour cohérence
    };
  },
  workload: (data) => {
    const workloadData = data.strategic?.workload || data.team?.workload || DEFAULT_WORKLOAD_DATA;
    return { 
      data: workloadData,
      period: data.period, // Période globale pour cohérence
    };
  },
  health: (data) => {
    const healthData = data.strategic?.health || data.team?.health || DEFAULT_HEALTH_DATA;
    return { 
      data: healthData,
      period: data.period, // Période globale pour cohérence
    };
  },
  alerts: (data) => ({ 
    alerts: data.alerts || [],
    period: data.period, // Période globale pour cohérence
  }),
  mttrEvolution: (data) => {
    const mttrData = data.strategic?.mttr || data.team?.mttr || DEFAULT_MTTR_DATA;
    return { 
      data: mttrData,
      period: data.period, // Ajouter la période pour que le widget soit conscient du filtre global
    };
  },
  ticketsDistribution: (data) => {
    const fluxData = data.strategic?.flux || data.team?.flux || DEFAULT_FLUX_DATA;
    return { 
      data: fluxData,
      period: data.period, // Ajouter la période pour que le widget soit conscient du filtre global
    };
  },
  topBugsModules: (data) => {
    const modulesData = data.strategic?.health.topBugModules || data.team?.health.topBugModules || [];
    return { 
      data: modulesData,
      period: data.period, // Période globale pour cohérence
    };
  },
  workloadByAgent: (data) => {
    const agentsData = data.strategic?.workload.byAgent || data.team?.workload.byAgent || [];
    return { 
      data: agentsData,
      period: data.period, // Période globale pour cohérence
    };
  },
  supportEvolutionChart: (data) => {
    // Le widget Support Evolution charge ses propres données via API route
    // On passe la période globale et les dates personnalisées si disponibles
    return {
      period: data.period,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    };
  },
  ticketsByTypePieChart: (data) => {
    // Le widget Répartition par Type charge ses propres données via Server Action
    // On passe la période globale et les dates personnalisées si disponibles
    return {
      period: data.period,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    };
  },
  ticketsByCompanyPieChart: (data) => {
    // Le widget Répartition par Entreprise charge ses propres données via Server Action
    // On passe la période globale et les dates personnalisées si disponibles
    return {
      period: data.period,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    };
  },
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

