'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { TooltipContent } from '@/ui/tooltip';
import { StatItem } from './utils/stat-item';
import { formatRelativeDate } from './utils/format-stats';
import { parseADFToText } from '@/lib/utils/adf-parser';
import type { TicketStats } from '@/services/tickets/stats/ticket';

type TicketStatsTooltipProps = {
  ticketId: string;
  createdAt: string | null;
  title: string;
  description?: string | null;
  jiraIssueKey?: string | null;
  /**
   * Indique si le tooltip est ouvert
   * Si fourni, le chargement des données se fera seulement quand isOpen = true
   */
  isOpen?: boolean;
};

/**
 * Charge les statistiques du ticket depuis l'API
 * 
 * Principe Clean Code - Fonction pure :
 * - Fonction pure sans effets de bord
 * - Gestion d'erreur centralisée
 * 
 * @param ticketId - UUID du ticket
 * @returns Statistiques du ticket ou null si erreur
 */
async function fetchTicketStats(ticketId: string): Promise<TicketStats | null> {
  try {
    const response = await fetch(`/api/tickets/${ticketId}/stats`);

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
 * Formate la description pour l'affichage
 * 
 * Principe Clean Code - Fonction pure :
 * - Fonction pure et déterministe
 * 
 * @param description - Description du ticket (ADF ou texte)
 * @returns Description formatée et tronquée
 */
function formatDescription(description?: string | null): string | null {
  if (!description) return null;

  const descriptionText = parseADFToText(description);
  const truncatedText =
    descriptionText.length > 200 ? `${descriptionText.substring(0, 200)}...` : descriptionText;

  return truncatedText;
}

/**
 * Affiche le loader pendant le chargement
 * 
 * Principe Clean Code - Composant simple et réutilisable
 */
function LoadingState() {
  return (
    <TooltipContent className="max-w-md" side="top">
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        <span className="text-xs text-slate-500">Chargement...</span>
      </div>
    </TooltipContent>
  );
}

/**
 * Affiche les informations de base du ticket
 * 
 * Principe Clean Code - Composant de présentation pur
 * 
 * @param title - Titre du ticket
 * @param description - Description formatée
 * @param jiraIssueKey - Clé JIRA si présente
 */
function TicketInfo({
  title,
  description,
  jiraIssueKey
}: {
  title: string;
  description: string | null;
  jiraIssueKey: string | null;
}) {
  return (
    <>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-wrap">
          {description}
        </p>
      )}
      {jiraIssueKey && (
        <p className="text-xs text-slate-400 mt-1">Jira: {jiraIssueKey}</p>
      )}
    </>
  );
}

/**
 * Affiche les statistiques du ticket
 * 
 * Principe Clean Code - Composant de présentation pur
 * 
 * @param stats - Statistiques du ticket
 */
function TicketStats({ stats }: { stats: TicketStats }) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
      <p className="font-semibold text-xs mb-1.5 text-slate-700 dark:text-slate-300">
        Statistiques
      </p>
      <div className="space-y-1">
        <StatItem label="Commentaires" value={stats.commentsCount} />
        <StatItem label="Pièces jointes" value={stats.attachmentsCount} />
        <StatItem label="Âge" value={stats.ageInDays} suffix="jours" />
        <StatItem label="Changements de statut" value={stats.statusChangesCount} />
        {stats.lastUpdateDate && (
          <StatItem
            label="Dernière mise à jour"
            value={formatRelativeDate(stats.lastUpdateDate)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Composant pour afficher les statistiques d'un ticket dans un tooltip
 * 
 * ✅ OPTIMISÉ : Charge les données seulement quand le tooltip est ouvert (isOpen = true)
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher les stats dans un tooltip)
 * - Lazy loading : Charge les données seulement à la demande
 * - Mémorisation : Cache les données une fois chargées
 * - Gestion d'erreur robuste
 * 
 * Affiche :
 * - Titre et description du ticket
 * - Clé JIRA si présente
 * - Statistiques (commentaires, pièces jointes, âge, changements de statut)
 */
export function TicketStatsTooltip({
  ticketId,
  createdAt,
  title,
  description,
  jiraIssueKey,
  isOpen = false
}: TicketStatsTooltipProps) {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false); // Mémoriser si les données ont déjà été chargées

  /**
   * ✅ OPTIMISÉ : Charger les données seulement quand le tooltip est ouvert
   * ET seulement une fois (mémorisation avec hasLoadedRef)
   */
  useEffect(() => {
    // Ne charger que si :
    // 1. Le tooltip est ouvert (isOpen = true)
    // 2. Les données n'ont pas encore été chargées
    if (!isOpen || hasLoadedRef.current) {
      return;
    }

    /**
     * Charge les statistiques du ticket
     * 
     * Principe Clean Code - Fonction pure et async/await propre
     */
    async function loadStats(): Promise<void> {
      setIsLoading(true);
      try {
        const loadedStats = await fetchTicketStats(ticketId);
        setStats(loadedStats);
        hasLoadedRef.current = true; // Marquer comme chargé
      } catch (error) {
        // Erreur déjà gérée dans fetchTicketStats (retourne null)
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [isOpen, ticketId]); // Dépendances : isOpen, ticketId

  const formattedDescription = formatDescription(description);

  // Afficher le loader seulement si on est en train de charger (tooltip ouvert)
  if (isLoading && isOpen) {
    return <LoadingState />;
  }

  // ✅ CRITIQUE : Si le tooltip n'est pas ouvert et n'a jamais été chargé, ne rien rendre
  // Cela évite le montage inutile du composant
  if (!isOpen && !hasLoadedRef.current) {
    return null;
  }

  return (
    <TooltipContent className="max-w-md" side="top">
      <div className="space-y-2 py-1">
        <TicketInfo
          title={title}
          description={formattedDescription}
          jiraIssueKey={jiraIssueKey ?? null}
        />
        {stats && <TicketStats stats={stats} />}
      </div>
    </TooltipContent>
  );
}
