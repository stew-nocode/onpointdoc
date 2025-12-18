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
import { Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { CampaignsResultsStats } from '@/services/dashboard/campaigns-results-stats';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';

type CampaignsResultsChartProps = {
  data: CampaignsResultsStats | null;
  className?: string;
};

/**
 * Configuration des couleurs avec support Dark Mode
 */
const chartConfig: ChartConfig = {
  sent: {
    label: 'Envoyés',
    theme: {
      light: '#3B82F6', // Blue-500
      dark: '#60A5FA',  // Blue-400
    },
  },
  opened: {
    label: 'Ouverts',
    theme: {
      light: '#10B981', // Emerald-500
      dark: '#34D399',  // Emerald-400
    },
  },
  clicked: {
    label: 'Cliqués',
    theme: {
      light: '#8B5CF6', // Violet-500
      dark: '#A78BFA',  // Violet-400
    },
  },
} satisfies ChartConfig;

/**
 * Couleurs directes pour les barres
 */
const BAR_COLORS = {
  sent: '#3B82F6',
  opened: '#10B981',
  clicked: '#8B5CF6',
};

/**
 * Chart - Résultats des campagnes emails (Horizontal Stacked Bar)
 * 
 * Affiche les campagnes avec leurs performances :
 * Envoyés | Ouverts | Cliqués
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
export function CampaignsResultsChart({ data, className }: CampaignsResultsChartProps) {
  // Mémoiser les données pour Recharts
  const chartData = useMemo(() => {
    if (!data?.data?.length) return [];
    
    // Inverser l'ordre pour que le plus grand soit en haut
    return [...data.data].reverse();
  }, [data?.data]);

  // Hauteur fixe pour tous les charts
  const chartHeight = 280;

  // Empty state
  if (!data || data.data.length === 0) {
    return <CampaignsResultsChartEmpty className={className} />;
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
            <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Top {data.campaignCount} Campagnes Emails
            </CardTitle>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {data.totalSent.toLocaleString('fr-FR')} envoyés
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Performance : Envoyés | Ouverts | Cliqués
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
              dataKey="campaignName"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={150}
              className="text-slate-600 dark:text-slate-400"
              tickFormatter={(value) => {
                // Tronquer les noms trop longs
                return value.length > 20 ? `${value.slice(0, 20)}...` : value;
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend content={<CustomLegend />} />

            {/* Barres - PAS empilées, juste juxtaposées */}
            <Bar
              dataKey="sent"
              fill={BAR_COLORS.sent}
              radius={[0, 4, 4, 0]}
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
            <Bar
              dataKey="opened"
              fill={BAR_COLORS.opened}
              radius={[0, 4, 4, 0]}
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
            <Bar
              dataKey="clicked"
              fill={BAR_COLORS.clicked}
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

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        {label}
      </div>
      <div className="space-y-1">
        {payload.map((item: any, index: number) => {
          const labelMap: Record<string, string> = {
            sent: 'Envoyés',
            opened: 'Ouverts',
            clicked: 'Cliqués',
          };
          
          return (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-slate-600 dark:text-slate-400">
                  {labelMap[item.dataKey] || item.dataKey}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {item.value?.toLocaleString('fr-FR') || 0}
              </span>
            </div>
          );
        })}
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
    sent: 'Envoyés',
    opened: 'Ouverts',
    clicked: 'Cliqués',
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
function CampaignsResultsChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn(
      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Campagnes Emails
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aucune campagne pour cette période
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
export function CampaignsResultsChartSkeleton({ className }: { className?: string }) {
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
          {[...Array(5)].map((_, i) => (
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




