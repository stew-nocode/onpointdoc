'use client';

import { useMemo, useCallback } from 'react';
import * as React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useChartTooltip } from '@/hooks/charts/useChartTooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { TicketsEvolutionStats, DataGranularity } from '@/services/dashboard/tickets-evolution-stats';
import {
  CHART_HEIGHT,
  CHART_MARGIN,
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type TicketsEvolutionChartProps = {
  data: TicketsEvolutionStats | null;
  className?: string;
};

/**
 * Configuration des descriptions selon la granularité
 * Le titre reste fixe pour éviter toute confusion
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
  assistance: {
    label: 'Assistance',
    theme: {
      light: '#14B8A6', // Teal-500
      dark: '#2DD4BF',  // Teal-400
    },
  },
  req: {
    label: 'REQ',
    theme: {
      light: '#3B82F6', // Blue-500
      dark: '#60A5FA',  // Blue-400
    },
  },
  bug: {
    label: 'BUG',
    theme: {
      light: '#F43F5E', // Rose-500
      dark: '#FB7185',  // Rose-400
    },
  },
} satisfies ChartConfig;

/**
 * Couleurs directes pour les dégradés
 */
const GRADIENT_COLORS = {
  assistance: {
    start: '#14B8A6',
    end: '#0D9488',
  },
  req: {
    start: '#3B82F6',
    end: '#2563EB',
  },
  bug: {
    start: '#F43F5E',
    end: '#E11D48',
  },
};

/**
 * Chart - Évolution des tickets (AreaChart avec dégradés)
 *
 * Affiche la tendance des tickets créés avec une granularité adaptative :
 * - Semaine → par jour (7 points)
 * - Mois → par semaine (4 points)
 * - Trimestre/Année → par mois (variable)
 *
 * Soumis aux filtres globaux (période).
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function TicketsEvolutionChart({ data, className }: TicketsEvolutionChartProps) {
  // Mémoiser les données pour Recharts
  const chartData = useMemo(() => {
    if (!data?.data?.length) return [];
    return data.data;
  }, [data?.data]);

  // Déterminer quelles courbes ont des données (au moins 1 valeur > 0)
  // ✅ MODIFIÉ : Toujours afficher les lignes si elles ont des valeurs > 0 dans au moins une période
  const activeDataKeys = useMemo(() => {
    if (!data?.data?.length) return { bug: false, req: false, assistance: false };

    const hasBug = data.data.some(point => point.bug > 0);
    const hasReq = data.data.some(point => point.req > 0);
    const hasAssistance = data.data.some(point => point.assistance > 0);

    return { bug: hasBug, req: hasReq, assistance: hasAssistance };
  }, [data]);

  // Obtenir la description selon la granularité
  const granularity = data?.granularity || 'month';
  const description = GRANULARITY_DESCRIPTION[granularity];

  // ✅ OPTIMISATION Phase 3B : Tooltip memoizé
  const TooltipComponent = useChartTooltip((active, payload, label) => {
    if (!active || !payload?.length) return null;

    // Calculer le total (inclure les valeurs à 0)
    const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

    // Définir un type local pour les éléments du payload (règle TypeScript essentielle)
    type PayloadEntry = {
      value: number;
      dataKey: string;
      stroke: string;
    };

    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
        <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          {label}
        </div>
        <div className="space-y-1">
          {payload.map((item, index: number) => {
            const entry = item as PayloadEntry;
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: entry.stroke }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {entry.dataKey === 'assistance' ? 'Assistance' : entry.dataKey.toUpperCase()}
                  </span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {entry.value?.toLocaleString('fr-FR') || 0}
                </span>
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-4 text-sm pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-300">Total</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {total.toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    );
  });

  // ✅ OPTIMISATION Phase 3B : Legend memoizée avec activeDataKeys
  const LegendComponent = useMemo(() => {
    const labelMap: Record<string, string> = {
      assistance: 'Assistance',
      req: 'REQ',
      bug: 'BUG',
    };

    const allTypes = [
      { dataKey: 'assistance', color: GRADIENT_COLORS.assistance.start, active: activeDataKeys?.assistance },
      { dataKey: 'req', color: GRADIENT_COLORS.req.start, active: activeDataKeys?.req },
      { dataKey: 'bug', color: GRADIENT_COLORS.bug.start, active: activeDataKeys?.bug },
    ];

    return React.memo<{ payload?: any[] }>(({ payload }) => {
      if (!payload?.length && !activeDataKeys) return null;

      return (
        <div className="flex items-center justify-center gap-6 pt-4">
          {allTypes.map((type, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: type.active ? type.color : 'transparent',
                  border: type.active ? 'none' : `1.5px solid ${type.color}`,
                  opacity: type.active ? 1 : 0.4
                }}
              />
              <span className={`text-xs ${type.active ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                {labelMap[type.dataKey] || type.dataKey}
              </span>
            </div>
          ))}
        </div>
      );
    });
  }, [activeDataKeys]);

  // Empty state
  if (!data || data.data.length === 0) {
    return <TicketsEvolutionChartEmpty className={className} />;
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
            <TrendingUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Évolution des tickets
            </CardTitle>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {description}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.totalTickets.toLocaleString('fr-FR')} tickets
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Tendance de création par type
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Définitions des dégradés SVG */}
            <defs>
              {/* Dégradé Assistance (Teal) */}
              <linearGradient id="gradientAssistance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.assistance.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.assistance.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.assistance.end} stopOpacity={0.05} />
              </linearGradient>
              
              {/* Dégradé REQ (Blue) */}
              <linearGradient id="gradientReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.req.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.req.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.req.end} stopOpacity={0.05} />
              </linearGradient>
              
              {/* Dégradé BUG (Rose) */}
              <linearGradient id="gradientBug" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.bug.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.bug.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.bug.end} stopOpacity={0.05} />
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
              width={40}
            />

            <Tooltip content={<TooltipComponent />} />

            <Legend content={<LegendComponent />} />

            {/* Area Assistance - en bas (empilé) - Toujours afficher si données > 0 dans au moins une période */}
            {activeDataKeys.assistance && (
              <Area
                type="monotone"
                dataKey="assistance"
                stackId="1"
                stroke={GRADIENT_COLORS.assistance.start}
                strokeWidth={2}
                fill="url(#gradientAssistance)"
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}

            {/* Line REQ - Ligne indépendante au-dessus d'ASSISTANCE - Toujours afficher si données > 0 dans au moins une période */}
            {activeDataKeys.req && (
              <Line
                type="monotone"
                dataKey="req"
                stroke={GRADIENT_COLORS.req.start}
                strokeWidth={2}
                dot={false}
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}

            {/* Line BUG - Ligne indépendante au-dessus de REQ - Toujours afficher si données > 0 dans au moins une période */}
            {activeDataKeys.bug && (
              <Line
                type="monotone"
                dataKey="bug"
                stroke={GRADIENT_COLORS.bug.start}
                strokeWidth={2}
                dot={false}
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * État vide du chart
 */
function TicketsEvolutionChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Évolution des tickets
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
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
export function TicketsEvolutionChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-48 mt-1 rounded bg-slate-100 dark:bg-slate-800" />
      </CardHeader>
      <CardContent>
        <div className="h-[280px] rounded bg-slate-100 dark:bg-slate-800" />
      </CardContent>
    </Card>
  );
}

