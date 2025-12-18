'use client';

import { Bug, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { cn } from '@/lib/utils';
import type { BugHistoryStats } from '@/services/dashboard/bug-history-stats';

type BugHistoryCardProps = {
  data: BugHistoryStats | null;
  className?: string;
};

/**
 * Carte KPI Statique - Historique des BUGs
 * 
 * Affiche un résumé complet de l'historique des BUGs :
 * - Total, Ouverts, Résolus avec pourcentages
 * - Critiques et High priority ouverts
 * - MTTR moyen
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */
export function BugHistoryCard({ data, className }: BugHistoryCardProps) {
  if (!data) {
    return <BugHistoryCardSkeleton className={className} />;
  }

  const { total, ouverts, resolus, tauxResolution, critiquesOuverts, highOuverts, mttrHeures } = data;

  return (
    <Card className={cn(
      'border-rose-200 dark:border-rose-800/50 bg-white dark:bg-slate-950',
      'hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header - même hauteur que KPICard standard */}
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
        <CardTitle className="text-[10px] font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1">
          <Bug className="h-3 w-3" />
          BUG
        </CardTitle>
        <div className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          Temps réel
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 flex-1 flex flex-col justify-center">
        <div className="space-y-1">
          {/* Ligne 1 : Total principal à gauche */}
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {total.toLocaleString('fr-FR')}
            </div>
          </div>

          {/* Ligne 2 : Description du total */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            tickets au total
          </p>

          {/* Ligne 3 : Stats Ouverts/Résolus inline */}
          <div className="flex items-center gap-3 pt-0.5">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {ouverts.toLocaleString('fr-FR')} ouverts
              </span>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                ({total > 0 ? Math.round((ouverts / total) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {resolus.toLocaleString('fr-FR')} résolus
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                ({tauxResolution}%)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// === Sous-composants ===

type CompactStatProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  percentage: number;
  variant: 'warning' | 'success';
};

/**
 * Statistique ultra compacte - format inline
 */
function CompactStat({ icon, label, value, percentage, variant }: CompactStatProps) {
  const percentageColor = variant === 'success' 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded px-2 py-1">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[9px] text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
          {value.toLocaleString('fr-FR')}
        </div>
        <div className={cn('text-[9px] font-medium', percentageColor)}>
          {percentage}%
        </div>
      </div>
    </div>
  );
}

type CompactPriorityBadgeProps = {
  label: string;
  count: number;
  variant: 'critical' | 'high';
};

/**
 * Badge de priorité ultra compact
 */
function CompactPriorityBadge({ label, count, variant }: CompactPriorityBadgeProps) {
  const colors = {
    critical: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={cn(
      'flex-1 flex items-center justify-between px-2 py-1 rounded border',
      colors[variant]
    )}>
      <span className="text-[9px] font-medium">{label}</span>
      <span className="text-xs font-bold">{count}</span>
    </div>
  );
}

/**
 * Formate le MTTR en heures/jours lisibles
 */
function formatMTTR(hours: number): string {
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.round(hours / 24);
  return `${days}j`;
}

/**
 * Skeleton de chargement
 */
function BugHistoryCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="text-center pb-2">
          <div className="h-8 w-20 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-24 mx-auto mt-2 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export { BugHistoryCardSkeleton };


