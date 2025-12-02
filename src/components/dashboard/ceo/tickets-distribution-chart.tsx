'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from '@/ui/chart';
import type { TicketFluxData, Period } from '@/types/dashboard';
import { CHART_COLORS, getChartColor } from './charts/chart-colors';
import { renderPieLabel } from './charts/pie-label-renderer';
import { TrendIndicator } from './charts/trend-indicator';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { DISTRIBUTION_TICKETS_DOCUMENTATION } from '@/components/dashboard/dashboard-documentation-content';
import {
  PIE_OUTER_RADIUS,
  PIE_INNER_RADIUS,
  ANIMATION_DURATION,
  ANIMATION_EASING
} from './charts/chart-constants';

type TicketsDistributionChartProps = {
  data: TicketFluxData | null;
  period: Period; // Période globale pour cohérence
};

/**
 * Normalise une clé pour la configuration du graphique
 */
function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Transforme les données de flux pour le pie chart
 */
function transformPieData(data: TicketFluxData) {
  return data.byProduct.map((product) => ({
    name: product.productName,
    key: normalizeKey(product.productName),
    value: product.opened
  }));
}

/**
 * Crée la configuration du graphique à partir des données
 */
function createChartConfig(data: TicketFluxData): ChartConfig {
  const config: ChartConfig = {};
  data.byProduct.forEach((product, index) => {
    const key = normalizeKey(product.productName);
    config[key] = {
      label: product.productName,
      color: getChartColor(index)
    };
  });
  return config;
}

/**
 * Graphique de distribution des tickets par produit avec design moderne
 * 
 * @param data - Données de flux avec répartition par produit
 * @param period - Période globale pour cohérence (utilisé pour optimiser les re-renders)
 */
export function TicketsDistributionChart({ data, period }: TicketsDistributionChartProps) {
  // Optimiser les calculs avec useMemo
  const chartData = useMemo(() => {
    if (!data || !data.byProduct) {
      return [];
    }
    return transformPieData(data);
  }, [data?.byProduct]); // Recalculer seulement si byProduct change

  const chartConfig = useMemo(() => {
    if (!data || !data.byProduct) {
      return {};
    }
    return createChartConfig(data);
  }, [data?.byProduct]); // Recalculer seulement si byProduct change

  const totalOpened = useMemo(() => {
    return data?.opened || 0;
  }, [data?.opened]);

  if (!data || !data.byProduct || !data.trend || chartData.length === 0) {
    return (
      <Card className="h-[420px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-sm font-semibold">Distribution par Produit</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-none dark:border-slate-800 h-[420px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <SectionTitleWithDoc
          title="Distribution par Produit"
          documentation={DISTRIBUTION_TICKETS_DOCUMENTATION}
        >
          <TrendIndicator trend={data.trend.openedTrend} isPositiveWhenNegative />
        </SectionTitleWithDoc>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <ChartContainer
            config={chartConfig}
            className="h-full w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => [`${value} tickets`, 'Ouverts']}
                  />
                }
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={PIE_OUTER_RADIUS}
                innerRadius={PIE_INNER_RADIUS}
                dataKey="value"
                nameKey="key"
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`var(--color-${entry.key})`}
                    stroke="none"
                    strokeWidth={0}
                    className="transition-opacity hover:opacity-90"
                  />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="key" />}
                verticalAlign="bottom"
              />
            </PieChart>
          </ChartContainer>
        </div>
        <div className="mt-4 flex-shrink-0 flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
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

