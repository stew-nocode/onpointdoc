'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatTooltipData } from './tooltip-formatter';

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  formatter?: (value: number | string, name: string) => [string, string];
};

/**
 * Tooltip personnalisé moderne pour les graphiques Recharts
 * 
 * @param active - Si le tooltip est actif
 * @param payload - Données du point survolé
 * @param label - Label du point
 * @param formatter - Fonction de formatage optionnelle
 */
export function CustomTooltip({
  active,
  payload,
  label,
  formatter
}: CustomTooltipProps) {
  const formattedData = useMemo(
    () => formatTooltipData(payload, formatter),
    [payload, formatter]
  );

  if (!active || !formattedData) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-3 shadow-lg',
        'dark:border-slate-700 dark:bg-slate-800',
        'animate-in fade-in-0 zoom-in-95 duration-200'
      )}
    >
      <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {label}
      </p>
      <div className="space-y-1.5">
        {formattedData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {item.name}:
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

