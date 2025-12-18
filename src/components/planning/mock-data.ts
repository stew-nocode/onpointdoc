/**
 * Données mockées pour le Planning
 * 
 * À remplacer par les vraies données Supabase dans la Phase 6
 */

import type { MockPlanningItem, MockPlanningTask, MockPlanningActivity } from './types';

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
 */
function generateMockTasks(year: number, month: number): MockPlanningTask[] {
  const dates = getMockDatesForMonth(year, month);
  const tasks: MockPlanningTask[] = [];
  
  // Générer 2-3 tâches par semaine
  dates.forEach((date, index) => {
    if (index % 3 === 0 || index % 5 === 0) {
      tasks.push({
        id: `task-${date.toISOString()}`,
        type: 'task',
        title: `Tâche mockée ${index + 1}`,
        status: index % 4 === 0 ? 'En_cours' : 'A_faire',
        priority: index % 3 === 0 ? 'Haute' : 'Normale',
        dueDate: date.toISOString(),
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
 */
function generateMockActivities(year: number, month: number): MockPlanningActivity[] {
  const dates = getMockDatesForMonth(year, month);
  const activities: MockPlanningActivity[] = [];
  
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
 */
export function getMockItemsForMonth(year: number, month: number): MockPlanningItem[] {
  const tasks = generateMockTasks(year, month);
  const activities = generateMockActivities(year, month);
  return [...tasks, ...activities];
}

/**
 * Récupère les items pour une date spécifique
 */
export function getMockItemsForDate(date: Date): MockPlanningItem[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const allItems = getMockItemsForMonth(year, month);
  
  return allItems.filter((item) => {
    if (item.type === 'task') {
      const itemDate = new Date(item.dueDate);
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() === month &&
        itemDate.getDate() === day
      );
    } else {
      const itemDate = new Date(item.plannedStart);
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() === month &&
        itemDate.getDate() === day
      );
    }
  });
}

/**
 * Récupère les dates qui ont des événements (pour surbrillance calendrier)
 * 
 * @param year - Année
 * @param month - Mois (0-11)
 * @param viewMode - Mode de vue : 'starts' pour activités, 'dueDates' pour tâches
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
      // Mode "Échéances" : afficher les due_date des tâches
      const date = new Date(item.dueDate);
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

