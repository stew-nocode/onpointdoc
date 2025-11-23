'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/ui/card';
import type { MTTRData } from '@/types/dashboard';
import { CustomTooltip } from './charts/custom-tooltip';
import { MTTRAreaGradients } from './charts/chart-gradients';
import { TrendIndicator } from './charts/trend-indicator';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { MTTR_EVOLUTION_DOCUMENTATION } from '@/components/dashboard/dashboard-documentation-content';
import {
  CHART_HEIGHT,
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
  const chartData = transformMTTRData(data);

  return (
    <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800">
      <CardHeader className="pb-3">
        <SectionTitleWithDoc
          title="MTTR par Produit"
          documentation={MTTR_EVOLUTION_DOCUMENTATION}
        >
          <TrendIndicator trend={data.trend} isPositiveWhenNegative />
        </SectionTitleWithDoc>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={chartData} margin={CHART_MARGIN}>
            <MTTRAreaGradients />
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
              className="dark:stroke-slate-700"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={{ stroke: '#E2E8F0' }}
              className="dark:fill-slate-400"
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={{ stroke: '#E2E8F0' }}
              label={{
                value: 'Jours',
                angle: -90,
                position: 'insideLeft',
                fill: '#64748B',
                style: { textAnchor: 'middle' }
              }}
              className="dark:fill-slate-400"
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(value) => [`${value} jours`, 'MTTR']}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="mttr"
              stroke="url(#mttrLineGradient)"
              strokeWidth={AREA_STROKE_WIDTH}
              fill="url(#mttrGradient)"
              dot={{ fill: '#6366F1', r: DOT_RADIUS, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: ACTIVE_DOT_RADIUS, strokeWidth: 2, stroke: '#fff', fill: '#8B5CF6' }}
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

