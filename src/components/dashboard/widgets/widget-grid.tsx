'use client';

import { useMemo } from 'react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import type { DashboardWidget, WidgetLayoutType } from '@/types/dashboard-widgets';
import type { UnifiedDashboardData } from '@/types/dashboard';
import { WIDGET_REGISTRY, getWidgetProps } from './registry';

type DashboardWidgetGridProps = {
  widgets: DashboardWidget[];
  dashboardData: UnifiedDashboardData;
};

/**
 * Groupe de widgets par type de layout
 */
type WidgetGroup = {
  layoutType: WidgetLayoutType;
  widgets: Array<{
    id: DashboardWidget;
    component: ComponentType<any>;
    props: any;
  }>;
};

/**
 * Composant de grille responsive pour afficher les widgets
 * 
 * Organisation par type de layout pour optimiser l'utilisation de l'espace :
 * - KPIs : Grid 4 colonnes (1 KPI = 1 colonne)
 * - Charts : Grid 2 colonnes (1 Chart = 2 colonnes)
 * - Tables : Grid 2 colonnes (1 Table = 2 colonnes)
 * - Full-width : Pleine largeur
 * 
 * Responsive :
 * - Mobile (< 640px) : 1 colonne pour tout
 * - Tablette (640px - 1024px) : 2 colonnes pour KPIs, 1 colonne pour charts/tables
 * - Desktop (1024px - 1280px) : 3 colonnes pour KPIs, 2 colonnes pour charts/tables
 * - Large Desktop (> 1280px) : 4 colonnes pour KPIs, 2 colonnes pour charts/tables
 * 
 * @param widgets - Liste des widgets à afficher
 * @param dashboardData - Données complètes du dashboard
 */
export function DashboardWidgetGrid({
  widgets,
  dashboardData,
}: DashboardWidgetGridProps) {
  // Grouper les widgets par type de layout
  const groupedWidgets = useMemo(() => {
    const groups: Record<WidgetLayoutType, WidgetGroup['widgets']> = {
      kpi: [],
      chart: [],
      table: [],
      'full-width': [],
    };

    widgets.forEach((widgetId) => {
      const widgetDef = WIDGET_REGISTRY[widgetId];
      if (!widgetDef) return;

      const props = getWidgetProps(widgetId, dashboardData);
      groups[widgetDef.layoutType].push({
        id: widgetId,
        component: widgetDef.component,
        props,
      });
    });

    return groups;
  }, [widgets, dashboardData]);

  // Vérifier s'il y a des widgets
  const totalWidgets = Object.values(groupedWidgets).reduce(
    (sum, group) => sum + group.length,
    0
  );

  if (totalWidgets === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Aucun widget configuré pour votre rôle
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section KPIs */}
      {groupedWidgets.kpi.length > 0 && (
        <div className="space-y-4">
          <KPIsSection widgets={groupedWidgets.kpi} />
        </div>
      )}

      {/* Section Charts */}
      {groupedWidgets.chart.length > 0 && (
        <div className="space-y-4">
          <ChartsSection widgets={groupedWidgets.chart} />
        </div>
      )}

      {/* Section Tables */}
      {groupedWidgets.table.length > 0 && (
        <div className="space-y-4">
          <TablesSection widgets={groupedWidgets.table} />
        </div>
      )}

      {/* Section Full-width */}
      {groupedWidgets['full-width'].length > 0 && (
        <div className="space-y-4">
          <FullWidthSection widgets={groupedWidgets['full-width']} />
        </div>
      )}
    </div>
  );
}

/**
 * Section pour les widgets KPI
 * Grid responsive : 1 colonne mobile, 2 tablette, 3 desktop, 4 large desktop
 */
function KPIsSection({ widgets }: { widgets: WidgetGroup['widgets'] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {widgets.map(({ id, component: WidgetComponent, props }) => (
        <div key={id} className="w-full">
          <WidgetComponent {...props} />
        </div>
      ))}
    </div>
  );
}

/**
 * Section pour les widgets Chart
 * Grid responsive : 1 colonne mobile, 1 colonne tablette, 2 colonnes desktop
 * Chaque chart prend 2 colonnes sur desktop
 */
function ChartsSection({ widgets }: { widgets: WidgetGroup['widgets'] }) {
  if (widgets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {widgets.map(({ id, component: WidgetComponent, props }) => (
        <div key={id} className="w-full lg:col-span-1">
          <WidgetComponent {...props} />
        </div>
      ))}
    </div>
  );
}

/**
 * Section pour les widgets Table
 * Grid responsive : 1 colonne mobile, 1 colonne tablette, 2 colonnes desktop
 * Chaque table prend 2 colonnes sur desktop
 */
function TablesSection({ widgets }: { widgets: WidgetGroup['widgets'] }) {
  if (widgets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {widgets.map(({ id, component: WidgetComponent, props }) => (
        <div key={id} className="w-full lg:col-span-1">
          <WidgetComponent {...props} />
        </div>
      ))}
    </div>
  );
}

/**
 * Section pour les widgets Full-width
 * Pleine largeur sur tous les écrans
 */
function FullWidthSection({ widgets }: { widgets: WidgetGroup['widgets'] }) {
  if (widgets.length === 0) return null;

  return (
    <div className="space-y-4">
      {widgets.map(({ id, component: WidgetComponent, props }) => (
        <div key={id} className="w-full">
          <WidgetComponent {...props} />
        </div>
      ))}
    </div>
  );
}

