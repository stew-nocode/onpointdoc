'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrendIndicatorProps = {
  trend: number;
  isPositiveWhenNegative?: boolean;
};

/**
 * Indicateur de tendance avec icône et pourcentage
 * 
 * @param trend - Valeur de la tendance (en pourcentage)
 * @param isPositiveWhenNegative - Si true, une tendance négative est considérée comme positive (ex: moins de temps = mieux)
 */
export function TrendIndicator({ trend, isPositiveWhenNegative = false }: TrendIndicatorProps) {
  const isPositive = isPositiveWhenNegative ? trend < 0 : trend > 0;

  return (
    <div className="flex items-center gap-1.5">
      {isPositive ? (
        <TrendingDown className="h-4 w-4 text-status-success" />
      ) : (
        <TrendingUp className="h-4 w-4 text-status-danger" />
      )}
      <span
        className={cn(
          'text-sm font-medium',
          isPositive ? 'text-status-success' : 'text-status-danger'
        )}
      >
        {Math.abs(trend)}%
      </span>
    </div>
  );
}

