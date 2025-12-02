/**
 * Pie Chart pour la répartition des tickets par entreprise
 * 
 * Widget avec filtre local par type de ticket (BUG, REQ, ASSISTANCE)
 */

'use client';

import { useMemo, memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/ui/chart';
import type { Period } from '@/types/dashboard';
import type { TicketsByCompanyDistributionData } from '@/services/dashboard/tickets-by-company-distribution';
import { renderPieLabel } from '@/components/dashboard/ceo/charts/pie-label-renderer';
import {
  PIE_OUTER_RADIUS,
  PIE_INNER_RADIUS,
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { TicketsByCompanyPieChartFilters } from './tickets-by-company-pie-chart-filters';
import { TicketsByCompanyPieChartSkeleton } from './tickets-by-company-pie-chart-skeleton';
import { ScrollableLegend } from './tickets-by-company-pie-chart-scrollable-legend';
import { CHART_COLORS } from '@/components/dashboard/ceo/charts/chart-colors';

type TicketsByCompanyPieChartProps = {
  data: TicketsByCompanyDistributionData;
  period: Period; // Période globale du dashboard
  periodStart?: string;
  periodEnd?: string;
  onFiltersChange: (ticketTypes: ('BUG' | 'REQ' | 'ASSISTANCE')[]) => void;
};

/**
 * Transforme les données de distribution pour le pie chart
 */
function transformPieData(distribution: TicketsByCompanyDistributionData['distribution']) {
  return distribution.map((company) => ({
    name: company.companyName,
    key: `company-${company.companyId}`,
    value: company.ticketCount,
    label: company.companyName,
  }));
}

/**
 * Crée la configuration du graphique avec des couleurs dynamiques
 */
function createChartConfig(distribution: TicketsByCompanyDistributionData['distribution']): ChartConfig {
  const config: ChartConfig = {};
  
  distribution.forEach((company, index) => {
    const key = `company-${company.companyId}`;
    config[key] = {
      label: company.companyName,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });
  
  return config;
}

/**
 * Pie Chart de répartition des tickets par entreprise
 * 
 * Optimisé avec React.memo() pour éviter les re-renders inutiles
 */
export const TicketsByCompanyPieChart = memo(function TicketsByCompanyPieChart({
  data,
  period: _period,
  periodStart: _periodStart,
  periodEnd: _periodEnd,
  onFiltersChange,
}: TicketsByCompanyPieChartProps) {
  const chartData = useMemo(() => transformPieData(data.distribution), [data.distribution]);
  const chartConfig = useMemo(() => createChartConfig(data.distribution), [data.distribution]);

  const total = useMemo(
    () => data.distribution.reduce((sum, company) => sum + company.ticketCount, 0),
    [data.distribution]
  );
  const hasData = total > 0 && chartData.length > 0;

  const handleTicketTypesChange = (ticketTypes: ('BUG' | 'REQ' | 'ASSISTANCE')[]) => {
    onFiltersChange(ticketTypes);
  };

  if (!hasData) {
    return (
      <Card className="h-[420px] flex flex-col min-w-[400px]">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SectionTitleWithDoc
              title="Répartition par Entreprise"
              documentation={{
                title: 'Répartition des tickets par entreprise',
                content: 'Affiche la répartition des tickets créés par entreprise avec possibilité de filtrer par type de ticket (BUG, REQ, ASSISTANCE).',
              }}
            />
            <TicketsByCompanyPieChartFilters
              selectedTicketTypes={data.selectedTicketTypes || ['BUG', 'REQ', 'ASSISTANCE']}
              onTicketTypesChange={handleTicketTypesChange}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center min-h-0">
          <p className="text-sm text-slate-500">
            Aucun ticket enregistré pour les filtres sélectionnés
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 h-[420px] flex flex-col min-w-[400px]">
      <CardHeader className="pb-3 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitleWithDoc
            title="Répartition par Entreprise"
            documentation={{
              title: 'Répartition des tickets par entreprise',
              content: 'Affiche la répartition des tickets créés par entreprise avec possibilité de filtrer par type de ticket (BUG, REQ, ASSISTANCE).',
            }}
          />
          <TicketsByCompanyPieChartFilters
            selectedTicketTypes={data.selectedTicketTypes || ['BUG', 'REQ', 'ASSISTANCE']}
            onTicketTypesChange={handleTicketTypesChange}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => {
                      const company = chartData.find((d) => d.key === name);
                      return [`${value} tickets`, company?.label || name];
                    }}
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
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.key}`}
                    fill={`var(--color-${entry.key})`}
                    stroke="none"
                    strokeWidth={0}
                    className="transition-opacity hover:opacity-90"
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        {/* Légende scrollable horizontale */}
        <div className="mt-4 flex-shrink-0">
          <ScrollableLegend 
            config={chartConfig}
            chartData={chartData}
            total={total}
          />
        </div>
        <div className="mt-2 flex-shrink-0 flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Total: {total.toLocaleString('fr-FR')} tickets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

