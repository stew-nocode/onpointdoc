'use client';

import type { DashboardWidget } from '@/types/dashboard-widgets';
import { WIDGET_REGISTRY } from '../widgets/registry';
import { WIDGET_LABELS } from '@/lib/constants/widget-labels';

type WidgetPreferenceItemProps = {
  widgetId: DashboardWidget;
  isHidden: boolean;
  onToggle: () => void;
};

/**
 * Item de préférence pour un widget (utilisé dans le dialog utilisateur)
 */
export function WidgetPreferenceItem({
  widgetId,
  isHidden,
  onToggle,
}: WidgetPreferenceItemProps) {
  const widgetDef = WIDGET_REGISTRY[widgetId];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
      <div className="flex-1">
        <p className="font-medium text-sm">{WIDGET_LABELS[widgetId]}</p>
        {widgetDef.description && (
          <p className="text-xs text-slate-500 mt-1">{widgetDef.description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={!isHidden}
          onChange={onToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

