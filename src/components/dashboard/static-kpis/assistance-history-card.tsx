'use client';

import { Headphones, Clock, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { cn } from '@/lib/utils';
import type { AssistanceHistoryStats } from '@/services/dashboard/assistance-history-stats';

type AssistanceHistoryCardProps = {
  data: AssistanceHistoryStats | null;
  className?: string;
};

/**
 * Carte KPI Statique - Historique des ASSISTANCE
 *
 * Affiche un résumé complet de l'historique des ASSISTANCE :
 * - Total des assistances
 * - Ouvertes (Nouveau + En_cours)
 * - Résolues directement par le Support
 * - Transférées vers IT (escalade JIRA)
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */
export function AssistanceHistoryCard({ data, className }: AssistanceHistoryCardProps) {
  if (!data) {
    return <AssistanceHistoryCardSkeleton className={className} />;
  }

  const { total, ouvertes, resolues, transferees, tauxResolutionDirecte, tauxTransfert } = data;

  // Calculer les pourcentages par rapport au total
  const pctOuvertes = total > 0 ? Math.round((ouvertes / total) * 100) : 0;
  const pctResolues = total > 0 ? Math.round((resolues / total) * 100) : 0;
  const pctTransferees = total > 0 ? Math.round((transferees / total) * 100) : 0;

  return (
    <Card className={cn(
      'border-teal-200 dark:border-teal-800/50 bg-white dark:bg-slate-950',
      'hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header compact */}
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
        <CardTitle className="text-[10px] font-medium text-teal-700 dark:text-teal-400 uppercase tracking-wide flex items-center gap-1">
          <Headphones className="h-3 w-3" />
          ASSISTANCE
        </CardTitle>
        <div className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          Temps réel
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 space-y-1.5">
        {/* Total - aligné à gauche comme BUG/REQ */}
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {total.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            assistances au total
          </div>
        </div>

        {/* Statuts sur une ligne - 3 métriques */}
        <div className="flex items-center gap-2 pt-1 text-[10px]">
          {/* Ouvertes */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {ouvertes.toLocaleString('fr-FR')}
            </span>
            <span className="text-slate-500 dark:text-slate-400">ouvertes</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              ({pctOuvertes}%)
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-600">|</span>

          {/* Résolues */}
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {resolues.toLocaleString('fr-FR')}
            </span>
            <span className="text-slate-500 dark:text-slate-400">résolues</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ({pctResolues}%)
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-600">|</span>

          {/* Transférées */}
          <div className="flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3 text-blue-500" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {transferees.toLocaleString('fr-FR')}
            </span>
            <span className="text-slate-500 dark:text-slate-400">transférées</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              ({pctTransferees}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton de chargement
 */
function AssistanceHistoryCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1.5">
        <div>
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-2.5 w-28 mt-1 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-4 flex-1 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export { AssistanceHistoryCardSkeleton };






