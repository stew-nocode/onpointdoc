'use client';

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
 * Tableau des top 10 modules avec le plus de bugs
 * 
 * @param data - Liste des modules avec bugs
 * @param period - Période globale pour cohérence (utilisé par React.memo pour détecter les changements)
 */
export function TopBugsModulesTable({ data, period: _period }: TopBugsModulesTableProps) {
  if (data.length === 0) {
    return (
      <Card className="h-[420px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <SectionTitleWithDoc
            title="Top Modules avec BUGs"
            documentation={TOP_BUGS_MODULES_DOCUMENTATION}
          />
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">Aucun module avec des bugs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[420px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <SectionTitleWithDoc
          title="Top Modules avec BUGs"
          documentation={TOP_BUGS_MODULES_DOCUMENTATION}
        />
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-2">Module</th>
                <th className="text-left p-2">Produit</th>
                <th className="text-right p-2">BUGs</th>
                <th className="text-right p-2">Taux</th>
                <th className="text-right p-2">Tendance</th>
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
 */
function TopBugsModuleRow({
  module
}: {
  module: ProductHealthData['topBugModules'][0];
}) {
  const trendIcon = getTrendIcon(module.trend);
  const trendColor = module.trend > 0 ? 'text-red-600' : module.trend < 0 ? 'text-green-600' : 'text-slate-400';

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
      <td className="p-2 font-medium">{module.moduleName}</td>
      <td className="p-2 text-slate-600 dark:text-slate-400">{module.productName}</td>
      <td className="p-2 text-right">
        <Badge variant="danger">{module.bugCount}</Badge>
      </td>
      <td className="p-2 text-right text-slate-600 dark:text-slate-400">{module.bugRate}%</td>
      <td className="p-2 text-right">
        <div className={cn('flex items-center justify-end gap-1', trendColor)}>
          {trendIcon}
          <span className="text-xs">{Math.abs(module.trend)}%</span>
        </div>
      </td>
    </tr>
  );
}

/**
 * Retourne l'icône de tendance
 */
function getTrendIcon(trend: number) {
  if (trend > 0) return <TrendingUp className="h-3 w-3" />;
  if (trend < 0) return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

