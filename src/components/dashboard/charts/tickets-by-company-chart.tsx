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
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { TicketsByCompanyStats } from '@/services/dashboard/tickets-by-company-stats';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type TicketsByCompanyChartProps = {
  data: TicketsByCompanyStats | null;
  className?: string;
};

/**
 * Configuration des couleurs avec support Dark Mode
 */
const chartConfig: ChartConfig = {
  bug: {
    label: 'BUG',
    theme: {
      light: '#F43F5E', // Rose-500
      dark: '#FB7185',  // Rose-400
    },
  },
  req: {
    label: 'REQ',
    theme: {
      light: '#3B82F6', // Blue-500
      dark: '#60A5FA',  // Blue-400
    },
  },
  assistance: {
    label: 'Assistance',
    theme: {
      light: '#14B8A6', // Teal-500
      dark: '#2DD4BF',  // Teal-400
    },
  },
} satisfies ChartConfig;

/**
 * Couleurs directes pour les barres
 */
const BAR_COLORS = {
  bug: '#F43F5E',
  req: '#3B82F6',
  assistance: '#14B8A6',
};

/**
 * Chart - Top entreprises par tickets (Horizontal Stacked Bar)
 * 
 * Affiche les entreprises avec le plus de tickets,
 * empilés par type (BUG / REQ / ASSISTANCE).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function TicketsByCompanyChart({ data, className }: TicketsByCompanyChartProps) {
  // Extraire les données pour éviter les problèmes de dépendances optionnelles
  const dataArray = data?.data;
  
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
    return <TicketsByCompanyChartEmpty className={className} />;
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
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Top {data.companyCount} entreprises
            </CardTitle>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.totalTickets.toLocaleString('fr-FR')} tickets
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Répartition par type de ticket
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
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
              dataKey="companyName"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={120}
              className="text-slate-600 dark:text-slate-400"
              tickFormatter={(value) => {
                // Tronquer les noms trop longs
                return value.length > 15 ? `${value.slice(0, 15)}...` : value;
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend content={<CustomLegend />} />

            {/* Barres empilées - ordre d'empilement */}
            <Bar
              dataKey="assistance"
              stackId="stack"
              fill={BAR_COLORS.assistance}
              radius={[0, 0, 0, 0]}
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
            <Bar
              dataKey="req"
              stackId="stack"
              fill={BAR_COLORS.req}
              radius={[0, 0, 0, 0]}
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
            <Bar
              dataKey="bug"
              stackId="stack"
              fill={BAR_COLORS.bug}
              radius={[4, 4, 4, 4]}
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Tooltip personnalisé
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // Calculer le total
  const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        {label}
      </div>
      <div className="space-y-1">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-slate-600 dark:text-slate-400 capitalize">
                {item.dataKey === 'assistance' ? 'Assistance' : item.dataKey.toUpperCase()}
              </span>
            </div>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
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
 * Légende personnalisée
 */
function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;

  const labelMap: Record<string, string> = {
    assistance: 'Assistance',
    req: 'REQ',
    bug: 'BUG',
  };

  return (
    <div className="flex items-center justify-center gap-6 pt-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {labelMap[entry.dataKey] || entry.dataKey}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * État vide
 */
function TicketsByCompanyChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Top entreprises
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
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
export function TicketsByCompanyChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-40 mt-1 rounded bg-slate-100 dark:bg-slate-800" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-6 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

