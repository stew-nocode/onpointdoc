'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createActivity, updateActivity } from '@/services/activities';
import type { CreateActivityInput, UpdateActivityInput } from '@/lib/validators/activity';

/**
 * Server Action pour créer une activité
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (créer une activité)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * 
 * @param values - Données du formulaire de création d'activité
 * @returns ID de l'activité créée
 * @throws Error si la création échoue ou si aucun ID n'est retourné
 */
export async function createActivityAction(values: CreateActivityInput): Promise<string> {
  const activityId = await createActivity(values);

  if (!activityId) {
    throw new Error('Aucun ID d\'activité retourné après création');
  }

  // Revalider la page activités
  revalidatePath('/gestion/activites');

  // OPTIMISATION (2025-12-15): Invalider le cache des KPIs
  revalidateTag('activity-kpis', 'max');

  return activityId;
}

/**
 * Server Action pour mettre à jour le compte rendu d'une activité
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (mettre à jour le compte rendu)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * 
 * @param activityId - ID de l'activité à mettre à jour
 * @param reportContent - Contenu du compte rendu (peut être null pour supprimer)
 * @returns ID de l'activité mise à jour
 * @throws Error si la mise à jour échoue
 */
export async function updateActivityReportAction(
  activityId: string,
  reportContent: string | null
): Promise<string> {
  const updatePayload: UpdateActivityInput = {
    id: activityId,
    reportContent
  };

  const updatedActivityId = await updateActivity(updatePayload);

  if (!updatedActivityId) {
    throw new Error('Aucun ID d\'activité retourné après mise à jour');
  }

  // Revalider la page activités et la page de détail
  revalidatePath('/gestion/activites');
  revalidatePath(`/gestion/activites/${activityId}`);

  // OPTIMISATION (2025-12-15): Invalider le cache des KPIs
  revalidateTag('activity-kpis', 'max');

  return updatedActivityId;
}

/**
 * Server Action pour changer le statut d'une activité
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (changer le statut)
 * - Utilise directement le service (pas d'API route intermédiaire)
 * - Utilise revalidatePath pour éviter router.refresh() côté client
 * 
 * @param activityId - ID de l'activité à mettre à jour
 * @param status - Nouveau statut de l'activité
 * @param actualDurationHours - Durée réelle en heures (obligatoire si status = 'Termine')
 * @returns ID de l'activité mise à jour
 * @throws Error si la mise à jour échoue
 */
export async function updateActivityStatusAction(
  activityId: string,
  status: 'Brouillon' | 'Planifie' | 'En_cours' | 'Termine' | 'Annule',
  actualDurationHours?: number
): Promise<string> {
  const updatePayload: UpdateActivityInput = {
    id: activityId,
    status
  };

  // Si le statut est "Terminé", ajouter la durée réelle (obligatoire)
  if (status === 'Termine') {
    if (!actualDurationHours || actualDurationHours <= 0) {
      throw new Error('La durée réelle est obligatoire pour terminer une activité');
    }
    updatePayload.actualDurationHours = actualDurationHours;
  }

  const updatedActivityId = await updateActivity(updatePayload);

  if (!updatedActivityId) {
    throw new Error('Aucun ID d\'activité retourné après mise à jour');
  }

  // Revalider la page activités et la page de détail
  revalidatePath('/gestion/activites');
  revalidatePath(`/gestion/activites/${activityId}`);
  revalidatePath('/planning'); // Revalider aussi le planning

  // OPTIMISATION (2025-12-15): Invalider le cache des KPIs
  revalidateTag('activity-kpis', 'max');

  return updatedActivityId;
}
