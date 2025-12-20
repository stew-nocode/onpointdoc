'use client';

/**
 * Composant de monitoring des performances en développement
 * 
 * Affiche un overlay avec les métriques de performance en temps réel :
 * - Core Web Vitals (LCP, FID, CLS, etc.)
 * - Re-renders des composants
 * - Temps de chargement custom
 * 
 * Visible uniquement en mode développement
 * 
 * Optimisé avec memoization pour réduire les re-renders.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useWebVitals, useRenderCount, usePageLoadTime } from '@/hooks/performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { X, Maximize2, Minimize2, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricList } from './performance-monitor/utils/metric-list';
import type { WebVitalMetric } from '@/hooks/performance/use-web-vitals';

type PerformanceMonitorProps = {
  /** Si true, le monitor est visible par défaut */
  defaultVisible?: boolean;
};

/**
 * Composant de monitoring des performances
 * 
 * Affiche un overlay flottant avec les métriques de performance
 * Visible uniquement en développement (NODE_ENV === 'development')
 * 
 * Optimisé avec memoization pour réduire les re-renders :
 * - useMemo pour les métriques calculées
 * - useCallback pour les handlers
 * - Composants enfants memoizés
 */
function PerformanceMonitorComponent({ defaultVisible = false }: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [isMinimized, setIsMinimized] = useState(false);
  const webVitals = useWebVitals();
  const pageLoadMetrics = usePageLoadTime({ logToConsole: false });
  const monitorRenderCount = useRenderCount({
    componentName: 'PerformanceMonitor',
    logToConsole: false,
  });

  /**
   * Calculer les métriques disponibles (memoizé pour éviter les recalculs)
   * 
   * Ne recalcule que si webVitals change (référence).
   */
  const metrics = useMemo(() => {
    return Object.entries(webVitals)
      .map(([, value]) => value)
      .filter((m): m is WebVitalMetric => m !== null);
  }, [webVitals]);

  /**
   * Handlers stabilisés avec useCallback pour éviter les re-renders enfants
   */
  const handleOpen = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Cacher le monitor en production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Bouton flottant pour ouvrir/fermer */}
      {!isVisible && (
        <button
          onClick={handleOpen}
          className="fixed bottom-4 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-110"
          aria-label="Ouvrir le monitor de performance"
          title="Performance Monitor"
        >
          <BarChart3 className="h-5 w-5" />
        </button>
      )}

      {/* Overlay du monitor */}
      {isVisible && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-[9999] w-96 transition-all',
            isMinimized ? 'h-12' : 'h-auto max-h-[80vh]'
          )}
        >
          <Card className="shadow-2xl border-2 border-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-blue-50 dark:bg-blue-950">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Performance Monitor
                <Badge variant="outline" className="text-xs">
                  DEV
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleToggleMinimize}
                  aria-label={isMinimized ? 'Maximiser' : 'Minimiser'}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClose}
                  aria-label="Fermer"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="pt-4 space-y-4 max-h-[calc(80vh-60px)] overflow-y-auto">
                {/* Temps de chargement de la page */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Temps de chargement
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {pageLoadMetrics.pageLoadTime !== null ? (
                      <>
                        <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Chargement total:</span>
                          <span className={cn(
                            "font-mono font-semibold",
                            pageLoadMetrics.pageLoadTime < 1000 ? "text-green-600 dark:text-green-400" :
                            pageLoadMetrics.pageLoadTime < 2000 ? "text-yellow-600 dark:text-yellow-400" :
                            "text-red-600 dark:text-red-400"
                          )}>
                            {pageLoadMetrics.pageLoadTime.toFixed(0)}ms
                          </span>
                        </div>
                        {pageLoadMetrics.domContentLoaded !== null && (
                          <div className="flex justify-between items-center px-2 py-1">
                            <span className="text-slate-500 dark:text-slate-500">DOMContentLoaded:</span>
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {pageLoadMetrics.domContentLoaded.toFixed(0)}ms
                            </span>
                          </div>
                        )}
                        {pageLoadMetrics.fullLoadTime !== null && (
                          <div className="flex justify-between items-center px-2 py-1">
                            <span className="text-slate-500 dark:text-slate-500">Load complet:</span>
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {pageLoadMetrics.fullLoadTime.toFixed(0)}ms
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 px-2">
                          Page: {pageLoadMetrics.pagePath}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-slate-500 p-2">
                        Mesure en cours...
                      </div>
                    )}
                  </div>
                </div>

                {/* Core Web Vitals */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Core Web Vitals
                  </h3>
                  <MetricList metrics={metrics} />
                </div>

                {/* Informations générales */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Informations
                  </h3>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Renders du monitor:</span>
                      <span className="font-mono">{monitorRenderCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="font-mono">{process.env.NODE_ENV}</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    💡 Utilisez <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[9px]">useRenderCount</code> dans vos composants pour détecter les re-renders excessifs.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * Composant exporté avec memoization pour éviter les re-renders inutiles
 * 
 * Ne se re-rend que si defaultVisible change.
 */
export const PerformanceMonitor = React.memo(PerformanceMonitorComponent, (prevProps, nextProps) => {
  // Ne re-rendre que si defaultVisible change
  return prevProps.defaultVisible === nextProps.defaultVisible;
});

PerformanceMonitor.displayName = 'PerformanceMonitor';