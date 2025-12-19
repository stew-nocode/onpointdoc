'use client';

import { useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
import type { SupportAgentsRadarStats } from '@/services/dashboard/support-agents-radar-stats';
import { ANIMATION_DURATION, ANIMATION_EASING } from '@/components/dashboard/ceo/charts/chart-constants';

type SupportAgentsRadarChartProps = {
  data: SupportAgentsRadarStats | null;
  className?: string;
};

const COLORS = [
  { light: '#3B82F6', dark: '#60A5FA' }, // blue
  { light: '#10B981', dark: '#34D399' }, // emerald
  { light: '#F43F5E', dark: '#FB7185' }, // rose
  { light: '#F59E0B', dark: '#FCD34D' }, // amber
  { light: '#8B5CF6', dark: '#A78BFA' }, // violet
  { light: '#06B6D4', dark: '#22D3EE' }, // cyan
];

export function SupportAgentsRadarChart({ data, className }: SupportAgentsRadarChartProps) {
  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    (data?.agents ?? []).forEach((a, idx) => {
      const c = COLORS[idx % COLORS.length];
      cfg[a.agentId] = {
        label: a.agentName,
        theme: { light: c.light, dark: c.dark },
      };
    });
    return cfg;
  }, [data?.agents]);

  const chartData = data?.chartData ?? [];
  const labelByKey = useMemo(() => {
    const map = new Map<string, string>();
    (data?.agents ?? []).forEach((a) => map.set(a.agentId, a.agentName));
    return map;
  }, [data?.agents]);

  if (!data || data.agents.length === 0) {
    return <SupportAgentsRadarChartEmpty className={className} />;
  }

  return (
    <Card
      className={cn(
        'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950',
        'hover:shadow-md transition-shadow',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Radar Agents Support
            </CardTitle>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Top {data.agents.length}
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Comparaison (normalisée 0–100) : tickets créés & assistances
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <RadarChart data={chartData} outerRadius="70%">
            <PolarGrid className="stroke-slate-200 dark:stroke-slate-800" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 10 }}
              className="text-slate-500 dark:text-slate-400"
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              className="text-slate-500 dark:text-slate-400"
            />
            <Tooltip content={<CustomTooltip labelByKey={labelByKey} />} />
            <Legend content={<CustomLegend labelByKey={labelByKey} />} />

            {data.agents.map((agent, idx) => (
              <Radar
                key={agent.agentId}
                dataKey={agent.agentId}
                stroke={COLORS[idx % COLORS.length].light}
                fill={COLORS[idx % COLORS.length].light}
                fillOpacity={0.12}
                strokeWidth={2}
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            ))}
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label, labelByKey }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 shadow-xl">
      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        {label}
      </div>
      <div className="space-y-1">
        {payload
          .filter((p: any) => typeof p.value === 'number')
          .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))
          .map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  {labelByKey?.get?.(item.dataKey ?? item.name) ?? item.name}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {item.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function CustomLegend({ payload, labelByKey }: any) {
  if (!payload?.length) return null;
  return (
    <div className="pt-2 px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="flex items-center gap-4 min-w-max justify-center">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {labelByKey?.get?.(entry.dataKey ?? entry.value) ?? entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportAgentsRadarChartEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn('border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Radar Agents Support
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <Target className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucune donnée pour cette période</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


