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
import { Eye, Edit, MessageSquare, Sparkles, Calendar } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Checkbox } from '@/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/ui/context-menu';
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
import { useAnalysisGenerator } from '@/hooks/n8n/use-analysis-generator';
import { AnalysisModal } from '@/components/n8n/analysis-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui/dialog';
import { CommentForm } from '../comments/comment-form';
import { addCommentAction } from '@/app/(main)/gestion/tickets/actions';
import { toast } from 'sonner';
import { CreateActivityFromTicketDialog } from '@/components/activities/create-activity-from-ticket-dialog';
import { useProfiles } from '@/hooks';
import { createActivityAction } from '@/app/(main)/gestion/activites/actions';

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
   * Permissions de sélection multiple
   * Si false, masque la checkbox de sélection
   */
  canSelectMultiple?: boolean;

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
  canSelectMultiple = true, // Par défaut, autoriser la sélection
  search,
  isColumnVisible
}: TicketRowProps) {
  // Wrappers pour compatibilité avec le code existant
  const getPriorityColor = getPriorityColorClass;
  const getInitials = getUserInitials;
  const getAvatarColor = getAvatarColorClass;

  // État pour gérer les modals depuis le menu contextuel
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const { open: analysisOpen, isLoading: analysisLoading, error: analysisError, analysis, openModal: openAnalysisModal, closeModal: closeAnalysisModal } = useAnalysisGenerator({
    context: 'ticket',
    id: ticket.id
  });
  
  // Charger les participants pour le formulaire d'activité (lazy loading)
  const { profiles: participants } = useProfiles({ enabled: showActivityDialog });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
    <tr
      key={ticket.id}
      id={ticket.id}
      data-ticket-id={ticket.id}
      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
    >
      {/* Checkbox de sélection - Masquée si canSelectMultiple est false */}
      {canSelectMultiple && (
      <td className="w-12 py-2.5 pr-2">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isTicketSelected(ticket.id)}
            onCheckedChange={() => toggleTicketSelection(ticket.id)}
            aria-label={`Sélectionner le ticket ${ticket.title}`}
          />
        </div>
      </td>
      )}

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
        {/* ✅ Desktop: visible au hover | Mobile: toujours visible */}
        <div className="flex items-center justify-end gap-1 
                        opacity-100 
                        md:opacity-0 md:group-hover:opacity-100 
                        transition-opacity">
          {/* Voir les détails */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/gestion/tickets/${ticket.id}`}
                className="inline-flex h-8 w-8 md:h-7 md:w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 touch-manipulation"
                aria-label="Voir les détails"
              >
                <Eye className="h-4 w-4 md:h-3.5 md:w-3.5" />
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
                  className="inline-flex h-8 w-8 md:h-7 md:w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 touch-manipulation"
                  aria-label="Éditer le ticket"
                  type="button"
                >
                  <Edit className="h-4 w-4 md:h-3.5 md:w-3.5" />
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
              <button
                onClick={() => setShowCommentDialog(true)}
                className="inline-flex h-8 w-8 md:h-7 md:w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 touch-manipulation"
                aria-label="Ajouter un commentaire"
                type="button"
              >
                <MessageSquare className="h-4 w-4 md:h-3.5 md:w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajouter un commentaire</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem asChild>
          <Link href={`/gestion/tickets/${ticket.id}`} className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Voir les détails
          </Link>
        </ContextMenuItem>
        
        {canEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleEdit(ticket.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Éditer
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuSeparator />
        <ContextMenuItem onClick={openAnalysisModal}>
          <Sparkles className="h-4 w-4 mr-2" />
          Générer une analyse IA
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => setShowCommentDialog(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Relance/Commentaire
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => setShowActivityDialog(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          Créer une activité
        </ContextMenuItem>
      </ContextMenuContent>
      
      {/* Modals pour les actions du menu contextuel - en dehors du ContextMenuContent */}
      <AnalysisModal
        open={analysisOpen}
        onOpenChange={closeAnalysisModal}
        isLoading={analysisLoading}
        error={analysisError}
        analysis={analysis}
        title="Analyse du ticket"
        context="ticket"
        id={ticket.id}
      />
      
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un commentaire</DialogTitle>
            <DialogDescription>
              Ajouter un commentaire au ticket : {ticket.title}
            </DialogDescription>
          </DialogHeader>
          <CommentForm 
            onSubmit={async (content: string, files?: File[], commentType?: 'comment' | 'followup') => {
              setIsSubmittingComment(true);
              try {
                const commentId = await addCommentAction(ticket.id, content, commentType || 'comment');
                if (files && files.length > 0) {
                  const { uploadCommentAttachments } = await import('@/services/tickets/comments/attachments.client');
                  await uploadCommentAttachments(commentId, files);
                }
                toast.success(commentType === 'followup' ? 'Relance ajoutée avec succès' : 'Commentaire ajouté avec succès');
                setShowCommentDialog(false);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du commentaire';
                toast.error(errorMessage);
                throw error;
              } finally {
                setIsSubmittingComment(false);
              }
            }} 
            isLoading={isSubmittingComment} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog pour créer une activité à partir du ticket */}
      <CreateActivityFromTicketDialog
        ticketId={ticket.id}
        participants={participants}
        onSubmit={createActivityAction}
        open={showActivityDialog}
        onOpenChange={setShowActivityDialog}
      />
    </ContextMenu>
  );
}

