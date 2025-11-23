'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/ui/card';
import type { TicketFluxData } from '@/types/dashboard';
import { CustomTooltip } from './charts/custom-tooltip';
import { CHART_COLORS, getChartColor } from './charts/chart-colors';
import { renderPieLabel } from './charts/pie-label-renderer';
import { TrendIndicator } from './charts/trend-indicator';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { DISTRIBUTION_TICKETS_DOCUMENTATION } from '@/components/dashboard/dashboard-documentation-content';
import {
  CHART_HEIGHT,
  PIE_OUTER_RADIUS,
  PIE_INNER_RADIUS,
  PIE_LEGEND_HEIGHT,
  ANIMATION_DURATION,
  ANIMATION_EASING
} from './charts/chart-constants';

type TicketsDistributionChartProps = {
  data: TicketFluxData;
};

/**
 * Transforme les données de flux pour le pie chart
 */
function transformPieData(data: TicketFluxData) {
  return data.byProduct.map((product, index) => ({
    name: product.productName,
    value: product.opened,
    color: getChartColor(index)
  }));
}

/**
 * Graphique de distribution des tickets par produit avec design moderne
 * 
 * @param data - Données de flux avec répartition par produit
 */
export function TicketsDistributionChart({ data }: TicketsDistributionChartProps) {
  const chartData = transformPieData(data);
  const totalOpened = data.opened;

  return (
    <Card className="border-slate-200 shadow-none dark:border-slate-800">
      <CardHeader className="pb-3">
        <SectionTitleWithDoc
          title="Distribution par Produit"
          documentation={DISTRIBUTION_TICKETS_DOCUMENTATION}
        >
          <TrendIndicator trend={data.trend.openedTrend} isPositiveWhenNegative />
        </SectionTitleWithDoc>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderPieLabel}
              outerRadius={PIE_OUTER_RADIUS}
              innerRadius={PIE_INNER_RADIUS}
              fill="#8884d8"
              dataKey="value"
              animationDuration={ANIMATION_DURATION}
              animationEasing={ANIMATION_EASING}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                  strokeWidth={0}
                  className="transition-opacity hover:opacity-90"
                />
              ))}
            </Pie>
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(value) => [`${value} tickets`, 'Ouverts']}
                />
              }
            />
            <Legend
              verticalAlign="bottom"
              height={PIE_LEGEND_HEIGHT}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#64748B' }}
              className="dark:text-slate-400"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS[0] }}
            />
            <span>Total: {totalOpened.toLocaleString('fr-FR')} tickets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

