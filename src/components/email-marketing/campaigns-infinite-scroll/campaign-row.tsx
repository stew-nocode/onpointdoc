'use client';

/**
 * Composant pour afficher une ligne de campagne email dans le tableau
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (afficher une ligne de campagne)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * Pattern similaire à TaskRow et ActivityRow pour cohérence
 */

import React from 'react';
import Link from 'next/link';
import { Eye, MousePointerClick, Send } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/ui/context-menu';
import {
  getCampaignStatusBadgeVariant,
  getCampaignStatusLabel,
  getCampaignTypeBadgeVariant,
  getCampaignTypeLabel,
  formatDateShort,
  formatDateTimeFull,
  formatPercentage,
  formatNumber,
  highlightText
} from '@/components/email-marketing/utils/campaign-display';
import type { BrevoEmailCampaign } from '@/types/brevo';

type CampaignRowProps = {
  /**
   * Campagne à afficher
   */
  campaign: BrevoEmailCampaign;

  /**
   * Terme de recherche pour surligner le texte
   */
  search?: string;
};

/**
 * Composant pour afficher une ligne de campagne
 * 
 * @param props - Propriétés du composant
 * @returns Élément <tr> représentant une ligne de campagne
 */
export function CampaignRow({
  campaign,
  search
}: CampaignRowProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          key={campaign.id}
          id={campaign.id}
          data-campaign-id={campaign.id}
          className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          {/* Nom de la campagne */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/marketing/email/${campaign.id}`}
                className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info truncate block max-w-[200px]"
              >
                {search ? highlightText(campaign.campaign_name, search) : campaign.campaign_name}
              </Link>
            </div>
          </td>

          {/* Sujet */}
          <td className="py-2.5 pr-4">
            {campaign.email_subject ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[200px]">
                    {search && campaign.email_subject ? highlightText(campaign.email_subject, search) : campaign.email_subject}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{campaign.email_subject}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Statut */}
          <td className="py-2.5 pr-4">
            <Badge
              variant={getCampaignStatusBadgeVariant(campaign.status || 'draft')}
              className="text-[10px] px-2 py-0.5 whitespace-nowrap"
            >
              {getCampaignStatusLabel(campaign.status || 'draft')}
            </Badge>
          </td>

          {/* Type */}
          <td className="py-2.5 pr-4">
            <Badge
              variant={getCampaignTypeBadgeVariant(campaign.campaign_type || 'classic')}
              className="text-[10px] px-2 py-0.5 whitespace-nowrap"
            >
              {getCampaignTypeLabel(campaign.campaign_type || 'classic')}
            </Badge>
          </td>

          {/* Date d'envoi */}
          <td className="py-2.5 pr-4">
            {campaign.sent_at ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatDateShort(campaign.sent_at)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatDateTimeFull(campaign.sent_at)}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Destinataires (emails envoyés) */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {formatNumber(campaign.emails_sent)}
              </span>
            </div>
          </td>

          {/* Ouvertures (nombre + taux) */}
          <td className="py-2.5 pr-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {formatNumber(campaign.unique_opens)}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatPercentage(campaign.open_rate)}
              </span>
            </div>
          </td>

          {/* Clics (nombre + taux) */}
          <td className="py-2.5 pr-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {formatNumber(campaign.unique_clicks)}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatPercentage(campaign.click_rate)}
              </span>
            </div>
          </td>

          {/* Actions */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/marketing/email/${campaign.id}`}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voir la campagne</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </td>
        </tr>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem asChild>
          <Link href={`/marketing/email/${campaign.id}`} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            Voir la campagne
          </Link>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

