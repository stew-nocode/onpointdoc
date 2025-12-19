/**
 * Données mockées pour la disponibilité
 * 
 * Phase 1 : Mocké avec durées estimées simulées
 * Phase 6 : Remplacer par vraies données Supabase avec estimated_hours
 */

import { format, isWithinInterval } from 'date-fns';
import type { PersonAvailability } from './types';
import type { MockPlanningItem } from '../types';
import { getMockItemsForDate } from '../mock-data';

/**
 * Capacité par défaut en heures par jour
 */
const DEFAULT_CAPACITY = 8; // 8 heures/jour

/**
 * Génère des durées estimées mockées pour les items
 * 
 * Phase 6 : Remplacer par les vraies durées depuis Supabase
 */
function getMockEstimatedHours(item: MockPlanningItem): number {
  if (item.type === 'task') {
    // Tâches : 1-4 heures selon la priorité
    const priorityMultiplier = 
      item.priority === 'Urgente' ? 4 :
      item.priority === 'Haute' ? 3 :
      item.priority === 'Normale' ? 2 : 1;
    return priorityMultiplier;
  } else {
    // Activités : 2-6 heures selon le type
    const activityTypeHours: Record<string, number> = {
      'Revue': 2,
      'Brainstorm': 3,
      'Atelier': 4,
      'Presentation': 2,
      'Demo': 3,
      'Autre': 2
    };
    return activityTypeHours[item.activityType || 'Autre'] || 2;
  }
}

/**
 * Calcule la disponibilité pour une date donnée
 * 
 * Utilise l'Option 3 : Basée sur la durée estimée
 */
export function calculateAvailabilityForDate(
  selectedDate: Date,
  allPeople: Array<{ id: string; fullName: string; department?: string; role?: string }>
): PersonAvailability[] {
  const items = getMockItemsForDate(selectedDate);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Grouper les items par personne
  const peopleMap = new Map<string, PersonAvailability>();

  // Initialiser toutes les personnes comme disponibles
  allPeople.forEach((person) => {
    peopleMap.set(person.id, {
      id: person.id,
      fullName: person.fullName,
      department: person.department,
      role: person.role,
      totalHours: 0,
      capacity: DEFAULT_CAPACITY,
      utilizationRate: 0,
      status: 'available',
      items: {
        tasks: [],
        activities: []
      }
    });
  });

  // Calculer la charge pour chaque item
  items.forEach((item) => {
    const estimatedHours = getMockEstimatedHours(item);

    if (item.type === 'task' && item.assignedTo) {
      const person = peopleMap.get(item.assignedTo.id);
      if (person) {
        // Vérifier si la tâche est due ce jour
        const dueDateStr = format(new Date(item.dueDate), 'yyyy-MM-dd');
        if (dueDateStr === dateStr) {
          person.totalHours += estimatedHours;
          person.items.tasks.push({
            id: item.id,
            title: item.title,
            estimatedHours
          });
        }
      }
    } else if (item.type === 'activity' && item.participants) {
      // Pour les activités, toutes les personnes participantes sont occupées
      item.participants.forEach((participant) => {
        const person = peopleMap.get(participant.id);
        if (person) {
          // Vérifier si la date est dans la période de l'activité
          const startDate = new Date(item.plannedStart);
          const endDate = item.plannedEnd ? new Date(item.plannedEnd) : startDate;
          
          if (isWithinInterval(selectedDate, { start: startDate, end: endDate })) {
            person.totalHours += estimatedHours;
            person.items.activities.push({
              id: item.id,
              title: item.title,
              estimatedHours
            });
          }
        }
      });
    }
  });

  // Calculer le taux d'utilisation et le statut
  const result = Array.from(peopleMap.values()).map((person) => {
    person.utilizationRate = (person.totalHours / person.capacity) * 100;
    
    // Déterminer le statut
    if (person.totalHours === 0) {
      person.status = 'available';
    } else if (person.totalHours <= person.capacity) {
      person.status = 'busy';
    } else {
      person.status = 'overloaded';
    }

    return person;
  });

  // Trier : surchargés en premier, puis occupés, puis disponibles
  return result.sort((a, b) => {
    if (a.status === 'overloaded' && b.status !== 'overloaded') return -1;
    if (a.status !== 'overloaded' && b.status === 'overloaded') return 1;
    if (a.status === 'busy' && b.status === 'available') return -1;
    if (a.status === 'available' && b.status === 'busy') return 1;
    return b.totalHours - a.totalHours; // Par charge décroissante
  });
}

/**
 * Génère une liste mockée de personnes
 * 
 * Phase 6 : Remplacer par vraies données depuis Supabase
 */
export function getMockPeople(): Array<{ id: string; fullName: string; department?: string; role?: string }> {
  return [
    { id: 'user-1', fullName: 'Agent Mock 1', department: 'Support', role: 'agent' },
    { id: 'user-2', fullName: 'Manager Mock 1', department: 'Support', role: 'manager' },
    { id: 'user-3', fullName: 'Agent Mock 2', department: 'Marketing', role: 'agent' },
    { id: 'user-4', fullName: 'Agent Mock 3', department: 'IT', role: 'agent' },
  ];
}

