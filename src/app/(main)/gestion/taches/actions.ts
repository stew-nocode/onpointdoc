'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createTask } from '@/services/tasks';
import type { CreateTaskInput } from '@/lib/validators/task';

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
