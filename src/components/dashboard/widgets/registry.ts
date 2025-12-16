import type { DashboardWidget, WidgetLayoutType } from '@/types/dashboard-widgets';
import type { ComponentType } from 'react';
import type { UnifiedDashboardData } from '@/types/dashboard';
import type { WidgetProps } from '@/types/dashboard-widget-props';

// === IMPORTS DES WIDGETS ===
import { BugHistoryCard } from '@/components/dashboard/static-kpis/bug-history-card';

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
};

/**
 * Mappe les données du dashboard aux props nécessaires pour chaque widget
 */
export const WIDGET_DATA_MAPPERS: Record<DashboardWidget, WidgetDataMapper> = {
  // === SECTION : KPIs STATIQUES ===
  'bug-history': (data) => ({
    data: data.bugHistoryStats || null,
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
