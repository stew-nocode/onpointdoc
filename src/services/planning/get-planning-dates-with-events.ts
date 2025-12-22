/**
 * Service pour récupérer les dates avec événements pour un mois donné
 * 
 * Principe Clean Code :
 * - Séparation logique métier / accès données
 * - Gestion d'erreur avec ApplicationError
 * - Types explicites
 * - Optimisé pour le calendrier (pas besoin de charger tous les détails)
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/errors/handlers';

/**
 * Récupère les dates avec événements pour un mois donné
 * 
 * Logique selon le mode :
 * - Mode "starts" : Dates de DÉBUT (tâches avec start_date + activités avec planned_start)
 * - Mode "dueDates" : Dates d'ÉCHÉANCE/FIN (tâches avec date d'échéance calculée + activités avec planned_end)
 * 
 * @param year - Année
 * @param month - Mois (0-11)
 * @param viewMode - Mode de vue : 'starts' pour débuts, 'dueDates' pour échéances
 * @returns Liste des dates avec événements
 * @throws ApplicationError si une erreur survient
 */
export async function getPlanningDatesWithEvents(
  year: number,
  month: number,
  viewMode: 'starts' | 'dueDates' = 'starts'
): Promise<Date[]> {
  const supabase = await createSupabaseServerClient();

  // Calculer le début et la fin du mois
  const startOfMonth = new Date(year, month, 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const datesSet = new Set<string>();

  // Récupérer les dates selon le mode de vue
  if (viewMode === 'starts') {
    // Mode "Débuts" : récupérer les start_date des tâches ET les planned_start des activités
    const taskDates = await getTaskDatesForMonth(supabase, startOfMonth, endOfMonth);
    const activityDates = await getActivityDatesForMonth(supabase, startOfMonth, endOfMonth);
    [...taskDates, ...activityDates].forEach((date) => {
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      datesSet.add(key);
    });
  } else {
    // Mode "Échéances" : récupérer les dates d'échéance calculées des tâches ET les planned_end des activités
    const taskEndDates = await getTaskEndDatesForMonth(supabase, startOfMonth, endOfMonth);
    const activityEndDates = await getActivityEndDatesForMonth(supabase, startOfMonth, endOfMonth);
    [...taskEndDates, ...activityEndDates].forEach((date) => {
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      datesSet.add(key);
    });
  }

  // Convertir le Set en tableau de Date
  return Array.from(datesSet).map((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m, d);
  });
}

/**
 * Récupère les dates des tâches (start_date) pour un mois
 */
async function getTaskDatesForMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfMonth: Date,
  endOfMonth: Date
): Promise<Date[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('start_date')
    .not('start_date', 'is', null)
    .gte('start_date', startOfMonth.toISOString())
    .lte('start_date', endOfMonth.toISOString())
    .not('status', 'eq', 'Annule'); // Exclure les tâches annulées

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des dates des tâches');
  }

  const dates: Date[] = [];
  (data || []).forEach((task) => {
    if (task.start_date) {
      const date = new Date(task.start_date);
      if (!isNaN(date.getTime())) {
        dates.push(date);
      }
    }
  });

  return dates;
}

/**
 * Récupère les dates de début des activités (planned_start) pour un mois
 */
async function getActivityDatesForMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfMonth: Date,
  endOfMonth: Date
): Promise<Date[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('planned_start')
    .not('planned_start', 'is', null)
    .gte('planned_start', startOfMonth.toISOString())
    .lte('planned_start', endOfMonth.toISOString())
    .not('status', 'eq', 'Annule'); // Exclure les activités annulées

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des dates des activités');
  }

  const dates: Date[] = [];
  (data || []).forEach((activity) => {
    if (activity.planned_start) {
      const date = new Date(activity.planned_start);
      if (!isNaN(date.getTime())) {
        dates.push(date);
      }
    }
  });

  return dates;
}

/**
 * Récupère les dates d'échéance des tâches (calculées depuis start_date + estimated_duration_hours) pour un mois
 * 
 * La date d'échéance est calculée comme : start_date + estimated_duration_hours
 */
async function getTaskEndDatesForMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfMonth: Date,
  endOfMonth: Date
): Promise<Date[]> {
  // Récupérer toutes les tâches avec start_date et estimated_duration_hours
  // On doit calculer la date d'échéance côté application
  const { data, error } = await supabase
    .from('tasks')
    .select('start_date, estimated_duration_hours')
    .not('start_date', 'is', null)
    .not('status', 'eq', 'Annule'); // Exclure les tâches annulées

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des dates d\'échéance des tâches');
  }

  const dates: Date[] = [];
  (data || []).forEach((task) => {
    if (task.start_date && task.estimated_duration_hours !== null) {
      const startDate = new Date(task.start_date);
      const dueDate = new Date(startDate.getTime() + (task.estimated_duration_hours * 60 * 60 * 1000));

      // Vérifier si la date d'échéance est dans le mois
      if (dueDate >= startOfMonth && dueDate <= endOfMonth) {
        // Extraire uniquement la date (sans l'heure) pour le calendrier
        const dateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        if (!isNaN(dateOnly.getTime())) {
          dates.push(dateOnly);
        }
      }
    }
  });

  return dates;
}

/**
 * Récupère les dates de fin des activités (planned_end) pour un mois
 */
async function getActivityEndDatesForMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startOfMonth: Date,
  endOfMonth: Date
): Promise<Date[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('planned_end')
    .not('planned_end', 'is', null)
    .gte('planned_end', startOfMonth.toISOString())
    .lte('planned_end', endOfMonth.toISOString())
    .not('status', 'eq', 'Annule'); // Exclure les activités annulées

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des dates de fin des activités');
  }

  const dates: Date[] = [];
  (data || []).forEach((activity) => {
    if (activity.planned_end) {
      const date = new Date(activity.planned_end);
      if (!isNaN(date.getTime())) {
        dates.push(date);
      }
    }
  });

  return dates;
}




