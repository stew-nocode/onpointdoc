'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ListChecks, CalendarDays, User, Users } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Card } from '@/ui/card';
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

  return (
    <Card className="p-4 transition-shadow hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
      <div className="flex items-start gap-4">
        {/* Icône et Badge */}
        <div className="flex flex-col items-center gap-2">
          {isTask ? (
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
              <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          )}

          <Badge
            variant={isTask ? 'info' : 'outline'}
            className={cn(
              'text-xs',
              isTask && 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
              isActivity && 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
            )}
          >
            {isTask ? 'Tâche' : 'Activité'}
          </Badge>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {item.title}
            </h3>

            {/* Informations spécifiques selon le type */}
            {isTask && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                {item.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{item.assignedTo.fullName}</span>
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
                    className="text-xs"
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
                  className="text-xs"
                >
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>
            )}

            {isActivity && (
              <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {item.activityType && (
                  <div>
                    <span className="font-medium">Type :</span> {item.activityType}
                  </div>
                )}

                {item.plannedEnd && (
                  <div>
                    <span className="font-medium">Période :</span>{' '}
                    {format(new Date(item.plannedStart), 'd MMM', { locale: fr })} →{' '}
                    {format(new Date(item.plannedEnd), 'd MMM yyyy', { locale: fr })}
                  </div>
                )}

                {item.participants && item.participants.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {item.participants.length}{' '}
                      {item.participants.length === 1 ? 'participant' : 'participants'}
                    </span>
                  </div>
                )}

                {item.status && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {item.status}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lien vers détail (placeholder) */}
        <Link
          href={isTask ? `/gestion/taches/${item.id}` : `/gestion/activites/${item.id}`}
          className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label={`Voir les détails de ${item.title}`}
        >
          →
        </Link>
      </div>
    </Card>
  );
}

