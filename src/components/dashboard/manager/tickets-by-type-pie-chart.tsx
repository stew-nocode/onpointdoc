/**
 * Pie Chart pour la répartition des tickets par type (BUG, REQ, ASSISTANCE)
 * 
 * Widget avec filtre local par agent Support
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
import type { TicketsByTypeDistributionData } from '@/services/dashboard/tickets-by-type-distribution';
import { renderPieLabel } from '@/components/dashboard/ceo/charts/pie-label-renderer';
import {
  PIE_OUTER_RADIUS,
  PIE_INNER_RADIUS,
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { TicketsByTypePieChartFilters } from './tickets-by-type-pie-chart-filters';
import { TicketsByTypePieChartSkeleton } from './tickets-by-type-pie-chart-skeleton';

type TicketsByTypePieChartProps = {
  data: TicketsByTypeDistributionData;
  period: Period; // Période globale du dashboard
  periodStart?: string;
  periodEnd?: string;
  onFiltersChange: (agents: string[]) => void;
};

/**
 * Palette de couleurs - Violet d'OBC pour BUG, Orange doux pour REQ, Cyan pour ASSISTANCE
 * BUG: Violet d'OBC de "Distribution des Tickets" (#6366F1 - Indigo)
 * REQ: Orange doux (vibranc réduite de ~25% - couleur partagée par l'utilisateur)
 * ASSISTANCE: Vibrant Cyan (Cyan vibrant)
 * Opacité à 100% pour light et dark mode
 */
const TICKET_TYPE_COLORS: Record<'BUG' | 'REQ' | 'ASSISTANCE', { light: string; dark: string }> = {
  BUG: { 
    light: '#6366F1',    // 1ère couleur: Violet d'OBC de "Distribution des Tickets" (Indigo élégant)
    dark: 'rgba(99, 102, 241, 1.0)'  // Violet d'OBC opaque (dark mode - 100% opacité)
  },
  REQ: { 
    light: '#FF8C42',    // 2ème couleur: Orange doux (vibranc réduite de 25%)
    dark: 'rgba(255, 140, 66, 1.0)'  // Orange doux opaque (dark mode - 100% opacité)
  },
  ASSISTANCE: { 
    light: '#06B6D4',    // 3ème couleur: Vibrant Cyan - Cyan vibrant
    dark: 'rgba(6, 182, 212, 1.0)'  // Cyan opaque (dark mode - 100% opacité)
  },
};

/**
 * Labels pour les types de tickets
 */
const TICKET_TYPE_LABELS: Record<'BUG' | 'REQ' | 'ASSISTANCE', string> = {
  BUG: 'BUG',
  REQ: 'Requête',
  ASSISTANCE: 'Assistance',
};

/**
 * Transforme les données de distribution pour le pie chart
 */
function transformPieData(distribution: TicketsByTypeDistributionData['distribution']) {
  return [
    {
      name: 'BUG',
      key: 'bug',
      value: distribution.BUG,
      label: TICKET_TYPE_LABELS.BUG,
    },
    {
      name: 'REQ',
      key: 'req',
      value: distribution.REQ,
      label: TICKET_TYPE_LABELS.REQ,
    },
    {
      name: 'ASSISTANCE',
      key: 'assistance',
      value: distribution.ASSISTANCE,
      label: TICKET_TYPE_LABELS.ASSISTANCE,
    },
  ].filter((item) => item.value > 0); // Ne garder que les types avec des tickets
}

/**
 * Crée la configuration du graphique
 */
function createChartConfig(): ChartConfig {
  return {
    bug: {
      label: TICKET_TYPE_LABELS.BUG,
      theme: {
        light: TICKET_TYPE_COLORS.BUG.light,
        dark: TICKET_TYPE_COLORS.BUG.dark,
      },
    },
    req: {
      label: TICKET_TYPE_LABELS.REQ,
      theme: {
        light: TICKET_TYPE_COLORS.REQ.light,
        dark: TICKET_TYPE_COLORS.REQ.dark,
      },
    },
    assistance: {
      label: TICKET_TYPE_LABELS.ASSISTANCE,
      theme: {
        light: TICKET_TYPE_COLORS.ASSISTANCE.light,
        dark: TICKET_TYPE_COLORS.ASSISTANCE.dark,
      },
    },
  };
}

/**
 * Pie Chart de répartition des tickets par type
 * 
 * Optimisé avec React.memo() pour éviter les re-renders inutiles
 */
export const TicketsByTypePieChart = memo(function TicketsByTypePieChart({
  data,
  period: _period,
  periodStart: _periodStart,
  periodEnd: _periodEnd,
  onFiltersChange,
}: TicketsByTypePieChartProps) {
  const chartData = useMemo(() => transformPieData(data.distribution), [data.distribution]);
  const chartConfig = useMemo(() => createChartConfig(), []);

  const total = data.distribution.total;
  const hasData = total > 0 && chartData.length > 0;

  const handleAgentsChange = (agentIds: string[]) => {
    onFiltersChange(agentIds);
  };

  if (!hasData) {
    return (
      <Card className="h-[420px] flex flex-col min-w-[400px]">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SectionTitleWithDoc
              title="Répartition par Type"
              documentation={{
                title: 'Répartition des tickets par type',
                content: 'Affiche la répartition des tickets créés par type (BUG, REQ, ASSISTANCE) avec possibilité de filtrer par agent Support.',
              }}
            />
            <TicketsByTypePieChartFilters
              selectedAgents={data.selectedAgents || []}
              agents={data.agents}
              onAgentsChange={handleAgentsChange}
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
            title="Répartition par Type"
            documentation={{
              title: 'Répartition des tickets par type',
              content: 'Affiche la répartition des tickets créés par type (BUG, REQ, ASSISTANCE) avec possibilité de filtrer par agent Support.',
            }}
          />
          <TicketsByTypePieChartFilters
            selectedAgents={data.selectedAgents || []}
            agents={data.agents}
            onAgentsChange={handleAgentsChange}
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
                      const label = chartData.find((d) => d.key === name)?.label || name;
                      return [`${value} tickets`, label];
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
              <ChartLegend
                content={<ChartLegendContent nameKey="key" />}
                verticalAlign="bottom"
              />
            </PieChart>
          </ChartContainer>
        </div>
        <div className="mt-4 flex-shrink-0 flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Total: {total.toLocaleString('fr-FR')} tickets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

