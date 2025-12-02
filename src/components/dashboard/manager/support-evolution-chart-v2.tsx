/**
 * Graphique d'évolution Support - VERSION 2
 * 
 * Widget de tendances globales par dimension (BUG, REQ, ASSISTANCE, Temps, etc.)
 * Affiche des lignes dynamiques selon les dimensions sélectionnées
 */

'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/ui/chart';
import type { SupportEvolutionData, SupportDimension } from '@/types/dashboard-support-evolution';
import { SupportEvolutionFiltersV2 } from './support-evolution-filters-v2';
import {
  CHART_MARGIN,
  ANIMATION_DURATION,
  ANIMATION_EASING,
} from '@/components/dashboard/ceo/charts/chart-constants';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { SUPPORT_EVOLUTION_DOCUMENTATION } from '@/components/dashboard/dashboard-documentation-content';

type SupportEvolutionChartV2Props = {
  data: SupportEvolutionData;
  onFiltersChange: (filters: {
    selectedAgents: string[];
    selectedDimensions: SupportDimension[];
  }) => void;
};

/**
 * Dimensions disponibles avec leurs couleurs (light et dark)
 */
const DIMENSION_COLORS: Record<SupportDimension, { light: string; dark: string }> = {
  BUG: { light: '#EF4444', dark: '#F87171' }, // Red
  REQ: { light: '#3B82F6', dark: '#60A5FA' }, // Blue
  ASSISTANCE: { light: '#10B981', dark: '#34D399' }, // Green
  assistanceTime: { light: '#F59E0B', dark: '#FBBF24' }, // Amber
  tasks: { light: '#8B5CF6', dark: '#A78BFA' }, // Purple
  activities: { light: '#EC4899', dark: '#F472B6' }, // Pink
};

/**
 * Labels pour les dimensions
 */
const DIMENSION_LABELS: Record<SupportDimension, string> = {
  BUG: 'BUG',
  REQ: 'Requête',
  ASSISTANCE: 'Assistance',
  assistanceTime: 'Temps d\'assistance (min)',
  tasks: 'Tâches',
  activities: 'Activités',
};

/**
 * Crée la configuration du graphique dynamiquement avec support dark/light
 */
function createChartConfig(selectedDimensions: SupportDimension[]): ChartConfig {
  const config: ChartConfig = {};

  selectedDimensions.forEach((dimension) => {
    config[dimension] = {
      label: DIMENSION_LABELS[dimension],
      theme: {
        light: DIMENSION_COLORS[dimension].light,
        dark: DIMENSION_COLORS[dimension].dark,
      },
    };
  });

  return config;
}

/**
 * Transforme les données pour le graphique
 */
function transformChartData(
  data: SupportEvolutionData,
  selectedDimensions: SupportDimension[]
) {
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SupportEvolutionChartV2] transformChartData: No data points', {
        dataLength: data.data?.length || 0,
        selectedDimensions,
      });
    }
    return [];
  }
  
  if (!selectedDimensions || selectedDimensions.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SupportEvolutionChartV2] transformChartData: No selected dimensions');
    }
    return [];
  }
  
  return data.data.map((point) => {
    const dateObj = new Date(point.date);
    let dateLabel: string;

    // Format de date selon la période
    const isYearPeriod = typeof data.period === 'string' && /^\d{4}$/.test(data.period) || data.period === 'year';

    if (isYearPeriod) {
      // Pour l'année, afficher seulement le mois
      dateLabel = dateObj.toLocaleDateString('fr-FR', {
        month: 'short',
      });
    } else if (data.period === 'quarter') {
      // Pour le trimestre, afficher mois + jour
      dateLabel = dateObj.toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      });
    } else {
      // Pour semaine et mois, afficher mois + jour
      dateLabel = dateObj.toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      });
    }

    const chartPoint: Record<string, string | number> = {
      date: dateLabel,
    };

    // Ajouter les valeurs selon les dimensions sélectionnées
    selectedDimensions.forEach((dimension) => {
      switch (dimension) {
        case 'BUG':
          chartPoint[dimension] = point.bugs;
          break;
        case 'REQ':
          chartPoint[dimension] = point.reqs;
          break;
        case 'ASSISTANCE':
          chartPoint[dimension] = point.assistances;
          break;
        case 'assistanceTime':
          chartPoint[dimension] = point.assistanceTime;
          break;
        case 'tasks':
          chartPoint[dimension] = point.tasks || 0;
          break;
        case 'activities':
          chartPoint[dimension] = point.activities || 0;
          break;
      }
    });

    return chartPoint;
  });
}

/**
 * Graphique d'évolution de performance Support V2
 */
