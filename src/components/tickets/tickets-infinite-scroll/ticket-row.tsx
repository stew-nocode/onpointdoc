'use client';

/**
 * Composant pour afficher une ligne de ticket dans le tableau
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher une ligne de ticket)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * ✅ PHASE 5 - ÉTAPE 4 : Composant extrait pour réduire la complexité du composant parent
 * ✅ OPTIMISÉ : Tooltips avec lazy loading (chargement seulement à l'ouverture)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Checkbox } from '@/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';
import { getStatusBadgeVariant } from '@/lib/utils/ticket-status';
import {
  highlightText,
  getTicketTypeIcon,
  getPriorityColorClass,
  getUserInitials,
  getAvatarColorClass
} from '@/components/tickets/utils/ticket-display';
import type { TicketWithRelations } from '@/types/ticket-with-relations';
import type { ColumnId } from '@/lib/utils/column-preferences';
import { TicketStatsTooltip } from '../tooltips/ticket-stats-tooltip';
import { UserStatsTooltip } from '../tooltips/user-stats-tooltip';
import { LazyTooltipWrapper } from '../tooltips/lazy-tooltip-wrapper';
import { AnalysisButton } from '@/components/n8n/analysis-button';
import { AddCommentDialog } from '../add-comment-dialog';

type TicketRowProps = {
  /**
   * Ticket à afficher
   */
  ticket: TicketWithRelations;

  /**
   * Fonction pour vérifier si le ticket est sélectionné
   */
  isTicketSelected: (ticketId: string) => boolean;

  /**
   * Fonction pour basculer la sélection du ticket
   */
  toggleTicketSelection: (ticketId: string) => void;

  /**
   * Fonction pour éditer le ticket
   */
  handleEdit: (ticketId: string) => void;

  /**
   * Indique si l'utilisateur peut éditer le ticket
   */
  canEdit: boolean;

  /**
   * Terme de recherche pour surligner le texte
   */
  search?: string;

  /**
   * Fonction pour vérifier si une colonne est visible
   */
  isColumnVisible: (columnId: ColumnId) => boolean;
};

/**
 * Composant pour afficher une ligne de ticket
 * 
 * Affiche toutes les colonnes du ticket avec leurs données formatées.
 * Gère la sélection, les actions et les tooltips.
 * 
 * @param props - Propriétés du composant
 * @returns Élément <tr> représentant une ligne de ticket
 */
