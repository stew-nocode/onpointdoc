'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { TooltipContent } from '@/ui/tooltip';
import { StatItem } from './utils/stat-item';
import type { UserTicketStats } from '@/services/users/stats/user';

type UserStatsTooltipProps = {
  profileId: string | null;
  type: 'reporter' | 'assigned';
  /**
   * Indique si le tooltip est ouvert
   * Si fourni, le chargement des données se fera seulement quand isOpen = true
   */
  isOpen?: boolean;
};

/**
 * Charge les statistiques de l'utilisateur depuis l'API
 * 
 * Principe Clean Code - Fonction pure :
 * - Fonction pure sans effets de bord
 * - Gestion d'erreur centralisée
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
 * Principe Clean Code - Fonction pure :
 * - Fonction pure, déterministe
 * 
 * @param type - Type de stats (reporter ou assigned)
 * @returns Titre du tooltip
 */
function buildTooltipTitle(type: 'reporter' | 'assigned'): string {
  return type === 'reporter' ? 'Statistiques rapporteur' : 'Statistiques assigné';
}

/**
 * Affiche le loader pendant le chargement
 * 
 * Principe Clean Code - Composant simple et réutilisable
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
 * Principe Clean Code - Composant simple et réutilisable
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
 * Principe Clean Code - Composant de présentation pur
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
 * Principe Clean Code - Composant de présentation pur
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
 * ✅ OPTIMISÉ : Charge les données seulement quand le tooltip est ouvert (isOpen = true)
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher les stats dans un tooltip)
 * - Lazy loading : Charge les données seulement à la demande
 * - Mémorisation : Cache les données une fois chargées
 * - Gestion d'erreur robuste
 * 
 * Affiche selon le type :
 * - Reporter : tickets créés, créés ce mois
 * - Assigned : tickets assignés, en cours, résolus, en retard, taux de résolution
 * 
 * @param profileId - UUID du profil utilisateur
 * @param type - Type de stats (reporter ou assigned)
 * @param isOpen - Indique si le tooltip est ouvert (optionnel, pour lazy loading)
 */
export function UserStatsTooltip({ profileId, type, isOpen = false }: UserStatsTooltipProps) {
  const [stats, setStats] = useState<UserTicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false); // Mémoriser si les données ont déjà été chargées

  /**
   * ✅ OPTIMISÉ : Charger les données seulement quand le tooltip est ouvert
   * ET seulement une fois (mémorisation avec hasLoadedRef)
   */
  useEffect(() => {
    // Ne charger que si :
    // 1. Le tooltip est ouvert (isOpen = true)
    // 2. On a un profileId
    // 3. Les données n'ont pas encore été chargées
    if (!isOpen || !profileId || hasLoadedRef.current) {
      return;
    }

    /**
     * Charge les statistiques de l'utilisateur
     * 
     * Principe Clean Code - Fonction pure et async/await propre
     */
    async function loadStats(): Promise<void> {
      setIsLoading(true);
      try {
        const loadedStats = await fetchUserStats(profileId, type);
        setStats(loadedStats);
        hasLoadedRef.current = true; // Marquer comme chargé
      } catch (error) {
        // Erreur déjà gérée dans fetchUserStats (retourne null)
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [isOpen, profileId, type]); // Dépendances : isOpen, profileId, type

  if (!profileId) {
    return <ErrorState message="Utilisateur non défini" />;
  }

  // Afficher le loader seulement si on est en train de charger (tooltip ouvert)
  if (isLoading && isOpen) {
    return <LoadingState />;
  }

  // ✅ CRITIQUE : Si le tooltip n'est pas ouvert et n'a jamais été chargé, ne rien rendre
  // Cela évite le montage inutile du composant
  if (!isOpen && !hasLoadedRef.current) {
    return null;
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
