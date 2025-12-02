'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/ui/card';
import { Badge } from '@/ui/badge';
import type { ProductHealthData, Period } from '@/types/dashboard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionTitleWithDoc } from '@/components/dashboard/section-title-with-doc';
import { TOP_BUGS_MODULES_DOCUMENTATION } from '@/components/dashboard/dashboard-documentation-content';

type TopBugsModulesTableProps = {
  data: ProductHealthData['topBugModules'];
  period: Period; // Période globale pour cohérence (utilisé par React.memo)
};

/**
 * Type explicite pour un module avec toutes les métriques
 * Remplace l'utilisation de 'as any' pour améliorer la type safety
 */
type ModuleWithMetrics = ProductHealthData['topBugModules'][0] & {
  bugsSignales: number;
  bugsCritiques: number;
  criticalRate: number;
  bugsOuverts: number;
  bugsResolus: number;
  resolutionRate: number;
  trends: {
    bugsSignales: number;
    criticalRate: number;
    bugsOuverts: number;
    bugsResolus: number;
    resolutionRate: number;
  };
};

/**
 * Tableau des modules par période avec métriques de bugs détaillées
 * 
 * @param data - Liste des modules avec métriques de bugs
 * @param period - Période globale pour cohérence (utilisé par React.memo pour détecter les changements)
 */
