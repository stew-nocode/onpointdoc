'use client';

import { useMemo, useCallback } from 'react';
import * as React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Clock } from 'lucide-react';
import { useChartTooltip } from '@/hooks/charts/useChartTooltip';
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
  bugHours: {
    label: 'BUG',
    theme: {
      light: '#F43F5E', // Rose-500
      dark: '#FB7185',  // Rose-400
    },
  },
  reqHours: {
    label: 'REQ',
    theme: {
      light: '#3B82F6', // Blue-500
      dark: '#60A5FA',  // Blue-400
    },
  },
  assistanceHours: {
    label: 'Assistance',
    theme: {
      light: '#14B8A6', // Teal-500
      dark: '#2DD4BF',  // Teal-400
    },
  },
  relanceHours: {
    label: 'Relance',
    theme: {
      light: '#F59E0B', // Amber-500
      dark: '#FBBF24',  // Amber-400
    },
  },
} satisfies ChartConfig;

/**
 * Couleurs pour les dégradés par type
 */
const GRADIENT_COLORS = {
  bug: { start: '#F43F5E', end: '#E11D48' },
  req: { start: '#3B82F6', end: '#2563EB' },
  assistance: { start: '#14B8A6', end: '#0D9488' },
  relance: { start: '#F59E0B', end: '#D97706' },
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

  // ✅ OPTIMISATION Phase 3B : Tooltip memoizé avec dépendances externes
  const tooltipRenderer = useCallback((active: boolean | undefined, payload: any[] | undefined, label: string | undefined) => {
    if (!active || !payload?.length) return null;

    // Map des labels et couleurs par dataKey
    const typeMap: Record<string, { label: string; color: string }> = {
      bugHours: { label: 'BUG', color: GRADIENT_COLORS.bug.start },
      reqHours: { label: 'REQ', color: GRADIENT_COLORS.req.start },
      assistanceHours: { label: 'Assistance', color: GRADIENT_COLORS.assistance.start },
      relanceHours: { label: 'Relance', color: GRADIENT_COLORS.relance.start },
    };

    // Récupérer le total depuis le payload
    const data = payload[0]?.payload;
    const totalHours = data?.totalHours || 0;

    // Filtrer les entrées avec des valeurs > 0, dédupliquer par dataKey
    const seenDataKeys = new Set<string>();
    const validEntries = payload
      .filter((entry: any) => {
        if (entry.value <= 0 || seenDataKeys.has(entry.dataKey)) {
          return false;
        }
        seenDataKeys.add(entry.dataKey);
        return true;
      })
      .map((entry: any) => {
        return {
          dataKey: entry.dataKey,
          value: entry.value,
          type: typeMap[entry.dataKey] || { label: entry.dataKey, color: entry.color },
        };
      })
      .sort((a: { dataKey: string }, b: { dataKey: string }) => {
        const order = ['assistanceHours', 'bugHours', 'reqHours', 'relanceHours'];
        return order.indexOf(a.dataKey) - order.indexOf(b.dataKey);
      });

    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
        <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          {label}
        </div>
        <div className="space-y-1">
          {validEntries.map((entry: { dataKey: string; value: number; type: { label: string; color: string } }, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: entry.type.color }}
                />
                <span className="text-slate-600 dark:text-slate-400">{entry.type.label}</span>
              </div>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {entry.value.toFixed(1)}h
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 text-sm pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-300">Total</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {totalHours.toFixed(1)}h
            </span>
          </div>
        </div>
      </div>
    );
  }, []);

  const TooltipComponent = useChartTooltip(tooltipRenderer);

  // ✅ OPTIMISATION Phase 3B : Legend memoizée
  const LegendComponent = useMemo(() => {
    const labelMap: Record<string, string> = {
      bugHours: 'BUG',
      reqHours: 'REQ',
      assistanceHours: 'Assistance',
      relanceHours: 'Relance',
    };

    const colorMap: Record<string, string> = {
      bugHours: GRADIENT_COLORS.bug.start,
      reqHours: GRADIENT_COLORS.req.start,
      assistanceHours: GRADIENT_COLORS.assistance.start,
      relanceHours: GRADIENT_COLORS.relance.start,
    };

    const LegendComponentInner = React.memo<{ payload?: any[] }>(({ payload }) => {
      if (!payload?.length) return null;

      return (
        <div className="flex items-center justify-center gap-4 pt-2">
          {payload.map((entry: any, index: number) => {
            const color = colorMap[entry.dataKey] || entry.color || GRADIENT_COLORS.bug.start;
            return (
              <div key={`legend-${index}`} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {labelMap[entry.dataKey] || entry.dataKey}
                </span>
              </div>
            );
          })}
        </div>
      );
    });
    LegendComponentInner.displayName = 'AssistanceTimeEvolutionLegend';

    return LegendComponentInner;
  }, []);

  // Vérifier si au moins une valeur > 0 pour chaque type (pour conditionner le rendu)
  // ✅ CORRECTION ESLint : Déplacer les hooks AVANT l'early return
  const hasBugData = useMemo(() => {
    return data?.data?.some((point) => point.bugHours > 0) ?? false;
  }, [data?.data]);
  const hasReqData = useMemo(() => {
    return data?.data?.some((point) => point.reqHours > 0) ?? false;
  }, [data?.data]);
  const hasRelanceData = useMemo(() => {
    return data?.data?.some((point) => point.relanceHours > 0) ?? false;
  }, [data?.data]);
  const hasAssistanceData = useMemo(() => {
    return data?.data?.some((point) => point.assistanceHours > 0) ?? false;
  }, [data?.data]);

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
              Évolution du temps d&apos;interactions
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
          Tendance par type (BUG / REQ / Assistance / Relance)
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Définition des dégradés SVG par type */}
            <defs>
              <linearGradient id="gradientBug" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.bug.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.bug.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.bug.end} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradientReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.req.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.req.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.req.end} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradientAssistance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.assistance.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.assistance.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.assistance.end} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradientRelance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GRADIENT_COLORS.relance.start} stopOpacity={0.6} />
                <stop offset="50%" stopColor={GRADIENT_COLORS.relance.start} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GRADIENT_COLORS.relance.end} stopOpacity={0.05} />
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
            
            <Tooltip content={<TooltipComponent />} />
            <Legend content={<LegendComponent />} />

            {/* Aires empilées par type - ordre d'empilement de bas en haut : petites valeurs en bas, grandes valeurs en haut */}
            {hasRelanceData && (
              <Area
                type="monotone"
                dataKey="relanceHours"
                stackId="1"
                stroke={GRADIENT_COLORS.relance.start}
                strokeWidth={2}
                fill="url(#gradientRelance)"
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}
            {hasReqData && (
              <Area
                type="monotone"
                dataKey="reqHours"
                stackId="1"
                stroke={GRADIENT_COLORS.req.start}
                strokeWidth={2}
                fill="url(#gradientReq)"
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}
            {hasBugData && (
              <Area
                type="monotone"
                dataKey="bugHours"
                stackId="1"
                stroke={GRADIENT_COLORS.bug.start}
                strokeWidth={2}
                fill="url(#gradientBug)"
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}
            {hasAssistanceData && (
              <Area
                type="monotone"
                dataKey="assistanceHours"
                stackId="1"
                stroke={GRADIENT_COLORS.assistance.start}
                strokeWidth={2}
                fill="url(#gradientAssistance)"
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
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
            Évolution du temps d&apos;interactions
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


