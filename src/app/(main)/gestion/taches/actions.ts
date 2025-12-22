'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createTask, updateTask } from '@/services/tasks';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validators/task';

/**
 * Server Action pour créer une tâche
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (créer une tâche)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * 
 * @param values - Données du formulaire de création de tâche
 * @returns ID de la tâche créée
 * @throws Error si la création échoue ou si aucun ID n'est retourné
 */
export async function createTaskAction(values: CreateTaskInput): Promise<string> {
  const taskId = await createTask(values);

  if (!taskId) {
    throw new Error('Aucun ID de tâche retourné après création');
  }

  // Revalider la page tâches
  revalidatePath('/gestion/taches');

  // OPTIMISATION (2025-12-15): Invalider le cache des KPIs
  revalidateTag('task-kpis', 'max');

  return taskId;
}

/**
 * Server Action pour mettre à jour le compte rendu d'une tâche
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (mettre à jour le compte rendu)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * 
 * @param taskId - ID de la tâche à mettre à jour
 * @param reportContent - Contenu du compte rendu (peut être null pour supprimer)
 * @returns ID de la tâche mise à jour
 * @throws Error si la mise à jour échoue
 */
export async function updateTaskReportAction(
  taskId: string,
  reportContent: string | null
): Promise<string> {
  const updatePayload: UpdateTaskInput = {
    id: taskId,
    reportContent
  };

  const updatedTaskId = await updateTask(updatePayload);

  if (!updatedTaskId) {
    throw new Error('Aucun ID de tâche retourné après mise à jour');
  }

  // Revalider la page tâches et la page de détail
  revalidatePath('/gestion/taches');
  revalidatePath(`/gestion/taches/${taskId}`);
  revalidatePath('/planning'); // Revalider aussi le planning

  // OPTIMISATION (2025-12-15): Invalider le cache des KPIs
  revalidateTag('task-kpis', 'max');

  return updatedTaskId;
}

/**
 * Server Action pour changer le statut d'une tâche
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (changer le statut)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * 
 * @param taskId - ID de la tâche à mettre à jour
 * @param status - Nouveau statut de la tâche
 * @param actualDurationHours - Durée réelle en heures (obligatoire si status = 'Termine')
 * @returns ID de la tâche mise à jour
 * @throws Error si la mise à jour échoue
 */
export async function updateTaskStatusAction(
  taskId: string,
  status: 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque',
  actualDurationHours?: number
): Promise<string> {
  const updatePayload: UpdateTaskInput = {
    id: taskId,
    status
  };

  // Si le statut est "Terminé", ajouter la durée réelle (obligatoire)
  if (status === 'Termine') {
    if (!actualDurationHours || actualDurationHours <= 0) {
      throw new Error('La durée réelle est obligatoire pour terminer une tâche');
    }
    updatePayload.actualDurationHours = actualDurationHours;
  }

  const updatedTaskId = await updateTask(updatePayload);

  if (!updatedTaskId) {
    throw new Error('Aucun ID de tâche retourné après mise à jour');
  }

  // Revalider la page tâches et la page de détail
  revalidatePath('/gestion/taches');
  revalidatePath(`/gestion/taches/${taskId}`);
  revalidatePath('/planning'); // Revalider aussi le planning

  // OPTIMISATION (2025-12-15): Invalider le cache des KPIs
  revalidateTag('task-kpis', 'max');

  return updatedTaskId;
}
