'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { AssistanceTimeEvolutionStats } from '@/services/dashboard/assistance-time-evolution-stats';
import type { DataGranularity } from '@/services/dashboard/tickets-evolution-stats';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type AssistanceTimeEvolutionChartProps = {
  data: AssistanceTimeEvolutionStats | null;
  className?: string;
};

/**
 * Configuration des descriptions selon la granularité
 */
const GRANULARITY_DESCRIPTION: Record<DataGranularity, string> = {
  day: 'Par jour',
  week: 'Par semaine',
  month: 'Par mois',
};

/**
 * Configuration des couleurs avec support Dark Mode
 */
const chartConfig: ChartConfig = {
  totalHours: {
    label: 'Temps d\'assistance',
    theme: {
      light: '#14B8A6', // Teal-500
      dark: '#2DD4BF',  // Teal-400
    },
  },
} satisfies ChartConfig;

/**
 * Couleurs pour le dégradé
 */
const GRADIENT_COLORS = {
  start: '#14B8A6', // Teal-500
  end: '#0D9488',   // Teal-600
};

/**
 * Chart - Évolution du temps d'assistance (AreaChart avec dégradé)
 *
 * Affiche la tendance du temps d'assistance avec une granularité adaptative :
 * - Semaine → par jour (7 points)
 * - Mois → par semaine (4 points)
 * - Trimestre/Année → par mois (variable)
 *
 * Soumis aux filtres globaux (période).
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function AssistanceTimeEvolutionChart({ data, className }: AssistanceTimeEvolutionChartProps) {
  // Mémoiser les données pour Recharts
  const chartData = useMemo(() => {
    if (!data?.data?.length) return [];
    return data.data;
  }, [data?.data]);

  // Obtenir la description selon la granularité
  const granularity = data?.granularity || 'month';
  const description = GRANULARITY_DESCRIPTION[granularity];

  // Empty state
  if (!data || data.data.length === 0) {
    return <AssistanceTimeEvolutionChartEmpty className={className} />;
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
            <Clock className="h-4 w-4 text-teal-500 dark:text-teal-400" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Évolution du temps d'assistance
            </CardTitle>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {description}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.totalHours.toFixed(1)}h total
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Tendance du temps d'assistance
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Définition du dégradé SVG */}
            <defs>
              <linearGradient id="gradientAssistanceTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.end} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-slate-200 dark:stroke-slate-800" 
              vertical={false}
            />
            
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-slate-500 dark:text-slate-400"
              dy={10}
            />
            
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-slate-500 dark:text-slate-400"
              width={50}
              tickFormatter={(value) => `${value}h`}
            />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Area unique pour le temps d'assistance */}
            <Area
              type="monotone"
              dataKey="totalHours"
              stroke={GRADIENT_COLORS.start}
              strokeWidth={2}
              fill="url(#gradientAssistanceTime)"
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Tooltip personnalisé pour l'AreaChart
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const hours = item.value as number;
  const data = item.payload;
  const minutes = data.totalMinutes || 0;
  const ticketCount = data.ticketCount || 0;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        {label}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: GRADIENT_COLORS.start }}
            />
            <span className="text-slate-600 dark:text-slate-400">Temps total</span>
          </div>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {hours.toFixed(1)}h ({minutes} min)
          </span>
        </div>
        {ticketCount > 0 && (
          <>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-600 dark:text-slate-400">Tickets</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {ticketCount.toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Moyenne</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(minutes / ticketCount)} min/ticket
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * État vide du chart
 */
function AssistanceTimeEvolutionChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Évolution du temps d'assistance
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
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
export function AssistanceTimeEvolutionChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-40 mt-1 rounded bg-slate-100 dark:bg-slate-800" />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] rounded bg-slate-100 dark:bg-slate-800" />
      </CardContent>
    </Card>
  );
}


