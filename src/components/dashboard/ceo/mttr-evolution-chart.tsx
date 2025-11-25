'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/ui/chart';
import type { MTTRData } from '@/types/dashboard';
import { TrendIndicator } from './charts/trend-indicator';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { MTTR_EVOLUTION_DOCUMENTATION } from '@/components/dashboard/dashboard-documentation-content';
import {
  CHART_MARGIN,
  AREA_STROKE_WIDTH,
  DOT_RADIUS,
  ACTIVE_DOT_RADIUS,
  ANIMATION_DURATION,
  ANIMATION_EASING
} from './charts/chart-constants';

type MTTREvolutionChartProps = {
  data: MTTRData;
};

/**
 * Configuration du graphique MTTR avec couleurs shadcn/ui
 */
const chartConfig = {
  mttr: {
    label: 'MTTR',
    color: '#6366F1' // Indigo
  }
} satisfies ChartConfig;

/**
 * Transforme les données MTTR pour le graphique
 */
function transformMTTRData(data: MTTRData) {
  return data.byProduct.map((product) => ({
    name: product.productName,
    mttr: Math.round(product.mttr * 10) / 10
  }));
}

/**
 * Graphique d'évolution du MTTR par produit avec design moderne
 * 
 * @param data - Données MTTR avec répartition par produit
 */
export function MTTREvolutionChart({ data }: MTTREvolutionChartProps) {
  if (!data || !data.byProduct) {
    return (
      <Card className="h-[420px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-sm font-semibold">Évolution MTTR</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = transformMTTRData(data);

  return (
    <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 h-[420px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <SectionTitleWithDoc
          title="MTTR par Produit"
          documentation={MTTR_EVOLUTION_DOCUMENTATION}
        >
          <TrendIndicator trend={data.trend} isPositiveWhenNegative />
        </SectionTitleWithDoc>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={CHART_MARGIN}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{
                value: 'Jours',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} jours`, 'MTTR']}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="mttr"
              fill="var(--color-mttr)"
              fillOpacity={0.4}
              stroke="var(--color-mttr)"
              strokeWidth={AREA_STROKE_WIDTH}
              dot={{ fill: 'var(--color-mttr)', r: DOT_RADIUS, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: ACTIVE_DOT_RADIUS, strokeWidth: 2, stroke: '#fff', fill: '#8B5CF6' }}
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

