'use client';

/**
 * Composant pour afficher l'en-tête du tableau des campagnes email
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (afficher l'en-tête du tableau)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * Pattern similaire à TasksTableHeader et ActivitiesTableHeader pour cohérence
 */

import React from 'react';
import type { CampaignSortColumn } from '@/types/campaign-sort';

type CampaignsTableHeaderProps = {
  /**
   * Tri actuel (pour afficher les indicateurs de tri)
   */
  sortColumn?: CampaignSortColumn;
  sortDirection?: 'asc' | 'desc';

  /**
   * Fonction pour changer le tri (optionnel, si tri cliquable)
   */
  onSortChange?: (column: CampaignSortColumn) => void;
};

/**
 * Composant pour afficher l'en-tête du tableau des campagnes
 * 
 * @param props - Propriétés du composant
 * @returns Élément <thead> représentant l'en-tête du tableau
 */
export function CampaignsTableHeader({
  sortColumn,
  sortDirection,
  onSortChange
}: CampaignsTableHeaderProps) {
  return (
    <thead className="border-b border-slate-200 dark:border-slate-800">
      <tr>
        {/* Nom de la campagne */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Nom
        </th>

        {/* Sujet */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Sujet
        </th>

        {/* Statut */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Statut
        </th>

        {/* Type */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Type
        </th>

        {/* Date d'envoi */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Date d&apos;envoi
        </th>

        {/* Destinataires */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Destinataires
        </th>

        {/* Ouvertures */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Ouvertures
        </th>

        {/* Clics */}
        <th className="pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Clics
        </th>

        {/* Actions - Toujours visible */}
        <th className="pb-2 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400" />
      </tr>
    </thead>
  );
}

