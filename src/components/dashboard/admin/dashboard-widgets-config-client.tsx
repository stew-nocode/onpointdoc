'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';
import { ROLE_LABELS } from '@/lib/constants/widget-labels';
import { ALL_DASHBOARD_ROLES } from '@/lib/constants/dashboard-roles';
import { WidgetConfigTab } from './widget-config-tab';
import { useWidgetConfigSave } from '@/hooks/dashboard/use-widget-config-save';

type RoleWidgetsConfig = {
  role: DashboardRole;
  widgets: DashboardWidget[];
  updatedAt: string;
  updatedBy: string | null;
};

type DashboardWidgetsConfigClientProps = {
  initialRoleWidgets: RoleWidgetsConfig[];
};

/**
 * Composant client pour la configuration admin des widgets
 */
export function DashboardWidgetsConfigClient({
  initialRoleWidgets,
}: DashboardWidgetsConfigClientProps) {
  const [roleWidgets, setRoleWidgets] = useState<RoleWidgetsConfig[]>(initialRoleWidgets);
  const { savingRole, handleSave: saveConfig } = useWidgetConfigSave();

  /**
   * Toggle un widget pour un rôle
   */
  const toggleWidget = (role: DashboardRole, widgetId: DashboardWidget) => {
    setRoleWidgets((prev) =>
      prev.map((rw) => {
        if (rw.role !== role) return rw;

        const hasWidget = rw.widgets.includes(widgetId);
        return {
          ...rw,
          widgets: hasWidget
            ? rw.widgets.filter((w) => w !== widgetId)
            : [...rw.widgets, widgetId],
        };
      })
    );
  };

  /**
   * Sauvegarder les widgets pour un rôle
   */
  const handleSave = async (role: DashboardRole) => {
    const config = roleWidgets.find((rw) => rw.role === role);
    if (!config) {
      return;
    }
    await saveConfig(role, config.widgets);
  };

  // Créer une config par défaut pour chaque rôle si elle n'existe pas
  const completeRoleWidgets = ALL_DASHBOARD_ROLES.map((role) => {
    const existing = roleWidgets.find((rw) => rw.role === role);
    return (
      existing || {
        role,
        widgets: [],
        updatedAt: new Date().toISOString(),
        updatedBy: null,
      }
    );
  });


  return (
    <Tabs defaultValue="direction" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {ALL_DASHBOARD_ROLES.map((role) => (
          <TabsTrigger key={role} value={role}>
            {ROLE_LABELS[role]}
          </TabsTrigger>
        ))}
      </TabsList>

      {completeRoleWidgets.map((config) => (
        <TabsContent key={config.role} value={config.role}>
          <WidgetConfigTab
            config={config}
            onToggle={(widgetId) => toggleWidget(config.role, widgetId)}
            onSave={() => handleSave(config.role)}
            isSaving={savingRole === config.role}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

