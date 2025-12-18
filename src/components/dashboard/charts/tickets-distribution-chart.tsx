'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { TicketsDistributionStats } from '@/services/dashboard/tickets-distribution-stats';
import {
  CHART_HEIGHT,
  PIE_OUTER_RADIUS,
  PIE_INNER_RADIUS,
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type TicketsDistributionChartProps = {
  data: TicketsDistributionStats | null;
  className?: string;
};

/**
 * Configuration des couleurs avec support Dark Mode
 * Utilise le pattern `theme: { light, dark }` de ShadCN UI ChartConfig
 */
const chartConfig: ChartConfig = {
  BUG: {
    label: 'BUG',
    theme: {
      light: '#F43F5E', // Rose-500
      dark: '#FB7185',  // Rose-400
    },
  },
  REQ: {
    label: 'REQ',
    theme: {
      light: '#3B82F6', // Blue-500
      dark: '#60A5FA',  // Blue-400
    },
  },
  ASSISTANCE: {
    label: 'Assistance',
    theme: {
      light: '#14B8A6', // Teal-500
      dark: '#2DD4BF',  // Teal-400
    },
  },
} satisfies ChartConfig;

/**
 * Couleurs par type pour les Cells (fallback direct)
 */
const TYPE_COLORS: Record<string, { light: string; dark: string }> = {
  BUG: { light: '#F43F5E', dark: '#FB7185' },
  REQ: { light: '#3B82F6', dark: '#60A5FA' },
  ASSISTANCE: { light: '#14B8A6', dark: '#2DD4BF' },
};

/**
 * Chart - Distribution des tickets par type (PieChart Donut)
 *
 * Affiche la répartition BUG/REQ/ASSISTANCE sous forme de donut chart.
 * Soumis aux filtres globaux (période).
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function TicketsDistributionChart({ data, className }: TicketsDistributionChartProps) {
  // Mémoiser les données transformées pour Recharts
  const chartData = useMemo(() => {
    if (!data?.items?.length) return [];
    
    return data.items.map((item) => ({
      name: item.type,
      value: item.count,
      percentage: item.percentage,
      fill: `var(--color-${item.type})`,
    }));
  }, [data?.items]);

  // Empty state
  if (!data || data.total === 0) {
    return <TicketsDistributionChartEmpty className={className} />;
  }

  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      'hover:shadow-md transition-shadow',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Distribution par Type
            </CardTitle>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.total.toLocaleString('fr-FR')} tickets
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Répartition BUG / REQ / Assistance
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="relative h-[280px]">
          <ChartContainer config={chartConfig} className="mx-auto h-full w-full">
            <PieChart>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'transparent' }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={PIE_INNER_RADIUS}
                outerRadius={PIE_OUTER_RADIUS}
                paddingAngle={2}
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="transparent"
                    className="outline-none focus:outline-none"
                  />
                ))}
              </Pie>
              <Legend
                content={<CustomLegend />}
                verticalAlign="bottom"
                height={50}
              />
            </PieChart>
          </ChartContainer>

          {/* Centre du donut avec le total - positionné au centre du pie */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
            style={{ marginTop: '-25px' }} // Ajusté pour tenir compte de la légende
          >
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {data.total.toLocaleString('fr-FR')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Total
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Tooltip personnalisé pour le PieChart
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const name = item.name;
  const value = item.value;
  const percentage = item.payload.percentage;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: TYPE_COLORS[name]?.light || item.payload.fill }}
        />
        <span className="font-medium text-slate-900 dark:text-slate-100">{name}</span>
      </div>
      <div className="mt-1 text-sm">
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
          {value.toLocaleString('fr-FR')}
        </span>
        <span className="ml-2 text-slate-500 dark:text-slate-400">
          ({percentage}%)
        </span>
      </div>
    </div>
  );
}

/**
 * Légende personnalisée pour le PieChart
 */
function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: TYPE_COLORS[entry.value]?.light || entry.color }}
          />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * État vide du chart
 */
function TicketsDistributionChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Distribution par Type
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <PieChartIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aucune donnée pour cette période
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton de chargement
 */
export function TicketsDistributionChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-48 mt-1 rounded bg-slate-100 dark:bg-slate-800" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="h-40 w-40 rounded-full border-8 border-slate-200 dark:border-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}

