/**
 * Légende scrollable horizontale pour le pie chart de répartition par entreprise
 * 
 * Gère le débordement avec un scroll horizontal responsive
 * Compatible mobile et desktop avec scroll natif
 */

'use client';

import { useMemo } from 'react';
import type { ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';

type ScrollableLegendProps = {
  config: ChartConfig;
  chartData: Array<{
    key: string;
    name: string;
    value: number;
    label: string;
  }>;
  total: number;
};

/**
 * Légende scrollable horizontale pour le pie chart
 * 
 * Responsive : s'adapte à la largeur disponible
 * Scroll horizontal : permet d'afficher toutes les entreprises
 * Compatible mobile : scroll natif avec indicateurs visuels
 */
export function ScrollableLegend({ config, chartData, total }: ScrollableLegendProps) {
  const legendItems = useMemo(() => {
    return chartData.map((item) => {
      const configItem = config[item.key];
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
      
      return {
        key: item.key,
        name: configItem?.label || item.name,
        color: configItem?.color || '#8884d8',
        value: item.value,
        percentage,
      };
    });
  }, [config, chartData, total]);

  if (legendItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Container avec scroll horizontal natif - Responsive */}
      <div 
        className={cn(
          "overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar",
          "scroll-smooth"
        )}
      >
        <div className="flex gap-3 sm:gap-4 px-1 min-w-max">
          {legendItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2 flex-shrink-0 group"
              title={`${item.name}: ${item.value} ticket${item.value > 1 ? 's' : ''} (${item.percentage}%)`}
            >
              <div
                className={cn(
                  "h-3 w-3 rounded-sm flex-shrink-0 transition-opacity",
                  "group-hover:opacity-80"
                )}
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {item.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

