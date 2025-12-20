'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ListChecks, CalendarDays, User, Users, Eye, FileText, Plus, MessageSquare, Settings } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { Tooltip, TooltipTrigger } from '@/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/ui/popover';
import { PlanningItemTooltip } from './planning-item-tooltip';
import { EditActivityReportDialog } from '@/components/activities/edit-activity-report-dialog';
import { updateActivityReportAction } from '@/app/(main)/gestion/activites/actions';
import { cn } from '@/lib/utils';
import type { MockPlanningItem } from './types';

type PlanningDayItemProps = {
  item: MockPlanningItem;
};

/**
 * Composant Item individuel dans la liste du jour
 * 
 * Affiche une tâche ou une activité avec :
 * - Badge de type (Tâche/Activité)
 * - Icône distinctive
 * - Informations principales
 * - Statut et priorité (pour tâches)
 */
export function PlanningDayItem({ item }: PlanningDayItemProps) {
  const isTask = item.type === 'task';
  const isActivity = item.type === 'activity';
  const router = useRouter();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Pour les activités : créer une tâche à partir de l'activité
  const handleCreateTaskFromActivity = () => {
    // Rediriger vers la page de gestion des tâches où l'utilisateur pourra créer une tâche
    // et la lier à cette activité
    router.push(`/gestion/taches?linkedActivityId=${item.id}`);
  };

  // Pour les activités : voir les détails (où on peut laisser un commentaire)
  const handleViewActivity = () => {
    router.push(`/gestion/activites/${item.id}`);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="p-3 transition-shadow hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Icône et Badge - compact */}
            <div className="flex items-center gap-2 shrink-0">
          {isTask ? (
            <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
              <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <div className="rounded-lg bg-purple-100 p-1.5 dark:bg-purple-900/30">
              <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          )}

              <Badge
                variant={isTask ? 'info' : 'outline'}
                className={cn(
                  'text-xs whitespace-nowrap',
                  isTask && 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
                  isActivity && 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                )}
              >
                {isTask ? 'Tâche' : 'Activité'}
              </Badge>
            </div>

            {/* Titre - prend l'espace disponible */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {item.title}
              </h3>
            </div>

            {/* Informations étalées horizontalement - responsive */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-400">
              {isTask && (
                <>
                  {item.assignedTo && (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <User className="h-3 w-3" />
                      <span className="hidden sm:inline">{item.assignedTo.fullName}</span>
                      <span className="sm:hidden">{item.assignedTo.fullName.split(' ')[0]}</span>
                    </div>
                  )}

                  {item.priority && (
                    <Badge
                      variant={
                        item.priority === 'Urgente' || item.priority === 'Haute'
                          ? 'danger'
                          : item.priority === 'Normale'
                            ? 'info'
                            : 'outline'
                      }
                      className="text-xs whitespace-nowrap"
                    >
                      {item.priority}
                    </Badge>
                  )}

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
                    className="text-xs whitespace-nowrap"
                  >
                    {item.status.replace('_', ' ')}
                  </Badge>
                </>
              )}

              {isActivity && (
                <>
                  {item.activityType && (
                    <span className="whitespace-nowrap">
                      <span className="font-medium">Type:</span> {item.activityType}
                    </span>
                  )}

                  {item.plannedEnd && (
                    <span className="whitespace-nowrap hidden md:inline">
                      <span className="font-medium">Période:</span>{' '}
                      {format(new Date(item.plannedStart), 'd MMM', { locale: fr })} →{' '}
                      {format(new Date(item.plannedEnd), 'd MMM yyyy', { locale: fr })}
                    </span>
                  )}

                  {item.participants && item.participants.length > 0 && (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <Users className="h-3 w-3" />
                      <span>
                        {item.participants.length}{' '}
                        {item.participants.length === 1 ? 'participant' : 'participants'}
                      </span>
                    </div>
                  )}

                  {item.status && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {item.status}
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Lien vers détail */}
            <Link
              href={isTask ? `/gestion/taches/${item.id}` : `/gestion/activites/${item.id}`}
              className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 shrink-0"
              aria-label={`Voir les détails de ${item.title}`}
              onClick={(e) => e.stopPropagation()}
            >
              →
            </Link>

            {/* Menu actions - uniquement pour les activités */}
            {isActivity && (
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
                        setShowReportDialog(true);
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
            )}
          </div>
        </Card>
        </TooltipTrigger>
        <PlanningItemTooltip item={item} />
      </Tooltip>

      {/* Dialog pour éditer le compte rendu (activités uniquement) */}
      {isActivity && (
        <EditActivityReportDialog
          activityId={item.id}
          currentReportContent={item.reportContent || null}
          onSubmit={async (reportContent) => {
            await updateActivityReportAction(item.id, reportContent);
          }}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
        />
      )}
    </>
  );
}

