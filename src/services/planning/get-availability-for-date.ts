/**
 * Service pour récupérer la disponibilité des utilisateurs pour une date donnée
 * 
 * Principe Clean Code :
 * - Séparation logique métier / accès données
 * - Gestion d'erreur avec ApplicationError
 * - Types explicites
 * - OPTIMISATION : 3 requêtes totales au lieu de N*2 requêtes par utilisateur
 * 
 * NOTE: Ce service est appelé avec un client service_role car il doit
 * accéder aux données de TOUS les utilisateurs (contourne les RLS).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { handleSupabaseError } from '@/lib/errors/handlers';

/**
 * Capacité par défaut en heures par jour
 * Utilisée si daily_capacity_hours n'est pas défini dans le profil
 */
const DEFAULT_CAPACITY = 8; // 8 heures/jour

export type AvailabilityItem = {
  id: string;
  title: string;
  estimatedHours: number;
};

export type PersonAvailability = {
  id: string;
  fullName: string;
  department: string | null;
  role: string | null;
  totalHours: number;
  capacity: number;
  utilizationRate: number;
  status: 'available' | 'busy' | 'overloaded';
  items: {
    tasks: AvailabilityItem[];
    activities: AvailabilityItem[];
  };
};

/**
 * Récupère la disponibilité de tous les utilisateurs internes pour une date donnée
 * 
 * OPTIMISATION : Au lieu de faire N*2 requêtes (1 pour tâches + 1 pour activités par utilisateur),
 * on fait 3 requêtes au total :
 * 1. Récupérer tous les utilisateurs
 * 2. Récupérer toutes les tâches de la date (avec assigned_to)
 * 3. Récupérer toutes les activités de la date (avec participants)
 * 
 * @param supabase - Client Supabase (service_role pour contourner RLS)
 * @param date - Date pour laquelle calculer la disponibilité
 * @returns Liste des utilisateurs avec leur disponibilité
 * @throws ApplicationError si une erreur survient
 */
export async function getAvailabilityForDate(
  supabase: SupabaseClient,
  date: Date
): Promise<PersonAvailability[]> {
  // Normaliser la date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  // === REQUÊTE 1 : Utilisateurs internes ===
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, department, role, daily_capacity_hours')
    .not('auth_uid', 'is', null)
    .neq('role', 'client')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (profilesError) {
    throw handleSupabaseError(profilesError, 'Erreur lors de la récupération des utilisateurs');
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // === REQUÊTE 2 : Toutes les tâches de la date ===
  const { data: allTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, estimated_duration_hours, assigned_to')
    .gte('start_date', startOfDay.toISOString())
    .lte('start_date', endOfDay.toISOString())
    .not('status', 'eq', 'Annule');

  if (tasksError) {
    throw handleSupabaseError(tasksError, 'Erreur lors de la récupération des tâches');
  }

  // === REQUÊTE 3 : Toutes les activités de la date avec leurs participants ===
  const { data: allActivities, error: activitiesError } = await supabase
    .from('activities')
    .select(`
      id, 
      title, 
      planned_start, 
      planned_end, 
      estimated_duration_hours,
      activity_participants(user_id)
    `)
    .gte('planned_start', startOfDay.toISOString())
    .lte('planned_start', endOfDay.toISOString())
    .not('status', 'eq', 'Annule');

  if (activitiesError) {
    throw handleSupabaseError(activitiesError, 'Erreur lors de la récupération des activités');
  }

  // === TRAITEMENT LOCAL : Agrégation par utilisateur ===
  
  // Map des tâches par utilisateur
  const tasksByUser = new Map<string, Array<{ id: string; title: string; hours: number }>>();
  for (const task of (allTasks || [])) {
    if (task.assigned_to) {
      const userTasks = tasksByUser.get(task.assigned_to) || [];
      userTasks.push({
        id: task.id,
        title: task.title,
        hours: task.estimated_duration_hours || 0
      });
      tasksByUser.set(task.assigned_to, userTasks);
    }
  }

  // Map des activités par utilisateur (via participants)
  const activitiesByUser = new Map<string, Array<{ id: string; title: string; hours: number }>>();
  for (const activity of (allActivities || [])) {
    // Calculer la durée de l'activité
    let durationHours = 0;
    if (activity.estimated_duration_hours !== null && activity.estimated_duration_hours > 0) {
      durationHours = activity.estimated_duration_hours;
    } else if (activity.planned_start && activity.planned_end) {
      try {
        const start = new Date(activity.planned_start);
        const end = new Date(activity.planned_end);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // Ajouter à chaque participant
    const participants = activity.activity_participants as Array<{ user_id: string }> | null;
    if (participants) {
      for (const participant of participants) {
        const userActivities = activitiesByUser.get(participant.user_id) || [];
        // Éviter les doublons (même activité)
        if (!userActivities.some(a => a.id === activity.id)) {
          userActivities.push({
            id: activity.id,
            title: activity.title,
            hours: durationHours
          });
          activitiesByUser.set(participant.user_id, userActivities);
        }
      }
    }
  }

  // === Construire le résultat final ===
  const availability: PersonAvailability[] = profiles.map((profile) => {
    const userTasks = tasksByUser.get(profile.id) || [];
    const userActivities = activitiesByUser.get(profile.id) || [];

    const taskHours = userTasks.reduce((sum, t) => sum + t.hours, 0);
    const activityHours = userActivities.reduce((sum, a) => sum + a.hours, 0);
    const totalHours = taskHours + activityHours;
    
    // Utiliser daily_capacity_hours du profil, ou DEFAULT_CAPACITY si non défini
    const capacity = profile.daily_capacity_hours ?? DEFAULT_CAPACITY;
    const utilizationRate = capacity > 0 ? (totalHours / capacity) * 100 : 0;

    // Déterminer le statut
    let status: 'available' | 'busy' | 'overloaded';
    if (totalHours === 0) {
      status = 'available';
    } else if (totalHours <= capacity) {
      status = 'busy';
    } else {
      status = 'overloaded';
    }

    return {
      id: profile.id,
      fullName: profile.full_name || 'Utilisateur sans nom',
      department: profile.department,
      role: profile.role,
      totalHours,
      capacity,
      utilizationRate,
      status,
      items: {
        tasks: userTasks.map(t => ({ id: t.id, title: t.title, estimatedHours: t.hours })),
        activities: userActivities.map(a => ({ id: a.id, title: a.title, estimatedHours: a.hours }))
      }
    };
  });

  // Trier : surchargés en premier, puis occupés, puis disponibles
  return availability.sort((a, b) => {
    if (a.status === 'overloaded' && b.status !== 'overloaded') return -1;
    if (a.status !== 'overloaded' && b.status === 'overloaded') return 1;
    if (a.status === 'busy' && b.status === 'available') return -1;
    if (a.status === 'available' && b.status === 'busy') return 1;
    return b.totalHours - a.totalHours;
  });
}

