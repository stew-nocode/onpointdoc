'use client';

import { FileText, Wrench, CheckCircle2 } from 'lucide-react';
import { TicketHistoryCardBase, TicketHistoryCardBaseSkeleton } from './ticket-history-card-base';
import type { ReqHistoryStats } from '@/services/dashboard/req-history-stats';
import { cn } from '@/lib/utils';

type ReqHistoryCardProps = {
  data: ReqHistoryStats | null;
  className?: string;
};

/**
 * Carte KPI Statique - Historique des REQ
 *
 * Affiche un résumé complet de l'historique des REQ :
 * - Total des requêtes
 * - En cours de développement
 * - Implémentées (terminées)
 *
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.1
 */
export function ReqHistoryCard({ data, className }: ReqHistoryCardProps) {
  if (!data) {
    return <ReqHistoryCardSkeleton className={className} />;
  }

  const { total, enCours, implementees, tauxImplementation } = data;

  // Calculer le pourcentage "en cours"
  const tauxEnCours = total > 0 ? Math.round((enCours / total) * 100) : 0;

  return (
    <TicketHistoryCardBase
      ticketType="REQ"
      icon={FileText}
      total={total}
      totalLabel="requêtes au total"
      stats={[
        {
          icon: <Wrench className="h-3 w-3 text-blue-500" />,
          label: 'en cours',
          value: enCours,
          percentage: tauxEnCours,
          color: 'blue',
        },
        {
          icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
          label: 'implémentées',
          value: implementees,
          percentage: tauxImplementation,
          color: 'emerald',
        },
      ]}
      borderColor="border-blue-200 dark:border-blue-800/50"
      titleColor="text-blue-700 dark:text-blue-400"
      className={className}
    />
  );
}

/**
 * Skeleton de chargement pour la carte REQ
 */
function ReqHistoryCardSkeleton({ className }: { className?: string }) {
  return <TicketHistoryCardBaseSkeleton className={cn('border-blue-200 dark:border-blue-800/50', className)} />;
}

export { ReqHistoryCardSkeleton };







