'use client';

/**
 * Composant pour afficher la liste des métriques Web Vitals
 * 
 * Extrait du PerformanceMonitor pour respecter le principe SRP.
 * Composant memoizé pour éviter les re-renders inutiles.
 */

import React from 'react';
import { Badge } from '@/ui/badge';
import { cn } from '@/lib/utils';
import type { WebVitalMetric } from '@/hooks/performance/use-web-vitals';
import {
  getRatingColor,
  getRatingBadgeVariant,
  formatMetricValue,
  getRatingIcon
} from './metric-helpers';

type MetricListProps = {
  /**
   * Liste des métriques à afficher
   */
  metrics: WebVitalMetric[];
};

/**
 * Composant pour afficher une seule métrique
 * 
 * Memoizé pour éviter les re-renders si les props ne changent pas.
 */
const MetricItem = React.memo(({ metric }: { metric: WebVitalMetric }) => {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div
          className={cn('h-2 w-2 rounded-full', getRatingColor(metric.rating))}
        />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {metric.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {formatMetricValue(metric.name, metric.value)}
        </span>
        <Badge
          variant={getRatingBadgeVariant(metric.rating) as any}
          className="text-[10px] px-1.5 py-0"
        >
          {getRatingIcon(metric.rating)}
        </Badge>
      </div>
    </div>
  );
});

MetricItem.displayName = 'MetricItem';

/**
 * Liste des métriques Web Vitals
 * 
 * Affiche toutes les métriques disponibles ou un message de chargement.
 */
export function MetricList({ metrics }: MetricListProps) {
  if (metrics.length === 0) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Chargement des métriques...
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {metrics.map((metric) => (
        <MetricItem key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

