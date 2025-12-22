/**
 * Service pour récupérer les items de planning (tâches + activités) pour une date donnée
 * 
 * Principe Clean Code :
 * - Séparation logique métier / accès données
 * - Gestion d'erreur avec ApplicationError
 * - Types explicites
 * - Réutilise les services existants pour les tâches et activités
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/errors/handlers';
import { transformActivity } from '@/services/activities/utils/activity-transformer';
import type { ActivityWithRelations, SupabaseActivityRaw } from '@/types/activity-with-relations';

/**
 * Type d'item de planning (unifié pour tâches et activités)
 */
export type PlanningItem = PlanningTaskItem | PlanningActivityItem;

export type PlanningTaskItem = {
  id: string;
  type: 'task';
  title: string;
  status: 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente' | null;
  startDate: string; // ISO date string (start_date pour les tâches)
  assignedTo?: {
    id: string;
    fullName: string;
  } | null;
};

export type PlanningActivityItem = {
  id: string;
  type: 'activity';
  title: string;
  activityType: string | null;
  status: string | null;
  plannedStart: string; // ISO date string
  plannedEnd: string | null; // ISO date string
  reportContent?: string | null; // Contenu du compte rendu
  createdBy?: {
    id: string;
    fullName: string;
  } | null;
  participants?: Array<{
    id: string;
    fullName: string;
  }>;
};

/**
 * Récupère les items de planning pour une date donnée
 * 
 * Logique selon le mode :
 * - Mode "starts" : Affiche TOUT ce qui COMMENCE ce jour (tâches avec start_date + activités avec planned_start)
 * - Mode "dueDates" : Affiche TOUT ce qui a une ÉCHÉANCE/TERMINE ce jour (tâches avec start_date + activités avec planned_end)
 * 
 * @param date - Date pour laquelle récupérer les items
 * @param viewMode - Mode de vue : 'starts' pour débuts, 'dueDates' pour échéances
 * @returns Liste des items de planning pour la date
 * @throws ApplicationError si une erreur survient
 */
export async function getPlanningItemsForDate(
  date: Date,
  viewMode: 'starts' | 'dueDates' = 'starts'
): Promise<PlanningItem[]> {
  const supabase = await createSupabaseServerClient();

  // Normaliser la date (début de journée pour comparaison)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const items: PlanningItem[] = [];

  // Mode "Débuts" : Afficher les items qui COMMENCENT ce jour
  // - Tâches avec start_date = date
  // - Activités avec planned_start = date
  if (viewMode === 'starts') {
    const tasks = await getTasksForDate(supabase, startOfDay, endOfDay);
    const activities = await getActivitiesForDate(supabase, startOfDay, endOfDay);
    items.push(...tasks, ...activities);
  }

  // Mode "Échéances" : Afficher les items qui ont une ÉCHÉANCE/TERMINENT ce jour
  // - Tâches dont la date d'échéance calculée (start_date + estimated_duration_hours) tombe dans la journée
  // - Activités qui se terminent ce jour (planned_end dans la journée)
  if (viewMode === 'dueDates') {
    const tasks = await getTasksEndingOnDate(supabase, startOfDay, endOfDay);
    const activities = await getActivitiesEndingOnDate(supabase, startOfDay, endOfDay);
    items.push(...tasks, ...activities);
  }

  return items;
}

/**
 * Récupère les tâches pour une date donnée (filtre par start_date)
 */
