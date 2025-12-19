'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { cn } from '@/lib/utils';

/**
 * Props pour une statistique inline (ex: "En cours", "Résolus")
 */
type StatItemProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  percentage: number;
  color: 'amber' | 'emerald' | 'blue' | 'purple' | 'slate';
};

/**
 * Configuration des couleurs par variante
 */
const STAT_COLORS = {
  amber: 'text-amber-600 dark:text-amber-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  slate: 'text-slate-600 dark:text-slate-400',
} as const;

/**
 * Sous-composant : Affichage d'une statistique inline
 */
function StatItem({ icon, label, value, percentage, color }: StatItemProps) {
  // ✅ Protection contre les valeurs undefined/null
  const safeValue = typeof value === 'number' ? value : 0;
  const safePercentage = typeof percentage === 'number' ? percentage : 0;
  
  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-[10px] text-slate-600 dark:text-slate-400">
        {safeValue.toLocaleString('fr-FR')} {label}
      </span>
      <span className={cn('text-[9px] font-medium', STAT_COLORS[color])}>
        ({safePercentage}%)
      </span>
    </div>
  );
}

/**
 * Props pour la carte d'historique de tickets
 */
export type TicketHistoryCardBaseProps = {
  /** Type de ticket (BUG, REQ, ASSISTANCE) */
  ticketType: string;
  /** Icône du type de ticket */
  icon: LucideIcon;
  /** Nombre total de tickets */
  total: number;
  /** Label de description du total */
  totalLabel: string;
  /** Statistiques à afficher (max 2-3 pour rester lisible) */
  stats: Array<{
    icon: React.ReactNode;
    label: string;
    value: number;
    percentage: number;
    color: 'amber' | 'emerald' | 'blue' | 'purple' | 'slate';
  }>;
  /** Couleur de la bordure de la carte */
  borderColor: string;
  /** Couleur du titre */
  titleColor: string;
  /** Classe CSS additionnelle */
  className?: string;
};

/**
 * Composant de base réutilisable - Carte d'historique de tickets
 *
 * Affiche un résumé complet de l'historique d'un type de ticket :
 * - Total avec label
 * - Statistiques détaillées (en cours, résolus, etc.)
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */
export function TicketHistoryCardBase({
  ticketType,
  icon: Icon,
  total,
  totalLabel,
  stats,
  borderColor,
  titleColor,
  className,
}: TicketHistoryCardBaseProps) {
  // ✅ Protection contre les valeurs undefined/null
  const safeTotal = typeof total === 'number' ? total : 0;
  
  return (
    <Card
      className={cn(
        borderColor,
        'bg-white dark:bg-slate-950',
        'hover:shadow-md transition-shadow flex flex-col min-w-0 w-full',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 flex-shrink-0">
        <CardTitle
          className={cn(
            'text-[10px] font-medium uppercase tracking-wide flex items-center gap-1',
            titleColor
          )}
        >
          <Icon className="h-3 w-3" />
          {ticketType}
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
              {safeTotal.toLocaleString('fr-FR')}
            </div>
          </div>

          {/* Ligne 2 : Description du total */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            {totalLabel}
          </p>

          {/* Ligne 3 : Stats inline */}
          <div className="flex items-center gap-3 pt-0.5">
            {stats.map((stat, index) => (
              <StatItem key={index} {...stat} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton de chargement réutilisable
 */
export function TicketHistoryCardBaseSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-1 pt-3 px-3">
        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1">
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="flex gap-2 pt-0.5">
          <div className="h-3 flex-1 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-3 flex-1 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}







