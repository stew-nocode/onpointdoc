'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, Users, Calendar, Clock, FileText } from 'lucide-react';
import { TooltipContent } from '@/ui/tooltip';
import { Separator } from '@/ui/separator';
import type { MockPlanningItem } from './types';

type PlanningItemTooltipProps = {
  item: MockPlanningItem;
};

/**
 * Tooltip détaillé pour un item du planning
 * 
 * Affiche toutes les informations complètes au survol :
 * - Pour les tâches : assigné, priorité, statut, date d'échéance, description
 * - Pour les activités : type, période, participants, statut, description
 */
export function PlanningItemTooltip({ item }: PlanningItemTooltipProps) {
  const isTask = item.type === 'task';
  const isActivity = item.type === 'activity';

  return (
    <TooltipContent className="max-w-sm" side="left">
      <div className="space-y-3">
        {/* Titre */}
        <div>
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            {item.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isTask ? 'Tâche' : 'Activité'}
          </p>
        </div>

        <Separator className="bg-slate-200 dark:bg-slate-700" />

        {/* Informations spécifiques selon le type */}
        {isTask && (
          <div className="space-y-2 text-xs">
            {item.assignedTo && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>
                  <span className="font-medium">Assigné à :</span> {item.assignedTo.fullName}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>
                <span className="font-medium">Échéance :</span>{' '}
                {format(new Date(item.dueDate), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
              </span>
            </div>

            {item.priority && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Priorité :</span>
                <span className="text-slate-600 dark:text-slate-400">{item.priority}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">Statut :</span>
              <span className="text-slate-600 dark:text-slate-400">
                {item.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {isActivity && (
          <div className="space-y-2 text-xs">
            {item.activityType && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>
                  <span className="font-medium">Type :</span> {item.activityType}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>
                <span className="font-medium">Début :</span>{' '}
                {format(new Date(item.plannedStart), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
              </span>
            </div>

            {item.plannedEnd && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>
                  <span className="font-medium">Fin :</span>{' '}
                  {format(new Date(item.plannedEnd), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
            )}

            {item.participants && item.participants.length > 0 && (
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <Users className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <span className="font-medium">Participants ({item.participants.length}) :</span>
                  <ul className="mt-1 space-y-0.5">
                    {item.participants.map((participant) => (
                      <li key={participant.id} className="text-slate-600 dark:text-slate-400">
                        • {participant.fullName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {item.status && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Statut :</span>
                <span className="text-slate-600 dark:text-slate-400">{item.status}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipContent>
  );
}

