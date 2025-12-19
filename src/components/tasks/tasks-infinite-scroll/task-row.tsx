'use client';

/**
 * Composant pour afficher une ligne de tâche dans le tableau
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (afficher une ligne de tâche)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * - Logique de présentation isolée
 * 
 * Pattern similaire à ActivityRow pour cohérence
 */

import React from 'react';
import Link from 'next/link';
import { Eye, Edit, User, Link2, Calendar, AlertCircle } from 'lucide-react';
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
  getTaskStatusBadgeVariant,
  formatDateShort,
  formatDateTimeFull,
  highlightText,
  getUserInitials,
  getAvatarColorClass,
  isTaskOverdue
} from '@/components/tasks/utils/task-display';
import type { TaskWithRelations } from '@/types/task-with-relations';
import type { TaskColumnId } from '@/lib/utils/task-column-preferences';

type TaskRowProps = {
  /**
   * Tâche à afficher
   */
  task: TaskWithRelations;

  /**
   * Fonction pour vérifier si la tâche est sélectionnée
   */
  isTaskSelected: (taskId: string) => boolean;

  /**
   * Fonction pour basculer la sélection de la tâche
   */
  toggleTaskSelection: (taskId: string) => void;

  /**
   * Fonction pour éditer la tâche
   */
  handleEdit: (taskId: string) => void;

  /**
   * Indique si l'utilisateur peut éditer la tâche
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
  visibleColumns: Set<TaskColumnId>;
};

/**
 * Composant pour afficher une ligne de tâche
 * 
 * Affiche les colonnes principales de la tâche avec leurs données formatées.
 * Gère les actions et les tooltips.
 * 
 * @param props - Propriétés du composant
 * @returns Élément <tr> représentant une ligne de tâche
 */
export function TaskRow({
  task,
  isTaskSelected,
  toggleTaskSelection,
  handleEdit,
  canEdit,
  canSelectMultiple = true,
  search,
  visibleColumns
}: TaskRowProps) {
  const getInitials = getUserInitials;
  const getAvatarColor = getAvatarColorClass;
  const overdue = isTaskOverdue(task.due_date, task.status);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          key={task.id}
          id={task.id}
          data-task-id={task.id}
          className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          {/* Checkbox de sélection - Masquée si canSelectMultiple est false */}
          {canSelectMultiple && (
            <td className="w-12 py-2.5 pr-2">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={isTaskSelected(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  aria-label={`Sélectionner la tâche ${task.title}`}
                />
              </div>
            </td>
          )}

          {/* Titre */}
          {visibleColumns.has('title') && (
            <td className="py-2.5 pr-4">
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href={`/gestion/taches/${task.id}`}
                  className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info truncate block max-w-[300px]"
                >
                  {search ? highlightText(task.title, search) : task.title}
                </Link>
              </div>
            </td>
          )}

          {/* Statut */}
          {visibleColumns.has('status') && (
            <td className="py-2.5 pr-4">
              <Badge
                variant={getTaskStatusBadgeVariant(task.status)}
                className="text-[10px] px-2 py-0.5 whitespace-nowrap"
              >
                {task.status?.replace('_', ' ') ?? 'Non défini'}
              </Badge>
            </td>
          )}

          {/* Date d'échéance */}
          {visibleColumns.has('due_date') && (
            <td className="py-2.5 pr-4">
              {task.due_date ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      {overdue && (
                        <AlertCircle className="h-3.5 w-3.5 text-status-danger" />
                      )}
                      <span className={`text-xs whitespace-nowrap ${overdue ? 'text-status-danger font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                        {formatDateShort(task.due_date)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{overdue ? '⚠️ En retard - ' : ''}{formatDateTimeFull(task.due_date)}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-slate-400">-</span>
              )}
            </td>
          )}

          {/* Assigné à */}
          {visibleColumns.has('assigned_to') && (
            <td className="py-2.5 pr-4">
              {task.assigned_user?.full_name ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${getAvatarColor(task.assigned_user.full_name)}`}
                      >
                        {getInitials(task.assigned_user.full_name)}
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                        {task.assigned_user.full_name}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assigné à: {task.assigned_user.full_name}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-slate-400">-</span>
              )}
            </td>
          )}

          {/* Créateur avec avatar */}
          {visibleColumns.has('creator') && (
            <td className="py-2.5 pr-4">
              {task.created_user?.full_name ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${getAvatarColor(task.created_user.full_name)}`}
                      >
                        {getInitials(task.created_user.full_name)}
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                        {task.created_user.full_name}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Créé par: {task.created_user.full_name}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-slate-400">-</span>
              )}
            </td>
          )}

          {/* Tickets liés */}
          {visibleColumns.has('linked_tickets') && (
            <td className="py-2.5 pr-4">
              {task.linked_tickets && task.linked_tickets.length > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {task.linked_tickets.length}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Tickets liés:</p>
                      {task.linked_tickets.map((ticket, idx) => (
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
          )}

          {/* Activités liées */}
          {visibleColumns.has('linked_activities') && (
            <td className="py-2.5 pr-4">
              {task.linked_activities && task.linked_activities.length > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {task.linked_activities.length}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Activités liées:</p>
                      {task.linked_activities.map((activity, idx) => (
                        <p key={idx} className="text-sm">
                          {activity?.title || `Activité ${activity?.id?.substring(0, 8)}`}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-slate-400">-</span>
              )}
            </td>
          )}

          {/* Date de création */}
          {visibleColumns.has('created_at') && (
            <td className="py-2.5 pr-4">
              {task.created_at ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDateShort(task.created_at)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatDateTimeFull(task.created_at)}</p>
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
                    href={`/gestion/taches/${task.id}`}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voir la tâche</p>
                </TooltipContent>
              </Tooltip>
              
              {canEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleEdit(task.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Éditer la tâche</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </td>
        </tr>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem asChild>
          <Link href={`/gestion/taches/${task.id}`} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            Voir la tâche
          </Link>
        </ContextMenuItem>
        {canEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleEdit(task.id)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Éditer la tâche
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
