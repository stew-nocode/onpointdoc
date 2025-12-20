'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
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
import type { AssistanceTimeByCompanyStats } from '@/services/dashboard/assistance-time-by-company-stats';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type AssistanceTimeByCompanyChartProps = {
  data: AssistanceTimeByCompanyStats | null;
  className?: string;
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
 * Couleur directe pour les barres
 */
const BAR_COLOR = '#14B8A6';

/**
 * Chart - Temps d'assistance par entreprise (Horizontal Bar)
 * 
 * Affiche les entreprises avec le plus de temps d'assistance.
 * Barres horizontales simples (non empilées).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function AssistanceTimeByCompanyChart({ data, className }: AssistanceTimeByCompanyChartProps) {
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
    return <AssistanceTimeByCompanyChartEmpty className={className} />;
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
            <Clock className="h-4 w-4 text-teal-500 dark:text-teal-400 flex-shrink-0" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              Temps d&apos;assistance par entreprise
            </CardTitle>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
            {data.totalHours.toFixed(1)}h total
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Top {data.companyCount} entreprises
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
              tickFormatter={(value) => `${value}h`}
            />
            
            <YAxis 
              type="category"
              dataKey="companyName"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={150}
              className="text-slate-600 dark:text-slate-400"
              tickFormatter={(value) => {
                // Tronquer les noms trop longs
                return value.length > 18 ? `${value.slice(0, 18)}...` : value;
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />

            <Bar
              dataKey="totalHours"
              fill={BAR_COLOR}
              radius={[0, 4, 4, 0]}
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

  const item = payload[0];
  const hours = item.value as number;
  const data = item.payload;
  const minutes = data.totalMinutes || 0;
  const ticketCount = data.ticketCount || 0;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-sm">
        {label}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Temps total</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {hours.toFixed(1)}h ({minutes} min)
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Tickets</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {ticketCount.toLocaleString('fr-FR')}
          </span>
        </div>
        {ticketCount > 0 && (
          <div className="flex items-center justify-between gap-4 text-sm pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400">Moyenne</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {Math.round(minutes / ticketCount)} min/ticket
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * État vide
 */
function AssistanceTimeByCompanyChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Temps d&apos;assistance par entreprise
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-center justify-center">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aucun temps d&apos;assistance pour cette période
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
export function AssistanceTimeByCompanyChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-32 mt-1 rounded bg-slate-100 dark:bg-slate-800" />
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

