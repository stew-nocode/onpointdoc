'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { DashboardWidget, WidgetLayoutType } from '@/types/dashboard-widgets';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { WIDGET_REGISTRY, getWidgetProps } from './registry';

type DashboardWidgetGridProps = {
  widgets: DashboardWidget[];
  dashboardData: UnifiedDashboardData;
};

/**
 * Composant de grille responsive pour afficher les widgets
 * 
 * Layout automatique selon le type :
 * - kpi: 1 colonne (petit)
 * - chart/table: 2 colonnes (moyen)
 * - full-width: pleine largeur
 * 
 * @param widgets - Liste des widgets à afficher
 * @param dashboardData - Données complètes du dashboard
 */
export function DashboardWidgetGrid({
  widgets,
  dashboardData,
}: DashboardWidgetGridProps) {
  const widgetElements = useMemo(() => {
    return widgets.map((widgetId) => {
      const widgetDef = WIDGET_REGISTRY[widgetId];
      if (!widgetDef) return null;

      const WidgetComponent = widgetDef.component;
      const props = getWidgetProps(widgetId, dashboardData);

      // Déterminer les classes de colonnes selon le type de layout
      const colSpanClasses = getColSpanClasses(widgetDef.layoutType);

      return (
        <div key={widgetId} className={cn('w-full', colSpanClasses)}>
          <WidgetComponent {...props} />
        </div>
      );
    }).filter(Boolean);
  }, [widgets, dashboardData]);

  if (widgetElements.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Aucun widget configuré pour votre rôle
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {widgetElements}
    </div>
  );
}

/**
 * Retourne les classes CSS pour le span de colonnes selon le type de layout
 * 
 * @param layoutType - Type de layout du widget
 * @returns Classes Tailwind pour les colonnes
 */
function getColSpanClasses(layoutType: WidgetLayoutType): string {
  switch (layoutType) {
    case 'kpi':
      // KPIs : 1 colonne (lg:col-span-1 par défaut, xl:col-span-1)
      return '';
    case 'chart':
    case 'table':
      // Graphiques et tables : 2 colonnes (lg:col-span-2, xl:col-span-2)
      return 'lg:col-span-2 xl:col-span-2';
    case 'full-width':
      // Pleine largeur : toutes les colonnes (lg:col-span-2, xl:col-span-3)
      return 'lg:col-span-2 xl:col-span-3';
    default:
      return '';
  }
}

