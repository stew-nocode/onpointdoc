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
 */

import { useState, useEffect } from 'react';
import { useWebVitals, useRenderCount } from '@/hooks/performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { X, Maximize2, Minimize2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PerformanceMonitorProps = {
  /** Si true, le monitor est visible par défaut */
  defaultVisible?: boolean;
};

/**
 * Composant de monitoring des performances
 * 
 * Affiche un overlay flottant avec les métriques de performance
 * Visible uniquement en développement (NODE_ENV === 'development')
 */
export function PerformanceMonitor({ defaultVisible = false }: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const webVitals = useWebVitals();
  const monitorRenderCount = useRenderCount({
    componentName: 'PerformanceMonitor',
    logToConsole: false,
  });

  // Cacher le monitor en production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Récupérer toutes les métriques non nulles
  const metrics = Object.entries(webVitals)
    .map(([key, value]) => value && { key, ...value })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'bg-green-500';
      case 'needs-improvement':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
    }
  };

  const getRatingBadge = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'success';
      case 'needs-improvement':
        return 'warning';
      case 'poor':
        return 'danger';
    }
  };

  const formatValue = (name: string, value: number): string => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  return (
    <>
      {/* Bouton flottant pour ouvrir/fermer */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
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
                  onClick={() => setIsMinimized(!isMinimized)}
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
                  onClick={() => setIsVisible(false)}
                  aria-label="Fermer"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="pt-4 space-y-4 max-h-[calc(80vh-60px)] overflow-y-auto">
                {/* Core Web Vitals */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Core Web Vitals
                  </h3>
                  {metrics.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chargement des métriques...
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {metrics.map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                getRatingColor(metric.rating)
                              )}
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {metric.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {formatValue(metric.name, metric.value)}
                            </span>
                            <Badge
                              variant={getRatingBadge(metric.rating) as any}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {metric.rating === 'good'
                                ? '✓'
                                : metric.rating === 'needs-improvement'
                                  ? '!'
                                  : '✗'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

