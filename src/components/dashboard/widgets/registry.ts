import type { DashboardWidget, WidgetLayoutType } from '@/types/dashboard-widgets';
import type { ComponentType } from 'react';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { MTTRKPICard } from '../ceo/mttr-kpi-card';
import { FluxKPICard } from '../ceo/flux-kpi-card';
import { WorkloadKPICard } from '../ceo/workload-kpi-card';
import { HealthKPICard } from '../ceo/health-kpi-card';
import { MTTREvolutionChart } from '../ceo/mttr-evolution-chart';
import { TicketsDistributionChart } from '../ceo/tickets-distribution-chart';
import { TopBugsModulesTable } from '../ceo/top-bugs-modules-table';
import { WorkloadByAgentTable } from '../ceo/workload-by-agent-table';
import { OperationalAlertsSection } from '../ceo/operational-alerts-section';

/**
 * Définition d'un widget avec son composant et son type de layout
 */
export type WidgetDefinition = {
  component: ComponentType<any>;
  layoutType: WidgetLayoutType;
  title: string;
  description?: string;
};

/**
 * Mapping des données aux widgets
 */
type WidgetDataMapper = (data: UnifiedDashboardData) => any;

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
  flux: {
    component: FluxKPICard,
    layoutType: 'kpi',
    title: 'Flux des tickets',
    description: 'Tickets ouverts et résolus sur la période',
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
 * Mappe les données du dashboard aux props nécessaires pour chaque widget
 */
export const WIDGET_DATA_MAPPERS: Record<DashboardWidget, WidgetDataMapper> = {
  mttr: (data) => {
    if (data.strategic) return { data: data.strategic.mttr };
    if (data.team) return { data: data.team.mttr };
    return { data: null };
  },
  flux: (data) => {
    if (data.strategic) return { data: data.strategic.flux };
    if (data.team) return { data: data.team.flux };
    return { data: null };
  },
  workload: (data) => {
    if (data.strategic) return { data: data.strategic.workload };
    if (data.team) return { data: data.team.workload };
    return { data: null };
  },
  health: (data) => {
    if (data.strategic) return { data: data.strategic.health };
    if (data.team) return { data: data.team.health };
    return { data: null };
  },
  alerts: (data) => ({ alerts: data.alerts }),
  mttrEvolution: (data) => {
    if (data.strategic) return { data: data.strategic.mttr };
    if (data.team) return { data: data.team.mttr };
    return { data: null };
  },
  ticketsDistribution: (data) => {
    if (data.strategic) return { data: data.strategic.flux };
    if (data.team) return { data: data.team.flux };
    return { data: null };
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
export function getWidgetProps(widgetId: DashboardWidget, dashboardData: UnifiedDashboardData): any {
  const mapper = WIDGET_DATA_MAPPERS[widgetId];
  if (!mapper) return {};
  return mapper(dashboardData);
}

