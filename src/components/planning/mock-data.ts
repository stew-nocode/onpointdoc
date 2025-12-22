/**
 * Données mockées pour le Planning
 * 
 * NOTE: Ce fichier n'est plus utilisé car le planning est maintenant connecté
 * à Supabase. Conservé pour compatibilité avec le Gantt et autres composants.
 * 
 * @deprecated Utilisez les services dans src/services/planning/
 */

import type { PlanningItem, PlanningTaskItem, PlanningActivityItem } from './types';

/**
 * Génère des dates mockées pour le mois en cours
 */
function getMockDatesForMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  for (let day = firstDay.getDate(); day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }
  
  return dates;
}

/**
 * Génère des tâches mockées pour le mois en cours
 * @deprecated Utilisez getPlanningItemsForDate depuis Supabase
 */
function generateMockTasks(year: number, month: number): PlanningTaskItem[] {
  const dates = getMockDatesForMonth(year, month);
  const tasks: PlanningTaskItem[] = [];
  
  // Générer 2-3 tâches par semaine
  dates.forEach((date, index) => {
    if (index % 3 === 0 || index % 5 === 0) {
      tasks.push({
        id: `task-${date.toISOString()}`,
        type: 'task',
        title: `Tâche mockée ${index + 1}`,
        status: index % 4 === 0 ? 'En_cours' : 'A_faire',
        priority: index % 3 === 0 ? 'Haute' : 'Normale',
        startDate: date.toISOString(),
        assignedTo: {
          id: 'user-1',
          fullName: 'Agent Mock'
        }
      });
    }
  });
  
  return tasks;
}

/**
 * Génère des activités mockées pour le mois en cours
 * @deprecated Utilisez getPlanningItemsForDate depuis Supabase
 */
function generateMockActivities(year: number, month: number): PlanningActivityItem[] {
  const dates = getMockDatesForMonth(year, month);
  const activities: PlanningActivityItem[] = [];
  
  // Générer 1-2 activités par semaine
  dates.forEach((date, index) => {
    if (index % 7 === 0 || index % 10 === 0) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + (index % 3)); // Durée variable
      
      activities.push({
        id: `activity-${date.toISOString()}`,
        type: 'activity',
        title: `Activité mockée ${index + 1}`,
        activityType: index % 2 === 0 ? 'Revue' : 'Atelier',
        status: 'Planifiée',
        plannedStart: startDate.toISOString(),
        plannedEnd: endDate.toISOString(),
        reportContent: index % 5 === 0 ? '<p>Compte rendu mocké</p>' : null,
        participants: [
          { id: 'user-1', fullName: 'Agent Mock' },
          { id: 'user-2', fullName: 'Manager Mock' }
        ]
      });
    }
  });
  
  return activities;
}

/**
 * Récupère tous les items (tâches + activités) pour un mois donné
 * @deprecated Utilisez getPlanningItemsForDate depuis Supabase
 */
export function getMockItemsForMonth(year: number, month: number): PlanningItem[] {
  const tasks = generateMockTasks(year, month);
  const activities = generateMockActivities(year, month);
  return [...tasks, ...activities];
}

/**
 * Récupère les items pour une date spécifique
 * @deprecated Utilisez getPlanningItemsForDate depuis Supabase
 */
export function getMockItemsForDate(date: Date): PlanningItem[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const allItems = getMockItemsForMonth(year, month);
  
  return allItems.filter((item) => {
    if (item.type === 'task') {
      // Tâche : inclure si startDate = date sélectionnée
      const itemDate = new Date(item.startDate);
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() === month &&
        itemDate.getDate() === day
      );
    } else {
      // Activité : inclure si date est dans [plannedStart, plannedEnd]
      const startDate = new Date(item.plannedStart);
      const endDate = item.plannedEnd ? new Date(item.plannedEnd) : startDate;
      
      // Normaliser les dates pour comparaison (sans heures)
      const selectedDateNormalized = new Date(year, month, day);
      const startNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return selectedDateNormalized >= startNormalized && selectedDateNormalized <= endNormalized;
    }
  });
}

/**
 * Récupère les dates qui ont des événements (pour surbrillance calendrier)
 * @deprecated Utilisez getPlanningDatesWithEvents depuis Supabase
 */
export function getMockDatesWithEvents(
  year: number, 
  month: number, 
  viewMode: 'starts' | 'dueDates' = 'starts'
): Date[] {
  const allItems = getMockItemsForMonth(year, month);
  const datesSet = new Set<string>();
  
  allItems.forEach((item) => {
    if (viewMode === 'dueDates' && item.type === 'task') {
      // Mode "Échéances" : afficher les startDate des tâches
      const date = new Date(item.startDate);
      datesSet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    } else if (viewMode === 'starts' && item.type === 'activity') {
      // Mode "Débuts" : afficher les planned_start des activités
      const date = new Date(item.plannedStart);
      datesSet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    }
  });
  
  return Array.from(datesSet).map((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m, d);
  });
}

