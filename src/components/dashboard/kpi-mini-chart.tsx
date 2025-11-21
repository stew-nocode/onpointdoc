'use client';

import { cn } from '@/lib/utils';

type KPIMiniChartProps = {
  data: number[];
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

/**
 * Composant de mini graphique de tendance pour les cartes KPI
 * Affiche une ligne de tendance basique basée sur des données
 * 
 * @param data - Tableau de valeurs (5-10 points recommandés)
 * @param variant - Variante de couleur
 * @param className - Classes CSS additionnelles
 */
export function KPIMiniChart({ data, variant = 'default', className }: KPIMiniChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Normaliser les données pour qu'elles tiennent dans la zone du graphique
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Éviter division par zéro

  const width = 100;
  const height = 26; // Réduit de 40 à 26 (1/3 de réduction)
  const padding = 3;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculer les points de la ligne
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  const variantColors = {
    default: 'stroke-slate-400 fill-slate-50 dark:stroke-slate-500 dark:fill-slate-800/30',
    success: 'stroke-green-400 fill-green-50 dark:stroke-green-500 dark:fill-green-800/30',
    warning: 'stroke-orange-400 fill-orange-50 dark:stroke-orange-500 dark:fill-orange-800/30',
    danger: 'stroke-red-400 fill-red-50 dark:stroke-red-500 dark:fill-red-800/30',
    info: 'stroke-blue-400 fill-blue-50 dark:stroke-blue-500 dark:fill-blue-800/30'
  };

  return (
    <div className={cn('w-full h-6', className)}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Zone remplie sous la ligne */}
        <path
          d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          className={variantColors[variant]}
          opacity={0.3}
        />
        {/* Ligne de tendance */}
        <path
          d={pathData}
          className={variantColors[variant].split(' ')[0]}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

