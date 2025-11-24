'use client';

import useSWR from 'swr';
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
};

/**
 * Charge les statistiques du ticket depuis l'API
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
  jiraIssueKey
}: TicketStatsTooltipProps) {
  const { data: stats, isLoading } = useSWR<TicketStats | null>(
    ['ticket-stats', ticketId],
    () => fetchTicketStats(ticketId),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  const formattedDescription = formatDescription(description);

  if (isLoading) {
    return <LoadingState />;
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