export function TicketRow({
  ticket,
  isTicketSelected,
  toggleTicketSelection,
  handleEdit,
  canEdit,
  search,
  isColumnVisible
}: TicketRowProps) {
  // Wrappers pour compatibilité avec le code existant
  const getPriorityColor = getPriorityColorClass;
  const getInitials = getUserInitials;
  const getAvatarColor = getAvatarColorClass;

  return (
    <tr
      key={ticket.id}
      id={ticket.id}
      data-ticket-id={ticket.id}
      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
    >
      {/* Checkbox de sélection */}
      <td className="w-12 py-2.5 pr-2">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isTicketSelected(ticket.id)}
            onCheckedChange={() => toggleTicketSelection(ticket.id)}
            aria-label={`Sélectionner le ticket ${ticket.title}`}
          />
        </div>
      </td>

      {/* Titre avec tooltip */}
      {isColumnVisible('title') && (
        <td className="py-2.5 pr-4">
          <LazyTooltipWrapper
            trigger={
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href={`/gestion/tickets/${ticket.id}`}
                  className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info truncate block max-w-[300px]"
                >
                  {search ? highlightText(ticket.title, search) : ticket.title}
                </Link>
              </div>
            }
            content={
              <TicketStatsTooltip
                ticketId={ticket.id}
                createdAt={ticket.created_at}
                title={ticket.title}
                description={ticket.description}
                jiraIssueKey={ticket.jira_issue_key ?? null}
              />
            }
          />
        </td>
      )}

      {/* Type avec icône */}
      {isColumnVisible('type') && (
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-1.5">
            {getTicketTypeIcon(ticket.ticket_type)}
            <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {ticket.ticket_type}
            </span>
          </div>
        </td>
      )}

      {/* Statut */}
      {isColumnVisible('status') && (
        <td className="py-2.5 pr-4">
          <Badge
            variant={getStatusBadgeVariant(ticket.status)}
            className="text-[10px] px-2 py-0.5 whitespace-nowrap"
          >
            {ticket.status.replace('_', ' ')}
          </Badge>
        </td>
      )}

      {/* Priorité avec couleur */}
      {isColumnVisible('priority') && (
        <td className="py-2.5 pr-4">
          <span className={`text-xs font-medium capitalize whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority}
          </span>
        </td>
      )}

      {/* Canal */}
      {isColumnVisible('canal') && (
        <td className="py-2.5 pr-4">
          <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {ticket.canal || '-'}
          </span>
        </td>
      )}

      {/* Entreprise */}
      {isColumnVisible('company') && (
        <td className="py-2.5 pr-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[150px]">
                {ticket.company?.name || '-'}
              </span>
            </TooltipTrigger>
            {ticket.company?.name && (
              <TooltipContent>
                <p>{ticket.company.name}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </td>
      )}

      {/* Produit */}
      {isColumnVisible('product') && (
        <td className="py-2.5 pr-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[120px]">
                {ticket.product?.name || '-'}
              </span>
            </TooltipTrigger>
            {ticket.product?.name && (
              <TooltipContent>
                <p>{ticket.product.name}</p>
                {ticket.module?.name && <p className="text-xs text-slate-400 mt-1">Module: {ticket.module.name}</p>}
              </TooltipContent>
            )}
          </Tooltip>
        </td>
      )}

      {/* Module */}
      {isColumnVisible('module') && (
        <td className="py-2.5 pr-4">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[120px]">
            {ticket.module?.name || '-'}
          </span>
        </td>
      )}

      {/* Jira */}
      {isColumnVisible('jira') && (
        <td className="py-2.5 pr-4">
          {ticket.jira_issue_key ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                  {ticket.jira_issue_key}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ticket Jira: {ticket.jira_issue_key}</p>
                <p className="text-xs text-slate-400 mt-1">Origine: {ticket.origin || 'Supabase'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-slate-400 text-xs">-</span>
          )}
        </td>
      )}

      {/* Date de création */}
      {isColumnVisible('created_at') && (
        <td className="py-2.5 pr-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {ticket.created_at
                  ? new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : '-'}
              </span>
            </TooltipTrigger>
            {ticket.created_at && (
              <TooltipContent>
                <p>
                  {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </td>
      )}

      {/* Rapporteur avec avatar */}
      {isColumnVisible('reporter') && (
        <td className="py-2.5 pr-4">
          {ticket.created_user?.full_name ? (
            <LazyTooltipWrapper
              trigger={
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${getAvatarColor(ticket.created_user.full_name)}`}
                  >
                    {getInitials(ticket.created_user.full_name)}
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                    {ticket.created_user.full_name}
                  </span>
                </div>
              }
              content={
                <UserStatsTooltip
                  profileId={ticket.created_by ?? null}
                  type="reporter"
                />
              }
            />
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </td>
      )}

      {/* Assigné avec avatar */}
      {isColumnVisible('assigned') && (
        <td className="py-2.5 pr-4">
          {ticket.assigned_user?.full_name ? (
            <LazyTooltipWrapper
              trigger={
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${getAvatarColor(ticket.assigned_user.full_name)}`}
                  >
                    {getInitials(ticket.assigned_user.full_name)}
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                    {ticket.assigned_user.full_name}
                  </span>
                </div>
              }
              content={
                <UserStatsTooltip
                  profileId={ticket.assigned_to ?? null}
                  type="assigned"
                />
              }
            />
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </td>
      )}

      {/* Actions */}
      <td className="py-2.5 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Voir les détails */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/gestion/tickets/${ticket.id}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Voir les détails"
              >
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voir les détails</p>
            </TooltipContent>
          </Tooltip>

          {/* Éditer - Admin/Manager uniquement */}
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleEdit(ticket.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  aria-label="Éditer le ticket"
                  type="button"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Éditer</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Générer une analyse - Tous les utilisateurs authentifiés */}
          <AnalysisButton
            context="ticket"
            id={ticket.id}
            tooltip="Générer une analyse IA"
          />

          {/* Ajouter un commentaire */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <AddCommentDialog ticketId={ticket.id} ticketTitle={ticket.title} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajouter un commentaire</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

