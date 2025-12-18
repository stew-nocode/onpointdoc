'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMockItemsForDate } from './mock-data';
import { PlanningDayItem } from './planning-day-item';
import { CardHeader, CardTitle } from '@/ui/card';
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
    <div className="space-y-4">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
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

      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            {viewMode === 'starts'
              ? 'Aucune activité débutant pour cette date.'
              : 'Aucune tâche à échéance pour cette date.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <PlanningDayItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

