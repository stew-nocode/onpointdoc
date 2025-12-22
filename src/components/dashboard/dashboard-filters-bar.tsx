'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2, Settings } from 'lucide-react';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/switch';
import { Label } from '@/ui/label';
import { Separator } from '@/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/tooltip';
import { Info } from 'lucide-react';
import { YearSelector } from './ceo/year-selector';
import { CustomPeriodSelector } from './ceo/custom-period-selector';
import { WidgetPreferenceItem } from './user/widget-preference-item';
import { useWidgetPreferencesSave } from '@/hooks/dashboard/use-widget-preferences-save';
import type { Period } from '@/types/dashboard';
import type { DateRange } from 'react-day-picker';
import type { DashboardWidget, UserDashboardConfig } from '@/types/dashboard-widgets';

type DashboardFiltersBarProps = {
  // Filtres de période
  selectedYear?: string;
  onYearChange: (year: string | undefined) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: { from?: Date; to?: Date } | undefined) => void;
  activeFilterType: 'year' | 'custom-period' | 'none';
  
  // Filtre includeOld
  includeOld: boolean;
  onIncludeOldChange: (includeOld: boolean) => void;
  
  // État de chargement
  isLoading?: boolean;
  
  // Callback de rafraîchissement
  onRefresh: () => void;
  
  // Configuration des widgets pour le bouton de personnalisation
  widgetConfig?: UserDashboardConfig;
  onWidgetConfigUpdate?: () => void;
};

/**
 * Barre de filtres responsive pour le dashboard
 * 
 * Contient :
 * - Sélecteur d'année
 * - Sélecteur de période personnalisée
 * - Toggle "Inclure données anciennes"
 * - Bouton de rafraîchissement
 * - Bouton de personnalisation (icône uniquement)
 * 
 * Responsive : s'adapte aux petits écrans avec un layout en colonne
 */
export function DashboardFiltersBar({
  selectedYear,
  onYearChange,
  dateRange,
  onDateRangeChange,
  activeFilterType,
  includeOld,
  onIncludeOldChange,
  isLoading = false,
  onRefresh,
  widgetConfig,
  onWidgetConfigUpdate,
}: DashboardFiltersBarProps) {
  const router = useRouter();

  const handleRefresh = useCallback(() => {
    // ✅ Ne pas appeler router.refresh() ici car onRefresh() charge déjà les données via loadData
    // router.refresh() peut causer une boucle infinie si searchParams change
    onRefresh();
  }, [onRefresh]);

  // État pour le dialog de personnalisation
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<DashboardWidget[]>(
    widgetConfig?.hiddenWidgets || []
  );
  const { isLoading: isSavingPreferences, handleSave: savePreferences } = useWidgetPreferencesSave();

  // Synchroniser avec la config initiale quand le dialog s'ouvre
  useEffect(() => {
    if (preferencesOpen && widgetConfig) {
      requestAnimationFrame(() => {
        setHiddenWidgets(widgetConfig.hiddenWidgets);
      });
    }
  }, [preferencesOpen, widgetConfig]);

  /**
   * Toggle un widget (masquer/afficher)
   */
  const toggleWidget = useCallback((widgetId: DashboardWidget) => {
    setHiddenWidgets((prev) => {
      if (prev.includes(widgetId)) {
        return prev.filter((w) => w !== widgetId);
      }
      return [...prev, widgetId];
    });
  }, []);

  /**
   * Sauvegarder les préférences
   */
  const handleSavePreferences = useCallback(async () => {
    if (!widgetConfig) return;
    await savePreferences(hiddenWidgets);
    setPreferencesOpen(false);
    onWidgetConfigUpdate?.();
  }, [hiddenWidgets, savePreferences, widgetConfig, onWidgetConfigUpdate]);

  return (
    <div className="w-full space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* === Ligne 1 : Filtres de période (responsive) === */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <YearSelector
            key={`year-selector-${selectedYear || 'none'}`}
            value={selectedYear}
            onValueChange={onYearChange}
            className="w-full sm:w-[120px]"
            isActive={activeFilterType === 'year'}
          />
          <CustomPeriodSelector
            key={`custom-period-${dateRange?.from?.toISOString() || 'none'}-${dateRange?.to?.toISOString() || 'none'}`}
            date={dateRange}
            onSelect={onDateRangeChange}
            isActive={activeFilterType === 'custom-period'}
          />
        </div>

        {/* Indicateur de chargement et boutons d'action */}
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          {widgetConfig && (
            <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Personnaliser le dashboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  <Button variant="outline" onClick={() => setPreferencesOpen(false)} disabled={isSavingPreferences}>
                    Annuler
                  </Button>
                  <Button onClick={handleSavePreferences} disabled={isSavingPreferences}>
                    {isSavingPreferences ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Sauvegarder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rafraîchir</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* === Ligne 2 : Toggle IncludeOld === */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="include-old-switch" className="text-sm font-medium">
            Inclure données anciennes
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Les données anciennes (old = true) peuvent être imprécises.
                  Par défaut activé pour inclure toutes les données.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="include-old-switch"
          checked={includeOld}
          onCheckedChange={(checked) => {
            onIncludeOldChange(checked);
          }}
          disabled={isLoading}
        />
      </div>
      {includeOld && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Les données anciennes sont incluses dans les calculs
        </p>
      )}
    </div>
  );
}

