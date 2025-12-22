'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListChecks, CalendarDays, User, Users, Eye, FileText, Plus, MessageSquare, Settings, Edit } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Tooltip, TooltipTrigger } from '@/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/ui/popover';
import { PlanningItemTooltip } from './planning-item-tooltip';
import { EditActivityReportDialog, ChangeActivityStatusDialog } from '@/components/activities';
import { updateActivityReportAction, updateActivityStatusAction } from '@/app/(main)/gestion/activites/actions';
import { EditTaskReportDialog } from '@/components/tasks/edit-task-report-dialog';
import { ChangeTaskStatusDialog } from '@/components/tasks/change-task-status-dialog';
import { updateTaskReportAction, updateTaskStatusAction } from '@/app/(main)/gestion/taches/actions';
import { PlanningItemCard } from './planning-item-card';
import type { PlanningItem } from './types';

type PlanningDayItemProps = {
  item: PlanningItem;
};

/**
 * Composant Item individuel dans la liste du jour
 * 
 * Affiche une tâche ou une activité avec le layout standardisé :
 * - Icône distinctive à gauche
 * - Titre en haut sur une ligne
 * - Statut et personne en charge en bas
 * - Menu contextuel (roue) à droite
 */
export function PlanningDayItem({ item }: PlanningDayItemProps) {
  const isTask = item.type === 'task';
  const isActivity = item.type === 'activity';
  const router = useRouter();
  const [showActivityReportDialog, setShowActivityReportDialog] = useState(false);
  const [showActivityStatusDialog, setShowActivityStatusDialog] = useState(false);
  const [showTaskReportDialog, setShowTaskReportDialog] = useState(false);
  const [showTaskStatusDialog, setShowTaskStatusDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);

  // Pour les activités : créer une tâche à partir de l'activité
  const handleCreateTaskFromActivity = () => {
    router.push(`/gestion/taches?linkedActivityId=${item.id}`);
  };

  // Pour les activités : voir les détails (où on peut laisser un commentaire)
  const handleViewActivity = () => {
    router.push(`/gestion/activites/${item.id}`);
  };

  // Pour les tâches : voir les détails
  const handleViewTask = () => {
    router.push(`/gestion/taches/${item.id}`);
  };

  // Pour les tâches : voir les détails pour commenter
  const handleCommentTask = () => {
    router.push(`/gestion/taches/${item.id}#comments`);
  };

  // Pour les tâches : voir les détails pour changer le statut
  const handleChangeTaskStatus = () => {
    router.push(`/gestion/taches/${item.id}?edit=true`);
  };

  // Pour les tâches : voir les détails pour le compte rendu
  const handleEditTaskReport = () => {
    router.push(`/gestion/taches/${item.id}?edit=true`);
  };

  // Icône de distinction à gauche
  const icon = isTask ? (
    <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
      <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    </div>
  ) : (
    <div className="rounded-lg bg-purple-100 p-1.5 dark:bg-purple-900/30">
      <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
    </div>
  );

  // Contenu du bas (statut + personne en charge)
  const bottomContent = isTask ? (
    <>
      {/* Statut */}
      <Badge
        variant={
          item.status === 'Termine'
            ? 'success'
            : item.status === 'En_cours'
              ? 'info'
              : item.status === 'Bloque'
                ? 'danger'
                : 'outline'
        }
        className="text-[10px] px-1.5 py-0.5 whitespace-nowrap"
      >
        {item.status.replace('_', ' ')}
      </Badge>

      {/* Personne en charge */}
      {item.assignedTo && (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <User className="h-3 w-3" />
          <span className="hidden sm:inline">{item.assignedTo.fullName}</span>
          <span className="sm:hidden">{item.assignedTo.fullName.split(' ')[0]}</span>
        </div>
      )}
    </>
  ) : (
    <>
      {/* Statut */}
      {item.status && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">
          {item.status}
        </Badge>
      )}

      {/* Créateur de l'activité */}
      {item.createdBy && (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <User className="h-3 w-3" />
          <span className="hidden sm:inline">{item.createdBy.fullName}</span>
          <span className="sm:hidden">{item.createdBy.fullName.split(' ')[0]}</span>
        </div>
      )}

      {/* Nombre de participants */}
      {item.participants && item.participants.length > 0 && (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Users className="h-3 w-3" />
          <span>{item.participants.length}</span>
        </div>
      )}
    </>
  );

  // Menu contextuel pour les activités - à droite
  const activityMenu = isActivity ? (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          aria-label="Options de l&apos;activité"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <Link
            href={`/gestion/activites/${item.id}`}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
          >
            <Eye className="h-4 w-4" />
            Voir l&apos;activité
          </Link>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
          <button
            onClick={() => {
              handleCreateTaskFromActivity();
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left"
          >
            <Plus className="h-4 w-4" />
            Créer une tâche à partir
          </button>
          <button
            onClick={() => {
              setShowActivityReportDialog(true);
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left"
          >
            <FileText className="h-4 w-4" />
            {item.reportContent ? 'Modifier le compte rendu' : 'Laisser un compte rendu'}
          </button>
          <button
            onClick={() => {
              handleViewActivity();
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left"
          >
            <MessageSquare className="h-4 w-4" />
            Laisser un commentaire
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ) : undefined;

  // Menu contextuel pour les tâches - à droite
  const taskMenu = isTask ? (
    <Popover open={isTaskMenuOpen} onOpenChange={setIsTaskMenuOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={(e) => {
            e.stopPropagation();
            setIsTaskMenuOpen(!isTaskMenuOpen);
          }}
          aria-label="Options de la tâche"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <Link
            href={`/gestion/taches/${item.id}`}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            onClick={() => setIsTaskMenuOpen(false)}
          >
            <Eye className="h-4 w-4" />
            Voir les détails
          </Link>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
          <button
            onClick={() => {
              setShowTaskReportDialog(true);
              setIsTaskMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left"
          >
            <FileText className="h-4 w-4" />
            Compte rendu
          </button>
          <button
            onClick={() => {
              handleCommentTask();
              setIsTaskMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left"
          >
            <MessageSquare className="h-4 w-4" />
            Commenter
          </button>
          <button
            onClick={() => {
              setShowTaskStatusDialog(true);
              setIsTaskMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left"
          >
            <Edit className="h-4 w-4" />
            Changer de statut
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ) : undefined;

  // Menu contextuel (activités ou tâches)
  const menu = isActivity ? activityMenu : taskMenu;

  // Lien vers détail (action) - à droite
  const actions = (
    <Link
      href={isTask ? `/gestion/taches/${item.id}` : `/gestion/activites/${item.id}`}
      className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 shrink-0"
      aria-label={`Voir les détails de ${item.title}`}
      onClick={(e) => e.stopPropagation()}
    >
      →
    </Link>
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <PlanningItemCard
            icon={icon}
            title={item.title}
            bottomContent={bottomContent}
            menu={menu}
            actions={actions}
          />
        </TooltipTrigger>
        <PlanningItemTooltip item={item} />
      </Tooltip>

      {/* Dialog pour éditer le compte rendu (activités) */}
      {isActivity && (
        <EditActivityReportDialog
          activityId={item.id}
          currentReportContent={item.reportContent || null}
          onSubmit={async (reportContent) => {
            await updateActivityReportAction(item.id, reportContent);
          }}
          open={showActivityReportDialog}
          onOpenChange={setShowActivityReportDialog}
        />
      )}

      {/* Dialog pour changer le statut (activités) */}
      {isActivity && item.status && (
        <ChangeActivityStatusDialog
          activityId={item.id}
          currentStatus={item.status as 'Brouillon' | 'Planifie' | 'En_cours' | 'Termine' | 'Annule'}
          onSubmit={async (status: 'Brouillon' | 'Planifie' | 'En_cours' | 'Termine' | 'Annule', actualDurationHours?: number) => {
            await updateActivityStatusAction(item.id, status, actualDurationHours);
          }}
          open={showActivityStatusDialog}
          onOpenChange={setShowActivityStatusDialog}
        />
      )}

      {/* Dialog pour éditer le compte rendu (tâches) */}
      {isTask && (
        <EditTaskReportDialog
          taskId={item.id}
          currentReportContent={null} // TODO: Ajouter reportContent au type PlanningTaskItem si nécessaire
          onSubmit={async (reportContent) => {
            await updateTaskReportAction(item.id, reportContent);
          }}
          open={showTaskReportDialog}
          onOpenChange={setShowTaskReportDialog}
        />
      )}

      {/* Dialog pour changer le statut (tâches) */}
      {isTask && (
        <ChangeTaskStatusDialog
          taskId={item.id}
          currentStatus={item.status}
          onSubmit={async (status, actualDurationHours) => {
            await updateTaskStatusAction(item.id, status, actualDurationHours);
          }}
          open={showTaskStatusDialog}
          onOpenChange={setShowTaskStatusDialog}
        />
      )}
    </>
  );
}
