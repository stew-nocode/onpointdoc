/**
 * Données mockées pour le Gantt
 */

import { addDays, startOfMonth, endOfMonth, subDays } from 'date-fns';
import type { GanttItem, GanttRow } from './types';

/**
 * Génère des items Gantt mockés pour le mois en cours
 */
export function generateMockGanttItems(year: number, month: number): GanttItem[] {
  const items: GanttItem[] = [];
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(new Date(year, month, 1));

  // Générer quelques tâches
  for (let i = 0; i < 5; i++) {
    const startDate = addDays(monthStart, i * 5);
    const endDate = addDays(startDate, 3 + (i % 3));
    
    if (endDate <= monthEnd) {
      items.push({
        id: `task-gantt-${i}`,
        title: `Tâche Gantt ${i + 1}`,
        type: 'task',
        startDate,
        endDate,
        progress: (i % 3) * 33, // 0, 33, 66
        status: i % 3 === 0 ? 'A_faire' : i % 3 === 1 ? 'En_cours' : 'Termine',
        assignedTo: {
          id: `user-${(i % 3) + 1}`,
          fullName: `Agent ${(i % 3) + 1}`
        },
        color: '#3B82F6' // Bleu pour les tâches
      });
    }
  }

  // Générer quelques activités
  for (let i = 0; i < 4; i++) {
    const startDate = addDays(monthStart, i * 7);
    const endDate = addDays(startDate, 2 + (i % 2));
    
    if (endDate <= monthEnd) {
      items.push({
        id: `activity-gantt-${i}`,
        title: `Activité Gantt ${i + 1}`,
        type: 'activity',
        startDate,
        endDate,
        progress: i % 2 === 0 ? 50 : 100,
        status: i % 2 === 0 ? 'En_cours' : 'Termine',
        assignedTo: {
          id: `user-${(i % 2) + 1}`,
          fullName: `Manager ${(i % 2) + 1}`
        },
        color: '#8B5CF6' // Violet pour les activités
      });
    }
  }

  return items;
}

/**
 * Organise les items par personne assignée
 */
export function organizeGanttByPerson(items: GanttItem[]): GanttRow[] {
  const rowsMap = new Map<string, GanttItem[]>();

  items.forEach((item) => {
    const personName = item.assignedTo?.fullName || 'Non assigné';
    if (!rowsMap.has(personName)) {
      rowsMap.set(personName, []);
    }
    rowsMap.get(personName)!.push(item);
  });

  return Array.from(rowsMap.entries()).map(([label, items]) => ({
    id: `row-${label}`,
    label,
    items
  }));
}

