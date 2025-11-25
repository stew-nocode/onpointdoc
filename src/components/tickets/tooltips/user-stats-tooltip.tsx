'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { TooltipContent } from '@/ui/tooltip';
import { StatItem } from './utils/stat-item';
import type { UserTicketStats } from '@/services/users/stats/user';

type UserStatsTooltipProps = {
  profileId: string | null;
  type: 'reporter' | 'assigned';
};

/**
 * Charge les statistiques de l'utilisateur depuis l'API
 * 
 * @param profileId - UUID du profil utilisateur
 * @param type - Type de stats (reporter ou assigned)
 * @returns Statistiques de l'utilisateur ou null si erreur
 */
async function fetchUserStats(
  profileId: string,
  type: 'reporter' | 'assigned'
): Promise<UserTicketStats | null> {
  try {
    const response = await fetch(`/api/users/${profileId}/stats?type=${type}`);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    return null;
  }
}

/**
 * Construit le titre du tooltip selon le type
 * 
 * @param type - Type de stats (reporter ou assigned)
 * @returns Titre du tooltip
 */
function buildTooltipTitle(type: 'reporter' | 'assigned'): string {
  return type === 'reporter' ? 'Statistiques rapporteur' : 'Statistiques assigné';
}

/**
 * Affiche le loader pendant le chargement
 */
function LoadingState() {
  return (
    <TooltipContent className="max-w-xs" side="top">
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        <span className="text-xs text-slate-500">Chargement...</span>
      </div>
    </TooltipContent>
  );
}

/**
 * Affiche l'état d'erreur ou vide
 * 
 * @param message - Message à afficher
 */
function ErrorState({ message }: { message: string }) {
  return (
    <TooltipContent className="max-w-xs" side="top">
      <div className="py-1 text-xs text-slate-500">{message}</div>
    </TooltipContent>
  );
}

/**
 * Affiche les statistiques du rapporteur
 * 
 * @param stats - Statistiques de l'utilisateur
 */
function ReporterStats({ stats }: { stats: UserTicketStats }) {
  return (
    <>
      <StatItem label="Tickets créés" value={stats.totalTickets} />
      <StatItem label="Créés ce mois" value={stats.createdThisMonth} />
    </>
  );
}

/**
 * Affiche les statistiques de l'assigné
 * 
 * @param stats - Statistiques de l'utilisateur
 */
function AssignedStats({ stats }: { stats: UserTicketStats }) {
  return (
    <>
      <StatItem label="Tickets assignés" value={stats.totalTickets} />
      <StatItem label="Assignés ce mois" value={stats.assignedThisMonth} />
      <StatItem label="En cours" value={stats.inProgress} />
      <StatItem label="Résolus" value={stats.resolved} />
      <StatItem label="En retard" value={stats.overdue} />
      <StatItem label="Taux de résolution" value={stats.resolutionRate} suffix="%" />
    </>
  );
}

/**
 * Composant pour afficher les statistiques d'un utilisateur dans un tooltip
 * 
 * Affiche selon le type :
 * - Reporter : tickets créés, créés ce mois
 * - Assigned : tickets assignés, en cours, résolus, en retard, taux de résolution
 */
export function UserStatsTooltip({ profileId, type }: UserStatsTooltipProps) {
  const [stats, setStats] = useState<UserTicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    loadStats();
  }, [profileId, type]);

  /**
   * Charge les statistiques de l'utilisateur
   */
  async function loadStats(): Promise<void> {
    if (!profileId) return;

    setIsLoading(true);
    const loadedStats = await fetchUserStats(profileId, type);
    setStats(loadedStats);
    setIsLoading(false);
  }

  if (!profileId) {
    return <ErrorState message="Utilisateur non défini" />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!stats) {
    return <ErrorState message="Aucune statistique disponible" />;
  }

  const title = buildTooltipTitle(type);

  return (
    <TooltipContent className="max-w-xs" side="top">
      <div className="space-y-2 py-1">
        <p className="font-semibold text-sm mb-2 text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <div className="space-y-1.5">
          {type === 'reporter' ? (
            <ReporterStats stats={stats} />
          ) : (
            <AssignedStats stats={stats} />
          )}
        </div>
      </div>
    </TooltipContent>
  );
}

