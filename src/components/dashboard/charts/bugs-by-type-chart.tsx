'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { BugsByTypeStats } from '@/services/dashboard/bugs-by-type-stats';
import {
  CHART_HEIGHT,
  PIE_OUTER_RADIUS,
  PIE_INNER_RADIUS,
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type BugsByTypeChartProps = {
  data: BugsByTypeStats | null;
  className?: string;
};

/**
 * Palette de couleurs pour les types de BUGs
 * Utilise des nuances de rouge/orange/rose pour représenter les BUGs
 */
const BUG_TYPE_COLORS = [
  { light: '#DC2626', dark: '#EF4444' }, // Red-600 / Red-500
  { light: '#EA580C', dark: '#F97316' }, // Orange-600 / Orange-500
  { light: '#D97706', dark: '#F59E0B' }, // Amber-600 / Amber-500
  { light: '#CA8A04', dark: '#EAB308' }, // Yellow-600 / Yellow-500
  { light: '#F43F5E', dark: '#FB7185' }, // Rose-500 / Rose-400
  { light: '#E11D48', dark: '#F43F5E' }, // Rose-600 / Rose-500
  { light: '#BE123C', dark: '#E11D48' }, // Rose-700 / Rose-600
  { light: '#EC4899', dark: '#F472B6' }, // Pink-500 / Pink-400
  { light: '#DB2777', dark: '#EC4899' }, // Pink-600 / Pink-500
  { light: '#C026D3', dark: '#D946EF' }, // Fuchsia-600 / Fuchsia-500
  { light: '#94A3B8', dark: '#CBD5E1' }, // Slate-400 / Slate-300 (pour "Autres")
];

/**
 * Crée un slug valide pour CSS variable à partir d'un nom
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Configuration des couleurs avec support Dark Mode
 * Génère dynamiquement la config en fonction des données
 */
function generateChartConfig(data: BugsByTypeStats | null): ChartConfig {
  if (!data?.data) return {};
  
  const config: ChartConfig = {};
  data.data.forEach((item, index) => {
    const colorIndex = index % BUG_TYPE_COLORS.length;
    const slug = createSlug(item.bugType);
    config[slug] = {
      label: item.bugType,
      theme: {
        light: BUG_TYPE_COLORS[colorIndex].light,
        dark: BUG_TYPE_COLORS[colorIndex].dark,
      },
    };
  });
  
  return config;
}

/**
 * Chart - Répartition des BUGs par type (PieChart Donut)
 *
 * Affiche la distribution des BUGs selon leur type (bug_type field).
 * Soumis aux filtres globaux (période).
 * Top 10 + "Autres" pour les types moins fréquents.
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function BugsByTypeChart({ data, className }: BugsByTypeChartProps) {
  // Générer la config dynamiquement
  const chartConfig = useMemo(() => generateChartConfig(data), [data]);

  // Extraire les données pour éviter les problèmes de dépendances optionnelles
  const dataArray = data?.data;

  // Mémoiser les données transformées pour Recharts
  const chartData = useMemo(() => {
    if (!dataArray?.length) return [];
    
    return dataArray.map((item, index) => {
      const colorIndex = index % BUG_TYPE_COLORS.length;
      const slug = createSlug(item.bugType);
      return {
        name: item.bugType,
        value: item.count,
        percentage: item.percentage,
        fill: `var(--color-${slug})`,
        lightColor: BUG_TYPE_COLORS[colorIndex].light,
        darkColor: BUG_TYPE_COLORS[colorIndex].dark,
      };
    });
  }, [dataArray]);

  // Empty state
  if (!data || data.totalBugs === 0) {
    return <BugsByTypeChartEmpty className={className} />;
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
            <Bug className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
              BUGs par Type
            </CardTitle>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.totalBugs.toLocaleString('fr-FR')} BUGs
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Répartition par type de dysfonctionnement
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

          {/* Centre du donut avec le total */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
            style={{ marginTop: '-25px' }}
          >
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {data.totalBugs.toLocaleString('fr-FR')}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              BUGs
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
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl max-w-[200px]">
      <div className="flex items-start gap-2">
        <div
          className="mt-1 h-3 w-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: item.payload.lightColor }}
        />
        <span className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight">
          {name}
        </span>
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
 * Affichage horizontal avec scroll si débordement
 */
function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;

  return (
    <div className="pt-2 px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="flex items-center gap-4 min-w-max justify-center">
        {payload.map((entry: any, index: number) => {
          const chartData = entry.payload;
          return (
            <div key={`legend-${index}`} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: chartData.lightColor }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * État vide du chart
 */
function BugsByTypeChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            BUGs par Type
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <Bug className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aucun BUG pour cette période
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
export function BugsByTypeChartSkeleton({ className }: { className?: string }) {
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

