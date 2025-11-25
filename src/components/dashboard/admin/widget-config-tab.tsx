'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Loader2, Save } from 'lucide-react';
import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';
import { WIDGET_REGISTRY } from '../widgets/registry';
import { ROLE_LABELS } from '@/lib/constants/widget-labels';
import { WidgetListItem } from './widget-list-item';

type RoleWidgetsConfig = {
  role: DashboardRole;
  widgets: DashboardWidget[];
  updatedAt: string;
  updatedBy: string | null;
};

type WidgetConfigTabProps = {
  config: RoleWidgetsConfig;
  onToggle: (widgetId: DashboardWidget) => void;
  onSave: () => void;
  isSaving: boolean;
};

/**
 * Tab de configuration pour un rôle (extrait pour réduire la complexité)
 */
export function WidgetConfigTab({
  config,
  onToggle,
  onSave,
  isSaving,
}: WidgetConfigTabProps) {
  const allWidgets = Object.keys(WIDGET_REGISTRY) as DashboardWidget[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Widgets pour {ROLE_LABELS[config.role]}</CardTitle>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allWidgets.map((widgetId) => {
            const isSelected = config.widgets.includes(widgetId);
            return (
              <WidgetListItem
                key={widgetId}
                widgetId={widgetId}
                isSelected={isSelected}
                onToggle={() => onToggle(widgetId)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

