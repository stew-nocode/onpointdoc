'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMockItemsForDate } from './mock-data';
import { PlanningDayItem } from './planning-day-item';
import { CardHeader, CardTitle } from '@/ui/card';
import { TooltipProvider } from '@/ui/tooltip';
import type { PlanningViewMode } from './planning-calendar';

type PlanningListProps = {
  selectedDate: Date;
  viewMode?: PlanningViewMode;
};

/**
 * Composant Liste des items du jour sélectionné
 * 
 * Affiche les tâches et activités selon le mode de vue :
 * - "starts" : activités avec planned_start ce jour
 * - "dueDates" : tâches avec due_date ce jour
 * Distinction visuelle entre tâches et activités
 */
export function PlanningList({ selectedDate, viewMode = 'starts' }: PlanningListProps) {
  const items = getMockItemsForDate(selectedDate);
  
  // Filtrer selon le mode de vue
  const filteredItems = items.filter((item) => {
    if (viewMode === 'starts') {
      // Mode "Débuts" : afficher uniquement les activités
      return item.type === 'activity';
    } else {
      // Mode "Échéances" : afficher uniquement les tâches
      return item.type === 'task';
    }
  });

  const formattedDate = format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex flex-col h-full">
      {/* Header fixe - même hauteur que les autres colonnes */}
      <CardHeader className="px-0 pb-4 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 mb-4">
        <CardTitle className="text-base text-slate-900 dark:text-slate-100">
          {capitalizedDate}
        </CardTitle>
        <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
          {filteredItems.length === 0
            ? viewMode === 'starts'
              ? 'Aucune activité débutant ce jour'
              : 'Aucune tâche à échéance ce jour'
            : `${filteredItems.length} ${filteredItems.length === 1 ? 'événement' : 'événements'} planifié${filteredItems.length > 1 ? 's' : ''}`}
        </p>
      </CardHeader>

      {/* Liste scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TooltipProvider delayDuration={300}>
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>
                {viewMode === 'starts'
                  ? 'Aucune activité débutant pour cette date.'
                  : 'Aucune tâche à échéance pour cette date.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {filteredItems.map((item) => (
                <PlanningDayItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

