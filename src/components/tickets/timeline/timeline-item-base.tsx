'use client';

import { User } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils/date-formatter';
import { getUserDisplayName } from '@/lib/utils/user-display';
import type { TicketInteraction } from '@/services/tickets/comments';

type TimelineItemBaseProps = {
  icon: React.ReactNode;
  title: string;
  titleBadge?: React.ReactNode;
  content?: React.ReactNode;
  interaction: TicketInteraction;
};

/**
 * Composant de base pour un élément de timeline
 * Gère la structure commune (icône, ligne, titre, métadonnées utilisateur)
 * 
 * @param icon - Icône à afficher dans le cercle
 * @param title - Titre de l'interaction
 * @param titleBadge - Badge optionnel à côté du titre
 * @param content - Contenu optionnel (commentaire, badges de statut, etc.)
 * @param interaction - Données de l'interaction pour les métadonnées
 */
export function TimelineItemBase({
  icon,
  title,
  titleBadge,
  content,
  interaction
}: TimelineItemBaseProps) {
  return (
    <div className="flex gap-3 pb-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
        <div className="h-full w-0.5 bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
          </span>
          {titleBadge}
        </div>
        {content}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <User className="h-3 w-3" />
          <span>{getUserDisplayName(interaction.user)}</span>
          <span>•</span>
          <span>{formatRelativeDate(interaction.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

