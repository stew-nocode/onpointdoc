/**
 * Service pour calculer la charge de travail totale (tâches + activités) pour une date donnée
 * 
 * Principe Clean Code :
 * - Séparation logique métier / accès données
 * - Gestion d'erreur avec ApplicationError
 * - Types explicites
 * - Réutilise les services existants pour les tâches et activités
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getWorkloadForDate } from '@/services/tasks/get-workload-for-date';
import { getActivityWorkloadForDate } from '@/services/activities/get-workload-for-date';

export type TotalWorkloadResult = {
  totalHours: number;
  taskHours: number;
  activityHours: number;
  taskCount: number;
  activityCount: number;
};

/**
 * Calcule la charge de travail totale pour une date donnée (tâches + activités)
 * 
 * @param supabase - Client Supabase (serveur ou navigateur)
 * @param date - Date pour laquelle calculer la charge
 * @param userId - ID de l'utilisateur (pour filtrer par assigné/participant, optionnel)
 * @param excludeTaskId - ID de la tâche à exclure (pour édition, optionnel)
 * @param excludeActivityId - ID de l'activité à exclure (pour édition, optionnel)
 * @returns Charge de travail totale avec détails par type
 * @throws ApplicationError si une erreur survient
 */
export async function calculateTotalWorkload(
  supabase: SupabaseClient,
  date: Date,
  userId?: string,
  excludeTaskId?: string,
  excludeActivityId?: string
): Promise<TotalWorkloadResult> {
  
  // Récupérer la charge des tâches
  const taskWorkload = await getWorkloadForDate(
    supabase,
    date,
    userId, // assignedTo pour les tâches
    excludeTaskId
  );

  // Récupérer la charge des activités
  const activityWorkload = await getActivityWorkloadForDate(
    supabase,
    date,
    userId, // participantUserId pour les activités
    excludeActivityId
  );

  // Calculer le total
  const taskHours = taskWorkload.totalHours;
  const activityHours = activityWorkload.totalHours;
  const totalHours = taskHours + activityHours;

  return {
    totalHours,
    taskHours,
    activityHours,
    taskCount: taskWorkload.tasks.length,
    activityCount: activityWorkload.activities.length
  };
}



