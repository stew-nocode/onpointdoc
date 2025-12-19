/**
 * Service pour récupérer la charge de travail d'une date donnée
 * 
 * Principe Clean Code :
 * - Séparation logique métier / accès données
 * - Gestion d'erreur avec ApplicationError
 * - Types explicites
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createError } from '@/lib/errors/types';
import { handleSupabaseError } from '@/lib/errors/handlers';

export type TaskWorkloadItem = {
  id: string;
  title: string;
  estimated_duration_hours: number | null;
};

export type WorkloadForDateResult = {
  totalHours: number;
  tasks: TaskWorkloadItem[];
};

/**
 * Récupère la charge de travail pour une date donnée
 * 
 * @param supabase - Client Supabase (serveur ou navigateur)
 * @param date - Date pour laquelle calculer la charge
 * @param assignedTo - ID de l'utilisateur assigné (optionnel, filtre par assigné si fourni)
 * @param excludeTaskId - ID de la tâche à exclure (pour édition)
 * @returns Charge de travail avec liste des tâches
 * @throws ApplicationError si une erreur survient
 */
export async function getWorkloadForDate(
  supabase: SupabaseClient,
  date: Date,
  assignedTo?: string,
  excludeTaskId?: string
): Promise<WorkloadForDateResult> {

  // Normaliser la date (début de journée pour comparaison)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  // Construire la requête
  let query = supabase
    .from('tasks')
    .select('id, title, estimated_duration_hours')
    .gte('start_date', startOfDay.toISOString())
    .lte('start_date', endOfDay.toISOString())
    .not('status', 'eq', 'Annule'); // Exclure les tâches annulées

  // Filtrer par assigné si fourni
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo);
  }

  // Exclure la tâche en cours d'édition si fournie
  if (excludeTaskId) {
    query = query.neq('id', excludeTaskId);
  }

  const { data, error } = await query;

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération de la charge de travail');
  }

  // Calculer le total
  const tasks = (data || []) as TaskWorkloadItem[];
  const totalHours = tasks.reduce(
    (sum, task) => sum + (task.estimated_duration_hours || 0),
    0
  );

  return {
    totalHours,
    tasks
  };
}

