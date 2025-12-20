'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { BugsByTypeAndModuleStats } from '@/services/dashboard/bugs-by-type-and-module-stats';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type BugsByTypeAndModuleChartProps = {
  data: BugsByTypeAndModuleStats | null;
  className?: string;
};

/**
 * Palette de couleurs pour les modules
 * Palette variée pour distinguer facilement chaque module
 */
const MODULE_COLORS = [
  { light: '#3B82F6', dark: '#60A5FA' }, // Blue
  { light: '#EF4444', dark: '#F87171' }, // Red
  { light: '#10B981', dark: '#34D399' }, // Emerald
  { light: '#F59E0B', dark: '#FCD34D' }, // Amber
  { light: '#8B5CF6', dark: '#A78BFA' }, // Violet
  { light: '#EC4899', dark: '#F472B6' }, // Pink
  { light: '#14B8A6', dark: '#2DD4BF' }, // Teal
  { light: '#F97316', dark: '#FB923C' }, // Orange
  { light: '#06B6D4', dark: '#22D3EE' }, // Cyan
  { light: '#84CC16', dark: '#A3E635' }, // Lime
  { light: '#6366F1', dark: '#818CF8' }, // Indigo
  { light: '#F43F5E', dark: '#FB7185' }, // Rose
];

/**
 * Crée un slug valide pour CSS variable
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Chart - BUGs par type et module (Horizontal Stacked Bar)
 * 
 * Affiche les types de BUGs en Y avec barres horizontales empilées par module.
 * Style similaire à l'image fournie.
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function BugsByTypeAndModuleChart({ data, className }: BugsByTypeAndModuleChartProps) {
  // Extraire les valeurs pour éviter les problèmes de dépendances optionnelles
  const modules = data?.modules;
  const dataArray = data?.data;
  
  // Générer la config dynamiquement
  const chartConfig = useMemo<ChartConfig>(() => {
    if (!modules) return {};
    
    const config: ChartConfig = {};
    modules.forEach((module, index) => {
      const colorIndex = index % MODULE_COLORS.length;
      const slug = createSlug(module.id);
      config[slug] = {
        label: module.name,
        theme: {
          light: MODULE_COLORS[colorIndex].light,
          dark: MODULE_COLORS[colorIndex].dark,
        },
      };
    });
    
    return config;
  }, [modules]);

  // Mémoiser les données pour Recharts
  const chartData = useMemo(() => {
    if (!dataArray?.length) return [];
    
    // Inverser l'ordre pour que le plus grand soit en haut
    return [...dataArray].reverse();
  }, [dataArray]);

  // Hauteur fixe pour tous les charts
  const chartHeight = 280;

  // Empty state
  if (!data || data.data.length === 0) {
    return <BugsByTypeAndModuleChartEmpty className={className} />;
  }

  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      'hover:shadow-md transition-shadow',
      className
    )}>
      <CardHeader className="pb-2 min-h-[72px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Bug className="h-4 w-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              BUGs par Type et Module
            </CardTitle>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
            {data.totalBugs.toLocaleString('fr-FR')} BUGs
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Répartition par module (empilé)
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-slate-200 dark:stroke-slate-800"
              horizontal={true}
              vertical={false}
            />
            
            <XAxis 
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-slate-500 dark:text-slate-400"
            />
            
            <YAxis 
              type="category"
              dataKey="bugType"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={180}
              className="text-slate-600 dark:text-slate-400"
            />
            
            <Tooltip content={<CustomTooltip modules={data.modules} />} />
            
            <Legend 
              content={<CustomLegend modules={data.modules} />} 
              wrapperStyle={{ paddingTop: '10px' }}
            />

            {/* Barres empilées - une par module */}
            {data.modules.map((module, index) => {
              const colorIndex = index % MODULE_COLORS.length;
              const slug = createSlug(module.id);
              const isLast = index === data.modules.length - 1;
              
              return (
                <Bar
                  key={module.id}
                  dataKey={module.id}
                  stackId="stack"
                  fill={MODULE_COLORS[colorIndex].light}
                  radius={isLast ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  animationDuration={ANIMATION_DURATION}
                  animationEasing={ANIMATION_EASING}
                />
              );
            })}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Tooltip personnalisé
 */
function CustomTooltip({ active, payload, label, modules }: any) {
  if (!active || !payload?.length) return null;

  // Calculer le total
  const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

  // Créer un map pour les noms de modules
  const moduleNamesMap = new Map(modules.map((m: any) => [m.id, m.name]));

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl max-w-[300px]">
      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-sm">
        {label}
      </div>
      <div className="space-y-1">
        {payload.filter((item: any) => item.value > 0).map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-slate-600 dark:text-slate-400 truncate">
                {moduleNamesMap.get(item.dataKey) || item.dataKey}
              </span>
            </div>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">
              {item.value?.toLocaleString('fr-FR') || 0}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 text-sm pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="font-medium text-slate-700 dark:text-slate-300">Total</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
            {total.toLocaleString('fr-FR')}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Légende personnalisée avec scroll horizontal
 */
function CustomLegend({ payload, modules }: any) {
  if (!payload?.length) return null;

  // Créer un map pour les noms de modules
  const moduleNamesMap = new Map(modules.map((m: any) => [m.id, m.name]));

  return (
    <div className="pt-2 px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="flex items-center gap-4 min-w-max justify-center">
        {payload.map((entry: any, index: number) => {
          // entry.value est le dataKey, donc l'ID du module
          const moduleName = moduleNamesMap.get(entry.value) || entry.value;
          
          return (
            <div key={`legend-${index}`} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {moduleName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * État vide
 */
function BugsByTypeAndModuleChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            BUGs par Type et Module
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-center justify-center">
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
export function BugsByTypeAndModuleChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-48 mt-1 rounded bg-slate-100 dark:bg-slate-800" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-6 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

