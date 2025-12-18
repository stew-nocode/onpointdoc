/**
 * Wrapper pour les charts entreprise avec largeurs minimales
 * 
 * Fournit deux variantes :
 * - Donut : pour les PieChart/Donut (320px min)
 * - Bar : pour les BarChart/AreaChart/LineChart (400px min)
 */

import { cn } from '@/lib/utils';
import { Card } from '@/ui/card';
import { 
  COMPANY_CHART_MIN_WIDTH_DONUT, 
  COMPANY_CHART_MIN_WIDTH_BAR,
  COMPANY_CHART_HEIGHT
} from './chart-constants';

type ChartWrapperProps = {
  children: React.ReactNode;
  variant?: 'donut' | 'bar';
  className?: string;
};

/**
 * Wrapper pour les charts avec largeur minimale et hauteur fixe
 * 
 * @param variant - 'donut' pour PieChart (320px) ou 'bar' pour Bar/Area/Line (400px)
 */
export function CompanyChartWrapper({ 
  children, 
  variant = 'donut',
  className 
}: ChartWrapperProps) {
  const minWidth = variant === 'donut' 
    ? COMPANY_CHART_MIN_WIDTH_DONUT 
    : COMPANY_CHART_MIN_WIDTH_BAR;

  return (
    <div
      className={cn(
        'flex-1', // Prend toute la largeur disponible si seul sur la ligne
        className
      )}
      style={{ 
        minWidth: `${minWidth}px`,
        height: `${COMPANY_CHART_HEIGHT + 120}px` // Hauteur fixe : chart (280px) + header (~120px)
      }}
    >
      {children}
    </div>
  );
}

