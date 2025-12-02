'use client';

import { useMemo, memo } from 'react';
import type { ComponentType } from 'react';
import type { DashboardWidget, WidgetLayoutType } from '@/types/dashboard-widgets';
import type { UnifiedDashboardData } from '@/types/dashboard';
import type { WidgetProps } from '@/types/dashboard-widget-props';
import { WIDGET_REGISTRY, getWidgetProps } from './registry';
import { areWidgetPropsEqual } from './utils/widget-props-comparison';

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
    props: WidgetProps;
  }>;
};

/**
 * Composant de grille responsive pour afficher les widgets
 * 
 * Organisation par type de layout avec Flexbox pour optimiser l'utilisation de l'espace :
 * - KPIs : Flexbox avec largeur minimale 280px (peut en avoir plusieurs par ligne)
 * - Charts : Flexbox avec largeur minimale 400px (maximum 3 par ligne sur desktop standard)
 * - Tables : Flexbox avec largeur minimale 400px (maximum 3 par ligne sur desktop standard)
 * - Full-width : Pleine largeur
 * 
 * Tous les widgets ont des hauteurs fixes pour une présentation uniforme :
 * - KPIs : 120px (hauteur fixe)
 * - Charts : 420px (hauteur fixe)
 * - Tables : 420px (hauteur fixe)
 * 
 * Responsive :
 * - Mobile (< 640px) : 1 colonne pour tout (flex-basis: 100%)
 * - Desktop (>= 640px) : Flexbox avec wrap automatique selon largeur minimale
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
 * Comparaison optimisée pour React.memo
 * 
 * Détecte les changements de :
 * - component : comparaison par référence
 * - period (string) : comparaison par valeur
 * - autres props : comparaison par référence
 * 
 * La logique est extraite dans `widget-props-comparison.ts` pour respecter Clean Code.
 */

const MemoizedWidget = memo(
  ({ component: WidgetComponent, props }: {
    component: ComponentType<WidgetProps>;
    props: WidgetProps;
  }) => {
    // Debug: Logger les changements de props pour les graphiques
    if (process.env.NODE_ENV === 'development' && 'period' in props) {
      console.log('[MemoizedWidget] Rendering widget with period:', props.period);
    }
    
    return (
      <div className="w-full h-full">
        <WidgetComponent {...props} />
      </div>
    );
  },
  areWidgetPropsEqual // Comparaison personnalisée optimisée
);
MemoizedWidget.displayName = 'MemoizedWidget';

/**
 * Section pour les widgets KPI
 * 
 * Utilise Flexbox pour :
 * - Occuper toute la largeur disponible
 * - Largeur minimale de 280px par KPI
 * - Retour automatique à la ligne selon l'espace disponible
 * - Répartition égale de l'espace par ligne
 * - Adaptation automatique si des cartes sont désactivées
 * - 1 colonne sur mobile (< 640px)
 */
function KPIsSection({ widgets }: { widgets: WidgetGroup['widgets'] }) {
  return (
    <div className="kpi-grid-responsive gap-4">
      {widgets.map((widget) => (
        <MemoizedWidget
          key={widget.id}
          component={widget.component}
          props={widget.props}
        />
      ))}
    </div>
  );
}

/**
 * Section pour les widgets Chart
 * 
 * Utilise Flexbox pour :
 * - Occuper toute la largeur disponible
 * - Largeur minimale de 400px par Chart (permet maximum 3 par ligne sur desktop standard)
 * - Retour automatique à la ligne selon l'espace disponible
 * - Répartition égale de l'espace par ligne
 * - Adaptation automatique si des widgets sont désactivés
 * - Hauteur fixe de 420px pour tous les charts
 * - 1 colonne sur mobile (< 640px)
 */
function ChartsSection({ widgets }: { widgets: WidgetGroup['widgets'] }) {
  if (widgets.length === 0) return null;

  return (
    <div className="chart-grid-responsive gap-4">
      {widgets.map((widget) => (
        <MemoizedWidget
          key={widget.id}
          component={widget.component}
          props={widget.props}
        />
      ))}
    </div>
  );
}

/**
 * Section pour les widgets Table
 * 
 * Utilise Flexbox pour :
 * - Occuper toute la largeur disponible
 * - Largeur minimale de 400px par Table (permet maximum 3 par ligne sur desktop standard)
 * - Retour automatique à la ligne selon l'espace disponible
 * - Répartition égale de l'espace par ligne
 * - Adaptation automatique si des widgets sont désactivés
 * - Hauteur fixe de 420px pour toutes les tables
 * - 1 colonne sur mobile (< 640px)
 */
function TablesSection({ widgets }: { widgets: WidgetGroup['widgets'] }) {
  if (widgets.length === 0) return null;

  return (
    <div className="table-grid-responsive gap-4">
      {widgets.map((widget) => (
        <MemoizedWidget
          key={widget.id}
          component={widget.component}
          props={widget.props}
        />
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
      {widgets.map((widget) => (
        <MemoizedWidget
          key={widget.id}
          component={widget.component}
          props={widget.props}
        />
      ))}
    </div>
  );
}