async function getTasksForDate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfDay: Date,
  endOfDay: Date
): Promise<PlanningTaskItem[]> {
  // Construire la requête avec les relations nécessaires
  // Note: priority n'existe pas encore dans le schéma tasks
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      start_date,
      assigned_to,
      created_by,
      assigned_user:profiles!tasks_assigned_to_fkey(id, full_name)
    `)
    .gte('start_date', startOfDay.toISOString())
    .lte('start_date', endOfDay.toISOString())
    .not('status', 'eq', 'Annule') // Exclure les tâches annulées
    .order('start_date', { ascending: true });

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des tâches');
  }

  const tasksRaw = (data || []) as Array<{
    id: string;
    title: string;
    status: string | null;
    start_date: string | null;
    assigned_to: string | null;
    created_by: string | null;
    assigned_user: { id: string; full_name: string }[] | { id: string; full_name: string } | null;
  }>;

  // Transformer les tâches
  const tasks: PlanningTaskItem[] = tasksRaw.map((taskRaw) => {
    // Normaliser assigned_user (peut être array ou objet)
    let assignedUser: { id: string; full_name: string } | null = null;
    if (taskRaw.assigned_user) {
      if (Array.isArray(taskRaw.assigned_user)) {
        assignedUser = taskRaw.assigned_user[0] || null;
      } else {
        assignedUser = taskRaw.assigned_user;
      }
    }

    return {
      id: taskRaw.id,
      type: 'task',
      title: taskRaw.title,
      status: (taskRaw.status as 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque') || 'A_faire',
      priority: null, // priority n'existe pas encore dans le schéma
      startDate: taskRaw.start_date || '',
      assignedTo: assignedUser
        ? {
            id: assignedUser.id,
            fullName: assignedUser.full_name
          }
        : null
    };
  });

  return tasks;
}

/**
 * Récupère les activités qui COMMENCENT à une date donnée
 * 
 * Filtre par planned_start dans la journée
 */
async function getActivitiesForDate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfDay: Date,
  endOfDay: Date
): Promise<PlanningActivityItem[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id,
      title,
      activity_type,
      status,
      planned_start,
      planned_end,
      report_content,
      created_by,
      created_user:profiles!activities_created_by_fkey(id, full_name),
      activity_participants(
        user_id,
        role,
        is_invited_external,
        user:profiles!activity_participants_user_id_fkey(id, full_name)
      )
    `)
    .gte('planned_start', startOfDay.toISOString())
    .lte('planned_start', endOfDay.toISOString())
    .not('status', 'eq', 'Annule') // Exclure les activités annulées
    .order('planned_start', { ascending: true });

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des activités');
  }

  const activitiesRaw = (data || []) as SupabaseActivityRaw[];

  // Transformer les activités
  const activities: PlanningActivityItem[] = activitiesRaw.map((activityRaw) => {
    const activity = transformActivity(activityRaw) as ActivityWithRelations;

    // Extraire le créateur
    const createdBy = activity.created_user
      ? {
          id: activity.created_user.id,
          fullName: activity.created_user.full_name
        }
      : null;

    // Extraire les participants
    const participants = (activity.participants || []).map((p) => ({
      id: p.user?.id || p.user_id,
      fullName: p.user?.full_name || ''
    })).filter((p) => p.fullName); // Filtrer les participants sans nom

    return {
      id: activity.id,
      type: 'activity',
      title: activity.title,
      activityType: activity.activity_type,
      status: activity.status,
      plannedStart: activity.planned_start || '',
      plannedEnd: activity.planned_end || null,
      reportContent: activity.report_content || null,
      createdBy,
      participants: participants.length > 0 ? participants : undefined
    };
  });

  return activities;
}

/**
 * Récupère les tâches qui se TERMINENT (date d'échéance) à une date donnée
 * 
 * La date d'échéance est calculée comme : start_date + estimated_duration_hours
 * Filtre les tâches dont la date d'échéance calculée est dans la journée
 */