export function SupportEvolutionChartV2({
  data,
  onFiltersChange,
}: SupportEvolutionChartV2Props) {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[SupportEvolutionChartV2] Rendering with data:', {
      hasData: !!data,
      dataLength: data?.data?.length || 0,
      selectedDimensions: data?.selectedDimensions || [],
      selectedDimensionsLength: data?.selectedDimensions?.length || 0,
      agentsCount: data?.agents?.length || 0,
    });
  }

  const chartData = useMemo(() => {
    if (!data || !data.data || !data.selectedDimensions) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SupportEvolutionChartV2] Missing data:', {
          hasData: !!data,
          hasDataArray: !!data?.data,
          hasSelectedDimensions: !!data?.selectedDimensions,
        });
      }
      return [];
    }
    
    const transformed = transformChartData(data, data.selectedDimensions);
    if (process.env.NODE_ENV === 'development') {
      console.log('[SupportEvolutionChartV2] Transformed chart data:', {
        length: transformed.length,
        firstPoint: transformed[0],
        selectedDimensions: data.selectedDimensions,
        sampleKeys: transformed[0] ? Object.keys(transformed[0]) : [],
      });
    }
    return transformed;
  }, [data?.data, data?.selectedDimensions]);
  
  const chartConfig = useMemo(() => createChartConfig(data.selectedDimensions), [data.selectedDimensions]);

  // Déterminer si on a besoin d'un axe Y droit (pour le temps d'assistance)
  const hasAssistanceTime = data.selectedDimensions?.includes('assistanceTime') || false;
  const volumeDimensions = (data.selectedDimensions || []).filter(d => d !== 'assistanceTime');

  // Dimensions disponibles (actuellement BUG, REQ, ASSISTANCE, assistanceTime)
  const availableDimensions: SupportDimension[] = ['BUG', 'REQ', 'ASSISTANCE', 'assistanceTime'];

  // Debug: Vérifier les dimensions et les clés des données
  if (process.env.NODE_ENV === 'development') {
    console.log('[SupportEvolutionChartV2] Chart rendering:', {
      selectedDimensions: data.selectedDimensions,
      volumeDimensions,
      hasAssistanceTime,
      chartDataLength: chartData.length,
      chartDataKeys: chartData[0] ? Object.keys(chartData[0]) : [],
      firstDataPoint: chartData[0],
    });
  }

  const handleFiltersChange = (filters: {
    selectedAgents: string[];
    selectedDimensions: SupportDimension[];
  }) => {
    onFiltersChange(filters);
  };

  const hasData = chartData && chartData.length > 0;
  const hasSelectedDimensions = data.selectedDimensions && data.selectedDimensions.length > 0;
  const hasRawData = data.data && data.data.length > 0;

  if (process.env.NODE_ENV === 'development') {
    console.log('[SupportEvolutionChartV2] Display conditions:', {
      hasData,
      hasSelectedDimensions,
      hasRawData,
      chartDataLength: chartData?.length || 0,
      rawDataLength: data.data?.length || 0,
    });
  }

  if (!hasData || !hasSelectedDimensions) {
    return (
      <Card className="h-[420px] flex flex-col min-w-[400px]">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <SectionTitleWithDoc
              title="Évolution Performance Support"
              documentation={SUPPORT_EVOLUTION_DOCUMENTATION}
            />
            <SupportEvolutionFiltersV2
              selectedAgents={data.selectedAgents || []}
              selectedDimensions={data.selectedDimensions}
              agents={data.agents}
              availableDimensions={availableDimensions}
              onAgentsChange={(agents) =>
                handleFiltersChange({
                  selectedAgents: agents,
                  selectedDimensions: data.selectedDimensions,
                })
              }
              onDimensionsChange={(dimensions) =>
                handleFiltersChange({
                  selectedAgents: data.selectedAgents || [],
                  selectedDimensions: dimensions,
                })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center min-h-0">
          <p className="text-sm text-slate-500">
            {!hasSelectedDimensions
              ? 'Sélectionnez au moins une dimension à afficher'
              : 'Aucune donnée disponible pour les filtres sélectionnés'}
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
            title="Évolution Performance Support"
            documentation={SUPPORT_EVOLUTION_DOCUMENTATION}
          />
          <SupportEvolutionFiltersV2
            selectedAgents={data.selectedAgents || []}
            selectedDimensions={data.selectedDimensions}
            agents={data.agents}
            availableDimensions={availableDimensions}
            onAgentsChange={(agents) =>
              handleFiltersChange({
                selectedAgents: agents,
                selectedDimensions: data.selectedDimensions,
              })
            }
            onDimensionsChange={(dimensions) =>
              handleFiltersChange({
                selectedAgents: data.selectedAgents || [],
                selectedDimensions: dimensions,
              })
            }
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={CHART_MARGIN}
          >
            <defs>
              {/* Définir les dégradés pour chaque dimension */}
              {volumeDimensions.map((dimension) => (
                <linearGradient
                  key={`gradient-${dimension}`}
                  id={`gradient-${dimension}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${dimension})`}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${dimension})`}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
              {hasAssistanceTime && (
                <linearGradient
                  id="gradient-assistanceTime"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-assistanceTime)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-assistanceTime)"
                    stopOpacity={0}
                  />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              className="stroke-slate-200 dark:stroke-slate-800"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={30}
              className="text-slate-600 dark:text-slate-400"
            />
            {/* Axe Y gauche pour les volumes */}
            {volumeDimensions.length > 0 && (
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-slate-600 dark:text-slate-400"
                label={{
                  value: 'Volumes',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                }}
              />
            )}
            {/* Axe Y droite pour le temps d'assistance */}
            {hasAssistanceTime && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-slate-600 dark:text-slate-400"
                label={{
                  value: 'Temps (min)',
                  angle: 90,
                  position: 'insideRight',
                  style: { textAnchor: 'middle' },
                }}
              />
            )}
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Legend />

            {/* Zones avec dégradé pour les dimensions de volume (axe gauche) */}
            {volumeDimensions.map((dimension) => (
              <Area
                key={`area-${dimension}`}
                yAxisId="left"
                type="monotone"
                dataKey={dimension}
                stroke={`var(--color-${dimension})`}
                strokeWidth={1.5}
                fill={`url(#gradient-${dimension})`}
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, fill: `var(--color-${dimension})` }}
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            ))}

            {/* Zone avec dégradé pour le temps d'assistance (axe droit) */}
            {hasAssistanceTime && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="assistanceTime"
                stroke="var(--color-assistanceTime)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                fill="url(#gradient-assistanceTime)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--color-assistanceTime)' }}
                animationDuration={ANIMATION_DURATION}
                animationEasing={ANIMATION_EASING}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

