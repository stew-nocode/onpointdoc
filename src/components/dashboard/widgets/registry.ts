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
    if (data.strategic) return { data: data.strategic.mttr };
    if (data.team) return { data: data.team.mttr };
    return { data: DEFAULT_MTTR_DATA };
  },
  'tickets-ouverts': (data) => {
    if (data.strategic) return { data: data.strategic.flux };
    if (data.team) return { data: data.team.flux };
    return { data: DEFAULT_FLUX_DATA };
  },
  'tickets-resolus': (data) => {
    if (data.strategic) return { data: data.strategic.flux };
    if (data.team) return { data: data.team.flux };
    return { data: DEFAULT_FLUX_DATA };
  },
  workload: (data) => {
    if (data.strategic) return { data: data.strategic.workload };
    if (data.team) return { data: data.team.workload };
    return { data: DEFAULT_WORKLOAD_DATA };
  },
  health: (data) => {
    if (data.strategic) return { data: data.strategic.health };
    if (data.team) return { data: data.team.health };
    return { data: DEFAULT_HEALTH_DATA };
  },
  alerts: (data) => ({ alerts: data.alerts || [] }),
  mttrEvolution: (data) => {
    if (data.strategic) return { data: data.strategic.mttr };
    if (data.team) return { data: data.team.mttr };
    return { data: DEFAULT_MTTR_DATA };
  },
  ticketsDistribution: (data) => {
    if (data.strategic) return { data: data.strategic.flux };
    if (data.team) return { data: data.team.flux };
    return { data: DEFAULT_FLUX_DATA };
  },
  topBugsModules: (data) => {
    if (data.strategic) return { data: data.strategic.health.topBugModules };
    if (data.team) return { data: data.team.health.topBugModules };
    return { data: [] };
  },
  workloadByAgent: (data) => {
    if (data.strategic) return { data: data.strategic.workload.byAgent };
    if (data.team) return { data: data.team.workload.byAgent };
    return { data: [] };
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