async function getTasksEndingOnDate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfDay: Date,
  endOfDay: Date
): Promise<PlanningTaskItem[]> {
  // Récupérer toutes les tâches avec start_date et estimated_duration_hours
  // On doit calculer la date d'échéance côté application
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      start_date,
      estimated_duration_hours,
      assigned_to,
      created_by,
      assigned_user:profiles!tasks_assigned_to_fkey(id, full_name)
    `)
    .not('start_date', 'is', null)
    .not('status', 'eq', 'Annule') // Exclure les tâches annulées
    .order('start_date', { ascending: true });

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des tâches se terminant ce jour');
  }

  const tasksRaw = (data || []) as Array<{
    id: string;
    title: string;
    status: string | null;
    start_date: string | null;
    estimated_duration_hours: number | null;
    assigned_to: string | null;
    created_by: string | null;
    assigned_user: { id: string; full_name: string }[] | { id: string; full_name: string } | null;
  }>;

  // Calculer la date d'échéance pour chaque tâche et filtrer
  const tasks: PlanningTaskItem[] = tasksRaw
    .filter((taskRaw) => {
      if (!taskRaw.start_date || taskRaw.estimated_duration_hours === null) {
        return false; // Pas de date d'échéance calculable
      }

      const startDate = new Date(taskRaw.start_date);
      const dueDate = new Date(startDate.getTime() + (taskRaw.estimated_duration_hours * 60 * 60 * 1000));

      // Vérifier si la date d'échéance est dans la journée
      return dueDate >= startOfDay && dueDate <= endOfDay;
    })
    .map((taskRaw) => {
      // Normaliser assigned_user (peut être array ou objet)
      let assignedUser: { id: string; full_name: string } | null = null;
      if (taskRaw.assigned_user) {
        if (Array.isArray(taskRaw.assigned_user)) {
          assignedUser = taskRaw.assigned_user[0] || null;
        } else {
          assignedUser = taskRaw.assigned_user;
        }
      }

      return {
        id: taskRaw.id,
        type: 'task',
        title: taskRaw.title,
        status: (taskRaw.status as 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque') || 'A_faire',
        priority: null, // priority n'existe pas encore dans le schéma
        startDate: taskRaw.start_date || '',
        assignedTo: assignedUser
          ? {
              id: assignedUser.id,
              fullName: assignedUser.full_name
            }
          : null
      };
    });

  return tasks;
}

/**
 * Récupère les activités qui se TERMINENT à une date donnée
 * 
 * Filtre par planned_end dans la journée (pour mode "Échéances")
 */
async function getActivitiesEndingOnDate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfDay: Date,
  endOfDay: Date
): Promise<PlanningActivityItem[]> {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      id,
      title,
      activity_type,
      status,
      planned_start,
      planned_end,
      report_content,
      created_by,
      created_user:profiles!activities_created_by_fkey(id, full_name),
      activity_participants(
        user_id,
        role,
        is_invited_external,
        user:profiles!activity_participants_user_id_fkey(id, full_name)
      )
    `)
    .not('planned_end', 'is', null)
    .gte('planned_end', startOfDay.toISOString())
    .lte('planned_end', endOfDay.toISOString())
    .not('status', 'eq', 'Annule') // Exclure les activités annulées
    .order('planned_end', { ascending: true });

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des activités se terminant ce jour');
  }

  const activitiesRaw = (data || []) as SupabaseActivityRaw[];

  // Transformer les activités
  const activities: PlanningActivityItem[] = activitiesRaw.map((activityRaw) => {
    const activity = transformActivity(activityRaw) as ActivityWithRelations;

    // Extraire le créateur
    const createdBy = activity.created_user
      ? {
          id: activity.created_user.id,
          fullName: activity.created_user.full_name
        }
      : null;

    // Extraire les participants
    const participants = (activity.participants || []).map((p) => ({
      id: p.user?.id || p.user_id,
      fullName: p.user?.full_name || ''
    })).filter((p) => p.fullName); // Filtrer les participants sans nom

    return {
      id: activity.id,
      type: 'activity',
      title: activity.title,
      activityType: activity.activity_type,
      status: activity.status,
      plannedStart: activity.planned_start || '',
      plannedEnd: activity.planned_end || null,
      reportContent: activity.report_content || null,
      createdBy,
      participants: participants.length > 0 ? participants : undefined
    };
  });

  return activities;
}




