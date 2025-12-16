'use client';

import { Bug, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
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
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-2">
          <Bug className="h-4 w-4" />
          BUG
        </CardTitle>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          Temps réel
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Total principal */}
        <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {total.toLocaleString('fr-FR')}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            tickets au total
          </div>
        </div>

        {/* Ouverts / Résolus */}
        <div className="grid grid-cols-2 gap-3">
          <StatLine
            icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            label="Ouverts"
            value={ouverts}
            percentage={total > 0 ? Math.round((ouverts / total) * 100) : 0}
            variant="warning"
          />
          <StatLine
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            label="Résolus"
            value={resolus}
            percentage={tauxResolution}
            variant="success"
          />
        </div>

        {/* Priorités critiques */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Priorités ouvertes
          </div>
          <div className="flex gap-3">
            <PriorityBadge label="Critical" count={critiquesOuverts} variant="critical" />
            <PriorityBadge label="High" count={highOuverts} variant="high" />
          </div>
        </div>

        {/* MTTR */}
        {mttrHeures !== null && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>MTTR moyen</span>
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatMTTR(mttrHeures)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === Sous-composants ===

type StatLineProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  percentage: number;
  variant: 'warning' | 'success';
};

function StatLine({ icon, label, value, percentage, variant }: StatLineProps) {
  const percentageColor = variant === 'success' 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {value.toLocaleString('fr-FR')}
        </div>
        <div className={cn('text-[10px] font-medium', percentageColor)}>
          {percentage}%
        </div>
      </div>
    </div>
  );
}

type PriorityBadgeProps = {
  label: string;
  count: number;
  variant: 'critical' | 'high';
};

function PriorityBadge({ label, count, variant }: PriorityBadgeProps) {
  const colors = {
    critical: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={cn(
      'flex-1 flex items-center justify-between px-3 py-1.5 rounded-md border',
      colors[variant]
    )}>
      <span className="text-[10px] font-medium">{label}</span>
      <span className="text-sm font-bold">{count}</span>
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


