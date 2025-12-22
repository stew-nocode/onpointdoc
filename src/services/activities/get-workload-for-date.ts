/**
 * Service pour récupérer la charge de travail des activités pour une date donnée
 * 
 * Principe Clean Code :
 * - Séparation logique métier / accès données
 * - Gestion d'erreur avec ApplicationError
 * - Types explicites
 * 
 * Logique de calcul de durée :
 * - Pour le planning futur : utiliser estimated_duration_hours si disponible, sinon calculer depuis planned_end - planned_start
 * - La durée est calculée depuis planned_start (activité commence à cette date)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { handleSupabaseError } from '@/lib/errors/handlers';

export type ActivityWorkloadItem = {
  id: string;
  title: string;
  planned_start: string | null;
  planned_end: string | null;
  estimated_duration_hours: number | null;
  duration_hours: number; // Durée calculée (estimated_duration_hours ou depuis planned_end - planned_start)
};

export type ActivityWorkloadForDateResult = {
  totalHours: number;
  activities: ActivityWorkloadItem[];
};

/**
 * Calcule la durée d'une activité en heures
 * 
 * @param plannedStart - Date de début planifiée
 * @param plannedEnd - Date de fin planifiée
 * @param estimatedDurationHours - Durée estimée en heures (prioritaire si disponible)
 * @returns Durée en heures
 */
function calculateActivityDuration(
  plannedStart: string | null,
  plannedEnd: string | null,
  estimatedDurationHours: number | null
): number {
  // Priorité 1: Utiliser estimated_duration_hours si disponible
  if (estimatedDurationHours !== null && estimatedDurationHours > 0) {
    return estimatedDurationHours;
  }

  // Priorité 2: Calculer depuis planned_end - planned_start si les deux dates sont présentes
  if (plannedStart && plannedEnd) {
    try {
      const start = new Date(plannedStart);
      const end = new Date(plannedEnd);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60); // Convertir en heures
        return Math.max(0, diffHours);
      }
    } catch {
      // En cas d'erreur de parsing, retourner 0
    }
  }

  // Par défaut: 0 si aucune donnée disponible
  return 0;
}

/**
 * Récupère la charge de travail des activités pour une date donnée
 * 
 * Pour le planning, on filtre par planned_start dans la journée.
 * La durée est calculée selon la logique : estimated_duration_hours (prioritaire) ou planned_end - planned_start
 * 
 * @param supabase - Client Supabase (serveur ou navigateur)
 * @param date - Date pour laquelle calculer la charge (filtre par planned_start)
 * @param participantUserId - ID de l'utilisateur participant (optionnel, filtre par participation)
 * @param excludeActivityId - ID de l'activité à exclure (pour édition)
 * @returns Charge de travail avec liste des activités
 * @throws ApplicationError si une erreur survient
 */
export async function getActivityWorkloadForDate(
  supabase: SupabaseClient,
  date: Date,
  participantUserId?: string,
  excludeActivityId?: string
): Promise<ActivityWorkloadForDateResult> {

  // Normaliser la date (début de journée pour comparaison)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  // Construire la requête de base
  // Pour les activités, on filtre par planned_start dans la journée
  let query = supabase
    .from('activities')
    .select(`
      id,
      title,
      planned_start,
      planned_end,
      estimated_duration_hours
    `)
    .gte('planned_start', startOfDay.toISOString())
    .lte('planned_start', endOfDay.toISOString())
    .not('status', 'eq', 'Annule'); // Exclure les activités annulées

  // Filtrer par participant si fourni (via activity_participants)
  if (participantUserId) {
    // Utiliser une sous-requête pour filtrer par participation
    // Note: Supabase ne permet pas facilement de joindre activity_participants dans un select simple
    // On devra filtrer côté application ou utiliser une vue/function SQL
    // Pour l'instant, on récupère toutes les activités et on filtre côté application si nécessaire
    // TODO: Optimiser avec une jointure si nécessaire pour de meilleures performances
  }

  // Exclure l'activité en cours d'édition si fournie
  if (excludeActivityId) {
    query = query.neq('id', excludeActivityId);
  }

  const { data, error } = await query;

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération de la charge de travail des activités');
  }

  // Transformer les données et calculer les durées
  const activitiesRaw = (data || []) as Array<{
    id: string;
    title: string;
    planned_start: string | null;
    planned_end: string | null;
    estimated_duration_hours: number | null;
  }>;

  // Filtrer par participant si nécessaire (filtre côté application pour l'instant)
  let activitiesFiltered = activitiesRaw;
  if (participantUserId) {
    // Pour un filtrage efficace par participant, il faudrait une jointure SQL
    // Pour l'instant, on laisse toutes les activités (à améliorer avec une jointure si nécessaire)
    // TODO: Ajouter une jointure avec activity_participants pour un filtrage efficace
  }

  // Calculer les durées et transformer en ActivityWorkloadItem
  const activities: ActivityWorkloadItem[] = activitiesFiltered.map((activity) => {
    const durationHours = calculateActivityDuration(
      activity.planned_start,
      activity.planned_end,
      activity.estimated_duration_hours
    );

    return {
      id: activity.id,
      title: activity.title,
      planned_start: activity.planned_start,
      planned_end: activity.planned_end,
      estimated_duration_hours: activity.estimated_duration_hours,
      duration_hours: durationHours
    };
  });

  // Calculer le total
  const totalHours = activities.reduce(
    (sum, activity) => sum + activity.duration_hours,
    0
  );

  return {
    totalHours,
    activities
  };
}



