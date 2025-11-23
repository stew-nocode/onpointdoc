'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Loader2, Settings } from 'lucide-react';
import type { DashboardWidget, UserDashboardConfig } from '@/types/dashboard-widgets';
import { WidgetPreferenceItem } from './widget-preference-item';
import { useWidgetPreferencesSave } from '@/hooks/dashboard/use-widget-preferences-save';

type WidgetPreferencesDialogProps = {
  widgetConfig: UserDashboardConfig;
  onUpdate?: () => void;
};

/**
 * Dialog pour personnaliser les widgets du dashboard
 */
export function WidgetPreferencesDialog({
  widgetConfig,
  onUpdate,
}: WidgetPreferencesDialogProps) {
  const [open, setOpen] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<DashboardWidget[]>(widgetConfig.hiddenWidgets);
  const { isLoading, handleSave: savePreferences } = useWidgetPreferencesSave();

  // Synchroniser avec la config initiale quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setHiddenWidgets(widgetConfig.hiddenWidgets);
    }
  }, [open, widgetConfig.hiddenWidgets]);

  /**
   * Toggle un widget (masquer/afficher)
   */
  const toggleWidget = (widgetId: DashboardWidget) => {
    setHiddenWidgets((prev) => {
      if (prev.includes(widgetId)) {
        return prev.filter((w) => w !== widgetId);
      }
      return [...prev, widgetId];
    });
  };

  /**
   * Sauvegarder les préférences
   */
  const handleSave = async () => {
    await savePreferences(hiddenWidgets);
    setOpen(false);
    onUpdate?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Personnaliser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personnaliser mon dashboard</DialogTitle>
          <DialogDescription>
            Masquez les widgets que vous ne souhaitez pas voir. Les widgets masqués restent
            disponibles si votre rôle y a accès.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {widgetConfig.availableWidgets.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Aucun widget disponible pour votre rôle.
            </p>
          ) : (
            widgetConfig.availableWidgets.map((widgetId) => {
              const isHidden = hiddenWidgets.includes(widgetId);
              return (
                <WidgetPreferenceItem
                  key={widgetId}
                  widgetId={widgetId}
                  isHidden={isHidden}
                  onToggle={() => toggleWidget(widgetId)}
                />
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

