'use client';

/**
 * Composant pour afficher une ligne d'activité dans le tableau
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher une ligne d'activité)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * Pattern similaire à TicketRow pour cohérence
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, Users, Link2, Calendar, FileText } from 'lucide-react';
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
import {
  getActivityTypeIcon,
  getActivityStatusBadgeVariant,
  formatDateShort,
  formatDateTimeFull,
  highlightText,
  getUserInitials,
  getAvatarColorClass
} from '@/components/activities/utils/activity-display';
import type { ActivityWithRelations } from '@/types/activity-with-relations';
import type { ActivityColumnId } from '@/lib/utils/activity-column-preferences';
import { EditActivityReportDialog } from '@/components/activities/edit-activity-report-dialog';
import { updateActivityReportAction } from '@/app/(main)/gestion/activites/actions';

type ActivityRowProps = {
  /**
   * Activité à afficher
   */
  activity: ActivityWithRelations;

  /**
   * Fonction pour vérifier si l'activité est sélectionnée
   */
  isActivitySelected: (activityId: string) => boolean;

  /**
   * Fonction pour basculer la sélection de l'activité
   */
  toggleActivitySelection: (activityId: string) => void;

  /**
   * Fonction pour éditer l'activité
   */
  handleEdit: (activityId: string) => void;

  /**
   * Indique si l'utilisateur peut éditer l'activité
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
   * Colonnes visibles dans le tableau
   */
  visibleColumns: Set<ActivityColumnId>;
};

/**
 * Composant pour afficher une ligne d'activité
 * 
 * Affiche les colonnes principales de l'activité avec leurs données formatées.
 * Gère les actions et les tooltips.
 * 
 * @param props - Propriétés du composant
 * @returns Élément <tr> représentant une ligne d'activité
 */
export function ActivityRow({
  activity,
  isActivitySelected,
  toggleActivitySelection,
  handleEdit,
  canEdit,
  canSelectMultiple = true, // Par défaut, autoriser la sélection
  search,
  visibleColumns
}: ActivityRowProps) {
  const getInitials = getUserInitials;
  const getAvatarColor = getAvatarColorClass;
  
  // État pour contrôler l'ouverture du dialog de compte rendu
  const [showReportDialog, setShowReportDialog] = useState(false);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          key={activity.id}
          id={activity.id}
          data-activity-id={activity.id}
          className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          {/* Checkbox de sélection - Masquée si canSelectMultiple est false */}
          {canSelectMultiple && (
            <td className="w-12 py-2.5 pr-2">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={isActivitySelected(activity.id)}
                  onCheckedChange={() => toggleActivitySelection(activity.id)}
                  aria-label={`Sélectionner l'activité ${activity.title}`}
                />
              </div>
            </td>
          )}

          {/* Titre */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/gestion/activites/${activity.id}`}
                className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info truncate block max-w-[300px]"
              >
                {search ? highlightText(activity.title, search) : activity.title}
              </Link>
            </div>
          </td>

          {/* Type avec icône */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-1.5">
              {activity.activity_type && getActivityTypeIcon(activity.activity_type)}
              <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {activity.activity_type || '-'}
              </span>
            </div>
          </td>

          {/* Statut */}
          <td className="py-2.5 pr-4">
            <Badge
              variant={getActivityStatusBadgeVariant(activity.status)}
              className="text-[10px] px-2 py-0.5 whitespace-nowrap"
            >
              {activity.status?.replace('_', ' ') ?? 'Non défini'}
            </Badge>
          </td>

          {/* Dates planifiées */}
          <td className="py-2.5 pr-4">
            {activity.planned_start && activity.planned_end ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col text-xs text-slate-600 dark:text-slate-300">
                    <span className="whitespace-nowrap">
                      {formatDateShort(activity.planned_start)}
                    </span>
                    <span className="text-[10px] text-slate-400">→ {formatDateShort(activity.planned_end)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p><strong>Début:</strong> {formatDateTimeFull(activity.planned_start)}</p>
                    <p><strong>Fin:</strong> {formatDateTimeFull(activity.planned_end)}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">Non planifiée</span>
            )}
          </td>

          {/* Créateur avec avatar */}
          <td className="py-2.5 pr-4">
            {activity.created_user?.full_name ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${getAvatarColor(activity.created_user.full_name)}`}
                    >
                      {getInitials(activity.created_user.full_name)}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                      {activity.created_user.full_name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Créé par: {activity.created_user.full_name}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Participants */}
          <td className="py-2.5 pr-4">
            {activity.participants && activity.participants.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {activity.participants.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">Participants:</p>
                    {activity.participants.map((participant, idx) => (
                      <p key={idx} className="text-sm">
                        {participant.user?.full_name || `User ${participant.user_id.substring(0, 8)}`}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Tickets liés */}
          <td className="py-2.5 pr-4">
            {activity.linked_tickets && activity.linked_tickets.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {activity.linked_tickets.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">Tickets liés:</p>
                    {activity.linked_tickets.map((ticket, idx) => (
                      <p key={idx} className="text-sm">
                        {ticket?.jira_issue_key || ticket?.title || `Ticket ${ticket?.id?.substring(0, 8)}`}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Date de création */}
          {visibleColumns.has('created_at') && (
            <td className="py-2.5 pr-4">
              {activity.created_at ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDateShort(activity.created_at)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatDateTimeFull(activity.created_at)}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-slate-400">-</span>
              )}
            </td>
          )}

          {/* Actions */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/gestion/activites/${activity.id}`}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voir l'activité</p>
                </TooltipContent>
              </Tooltip>
              
              {canEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleEdit(activity.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Éditer l'activité</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </td>
        </tr>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem asChild>
          <Link href={`/gestion/activites/${activity.id}`} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            Voir l'activité
          </Link>
        </ContextMenuItem>
        {canEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleEdit(activity.id)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Éditer l'activité
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setShowReportDialog(true)} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              {activity.report_content ? 'Modifier le compte rendu' : 'Ajouter un compte rendu'}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>

      {/* Dialog pour éditer le compte rendu */}
      <EditActivityReportDialog
        activityId={activity.id}
        currentReportContent={activity.report_content}
        onSubmit={async (reportContent) => {
          await updateActivityReportAction(activity.id, reportContent);
        }}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </ContextMenu>
  );
}