export function TopBugsModulesTable({ data, period: _period }: TopBugsModulesTableProps) {
  if (data.length === 0) {
    return (
      <Card className="h-[420px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <SectionTitleWithDoc
            title="Modules par Période"
            documentation={TOP_BUGS_MODULES_DOCUMENTATION}
          />
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">Aucun module avec des bugs dans cette période</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[420px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <SectionTitleWithDoc
          title="Modules par Période"
          documentation={TOP_BUGS_MODULES_DOCUMENTATION}
        />
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[84px]" />
              <col className="w-[98px]" />
              <col className="w-[91px]" />
              <col className="w-[84px]" />
              <col className="w-[84px]" />
              <col className="w-[98px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Module</th>
                <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Bug signalé</th>
                <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">% Critique</th>
                <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Ouvert</th>
                <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Résolu</th>
                <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">Taux résolution</th>
              </tr>
            </thead>
            <tbody>
              {data.map((module) => (
                <TopBugsModuleRow key={module.moduleId} module={module} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Ligne du tableau pour un module
 * 
 * Optimisé avec React.memo() selon les recommandations Context7
 * pour éviter les re-renders inutiles quand les props n'ont pas changé
 */
const TopBugsModuleRow = memo(function TopBugsModuleRow({
  module
}: {
  module: ProductHealthData['topBugModules'][0];
}) {
  // Vérifier si les nouvelles métriques sont disponibles
  const hasNewMetrics = 'bugsSignales' in module && 'trends' in module;
  
  if (!hasNewMetrics) {
    // Fallback pour compatibilité avec l'ancien format
    const trendIcon = getTrendIcon(module.trend);
    const trendColor = getTrendColor(module.trend);
    
    return (
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
        <td className="p-3 font-medium text-slate-900 dark:text-slate-100 align-middle">
          <span className="block truncate max-w-[84px]" title={module.moduleName}>
            {module.moduleName}
          </span>
        </td>
      <td className="p-3 text-left align-middle">
        <Badge variant="danger">{module.bugCount}</Badge>
      </td>
      <td className="p-3 text-left text-slate-600 dark:text-slate-400 align-middle">-</td>
      <td className="p-3 text-left text-slate-600 dark:text-slate-400 align-middle">-</td>
      <td className="p-3 text-left text-slate-600 dark:text-slate-400 align-middle">-</td>
      <td className="p-3 text-left text-slate-600 dark:text-slate-400 align-middle font-medium">{module.bugRate}%</td>
      </tr>
    );
  }

  // Type explicite - Remplace 'as any' pour améliorer la type safety
  const moduleWithMetrics = module as ModuleWithMetrics;

  const {
    bugsSignales = 0,
    criticalRate = 0,
    bugsOuverts = 0,
    bugsResolus = 0,
    resolutionRate = 0,
    trends = {
      bugsSignales: 0,
      criticalRate: 0,
      bugsOuverts: 0,
      bugsResolus: 0,
      resolutionRate: 0
    }
  } = moduleWithMetrics;

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
      <td className="p-3 font-medium text-slate-900 dark:text-slate-100 align-middle">
        <span className="block truncate max-w-[84px]" title={module.moduleName}>
          {module.moduleName}
        </span>
      </td>
      <td className="p-3 text-left align-middle">
        <MetricWithTrend value={bugsSignales} trend={trends.bugsSignales} showBadge />
      </td>
      <td className="p-3 text-left align-middle">
        <MetricWithTrend value={`${criticalRate}%`} trend={trends.criticalRate} />
      </td>
      <td className="p-3 text-left align-middle">
        <MetricWithTrend value={bugsOuverts} trend={trends.bugsOuverts} />
      </td>
      <td className="p-3 text-left align-middle">
        <MetricWithTrend value={bugsResolus} trend={trends.bugsResolus} />
      </td>
      <td className="p-3 text-left align-middle">
        <MetricWithTrend value={`${resolutionRate}%`} trend={trends.resolutionRate} />
      </td>
    </tr>
  );
}, areModulePropsEqual);

/**
 * Composant pour afficher une métrique avec sa tendance
 * 
 * Optimisé avec useMemo pour mémoriser le calcul de la couleur de tendance
 */
function MetricWithTrend({
  value,
  trend,
  showBadge = false
}: {
  value: number | string;
  trend: number;
  showBadge?: boolean;
}) {
  // Mémoriser le calcul de la couleur selon les recommandations Context7
  const trendColor = useMemo(() => getTrendColor(trend, true), [trend]);
  const trendIcon = useMemo(() => getTrendIcon(trend), [trend]);

  return (
    <div className="flex items-center justify-start gap-1.5 min-w-0 w-full">
      <span className="text-slate-900 dark:text-slate-100 font-medium whitespace-nowrap tabular-nums">
        {showBadge ? <Badge variant="danger">{value}</Badge> : value}
      </span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {trend !== 0 ? (
          <>
            <span className={cn(trendColor)}>{trendIcon}</span>
            <span className={cn('text-[10px] font-medium tabular-nums', trendColor)}>{Math.abs(trend)}%</span>
          </>
        ) : (
          <span className="text-slate-300 dark:text-slate-600 text-[10px] font-light opacity-60">—</span>
        )}
      </div>
    </div>
  );
}

/**
 * Retourne l'icône de tendance
 */
function getTrendIcon(trend: number) {
  if (trend > 0) return <TrendingUp className="h-2 w-2" />;
  if (trend < 0) return <TrendingDown className="h-2 w-2" />;
  return <Minus className="h-2 w-2" />;
}

/**
 * Retourne la classe CSS de couleur pour la tendance
 * 
 * Fonction utilitaire extraite pour respecter DRY (Don't Repeat Yourself)
 * 
 * @param trend - Valeur de la tendance (positive, négative ou nulle)
 * @param withDarkMode - Si true, inclut les classes dark mode
 * @returns Classe CSS Tailwind pour la couleur de tendance
 */
function getTrendColor(trend: number, withDarkMode = false): string {
  if (trend > 0) {
    return withDarkMode 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-red-600';
  }
  if (trend < 0) {
    return withDarkMode 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-green-600';
  }
  return withDarkMode 
    ? 'text-slate-400 dark:text-slate-500' 
    : 'text-slate-400';
}

/**
 * Fonction de comparaison personnalisée pour React.memo()
 * 
 * Compare les props pour déterminer si le composant doit re-render
 * Optimise les performances en évitant les re-renders inutiles
 * 
 * @param prevProps - Props précédentes
 * @param nextProps - Props suivantes
 * @returns true si les props sont identiques (pas de re-render), false sinon
 */
function areModulePropsEqual(
  prevProps: { module: ProductHealthData['topBugModules'][0] },
  nextProps: { module: ProductHealthData['topBugModules'][0] }
): boolean {
  const prev = prevProps.module;
  const next = nextProps.module;

  // Comparaison basique sur l'ID du module
  if (prev.moduleId !== next.moduleId) {
    return false;
  }

  // Vérifier si les nouvelles métriques sont disponibles dans les deux
  const prevHasNewMetrics = 'bugsSignales' in prev && 'trends' in prev;
  const nextHasNewMetrics = 'bugsSignales' in next && 'trends' in next;

  if (prevHasNewMetrics !== nextHasNewMetrics) {
    return false;
  }

  // Si pas de nouvelles métriques, comparer les anciennes
  if (!prevHasNewMetrics) {
    return (
      prev.moduleName === next.moduleName &&
      prev.bugCount === next.bugCount &&
      prev.bugRate === next.bugRate &&
      prev.trend === next.trend
    );
  }

  // Comparaison des nouvelles métriques
  const prevMetrics = prev as ModuleWithMetrics;
  const nextMetrics = next as ModuleWithMetrics;

  return (
    prevMetrics.moduleName === nextMetrics.moduleName &&
    prevMetrics.bugsSignales === nextMetrics.bugsSignales &&
    prevMetrics.criticalRate === nextMetrics.criticalRate &&
    prevMetrics.bugsOuverts === nextMetrics.bugsOuverts &&
    prevMetrics.bugsResolus === nextMetrics.bugsResolus &&
    prevMetrics.resolutionRate === nextMetrics.resolutionRate &&
    prevMetrics.trends.bugsSignales === nextMetrics.trends.bugsSignales &&
    prevMetrics.trends.criticalRate === nextMetrics.trends.criticalRate &&
    prevMetrics.trends.bugsOuverts === nextMetrics.trends.bugsOuverts &&
    prevMetrics.trends.bugsResolus === nextMetrics.trends.bugsResolus &&
    prevMetrics.trends.resolutionRate === nextMetrics.trends.resolutionRate
  );
}

