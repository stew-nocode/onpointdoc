'use client';

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { cn } from '@/lib/utils';
import { KPIMiniChart } from './kpi-mini-chart';
import { KPIIcon } from './kpi-icon';
import type { IconId } from '@/lib/utils/icon-map';

type KPICardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon | IconId; // Accepte soit une icône directement, soit un identifiant (recommandé: IconId)
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  chartData?: number[];
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  subtitle?: string; // Petite info supplémentaire (ex: "vs mois dernier")
};

/**
 * Composant Card KPI réutilisable pour le dashboard
 * Affiche une métrique avec icône, tendance, mini graphique et description
 * 
 * @param title - Titre du KPI
 * @param value - Valeur à afficher
 * @param description - Description optionnelle
 * @param icon - Icône Lucide React
 * @param trend - Tendance optionnelle (ex: { value: 12, isPositive: true })
 * @param chartData - Données pour le mini graphique (tableau de nombres)
 * @param variant - Variante de couleur
 * @param subtitle - Information supplémentaire (petit texte)
 * @param className - Classes CSS additionnelles
 */
export function KPICard({
  title,
  value,
  description,
  icon,
  trend,
  chartData,
  variant = 'default',
  subtitle,
  className
}: KPICardProps) {

  const variantStyles = {
    default: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
    success: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20',
    danger: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
    info: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
  };


  const trendIcon = trend ? (
    trend.value > 0 ? (
      <TrendingUp className={cn('h-3 w-3', trend.isPositive ? 'text-green-600' : 'text-red-600')} />
    ) : trend.value < 0 ? (
      <TrendingDown className={cn('h-3 w-3', trend.isPositive ? 'text-green-600' : 'text-red-600')} />
    ) : (
      <Minus className="h-3 w-3 text-slate-400" />
    )
  ) : null;

  return (
    <Card className={cn('transition-shadow hover:shadow-md flex flex-col min-w-0 w-full', variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 flex-shrink-0">
        <CardTitle className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          {title}
        </CardTitle>
        <KPIIcon icon={icon} variant={variant} />
      </CardHeader>
      <CardContent className="px-3 pb-3 flex-1 flex flex-col justify-center">
        <div className="space-y-1">
          {/* Ligne 1 : Valeur principale + Trend */}
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            </div>
            {trend && (
              <div className={cn(
                'flex items-center gap-0.5 text-[10px] font-medium',
                trend.isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              )}>
                {trendIcon}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {/* Ligne 2 : Mini chart (optionnel) */}
          {chartData && chartData.length > 0 && (
            <KPIMiniChart data={chartData} variant={variant} />
          )}
          {/* Ligne 3 : Description principale (toujours affichée) */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight min-h-[14px]">
            {description || '\u00A0'}
          </p>
          {/* Ligne 4 : Sous-titre (toujours affiché pour standardisation) */}
          <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight min-h-[12px]">
            {subtitle || '\u00A0'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

