import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/errors/handlers';

/**
 * Type pour les KPIs de tâches
 * 
 * Structure identique à ActivityKPIs pour cohérence
 */
export type TaskKPIs = {
  myTasksTodo: number;
  myTasksCompletedThisMonth: number;
  tasksOverdue: number;
  myTasksInProgress: number;
  trends?: {
    myTasksTodoTrend: number;
    myTasksCompletedTrend: number;
    tasksOverdueTrend: number;
    myTasksInProgressTrend: number;
  };
  chartData?: {
    todoData: number[];
    completedData: number[];
    overdueData: number[];
    inProgressData: number[];
  };
};

/**
 * Calcule la tendance en pourcentage entre deux valeurs
 * 
 * @param current - Valeur actuelle
 * @param previous - Valeur précédente
 * @returns Pourcentage de variation (arrondi)
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Génère des données de graphique simulées pour un mini graphique
 * Crée une progression linéaire sur 7 jours
 * 
 * @param currentValue - Valeur actuelle
 * @param previousValue - Valeur précédente
 * @returns Tableau de 7 valeurs
 */
function generateChartData(currentValue: number, previousValue: number): number[] {
  const days = 7;
  const data: number[] = [];
  const step = (currentValue - previousValue) / days;
  for (let i = 0; i < days; i++) {
    const value = Math.max(0, Math.round(previousValue + step * (i + 1)));
    data.push(value);
  }
  return data;
}

/**
 * Construit les dates de début et fin du mois actuel et précédent
 * 
 * @returns Objet contenant les dates de référence
 */
function getMonthDates() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const today = now.toISOString().split('T')[0];
  return { startOfMonth, startOfLastMonth, endOfLastMonth, today };
}

/**
 * Récupère les tâches à faire assignées à l'utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @returns Nombre de tâches à faire
 */
async function getMyTasksTodo(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null
): Promise<number> {
  if (!profileId) return 0;
  
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .eq('status', 'A_faire');
  
  if (error) {
    throw handleSupabaseError(error, 'getMyTasksTodo');
  }
  
  return count || 0;
}

/**
 * Récupère les tâches terminées assignées à l'utilisateur ce mois
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfMonth - Date de début du mois
 * @returns Nombre de tâches terminées
 */
async function getMyCompletedTasksThisMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .eq('status', 'Termine')
    .gte('updated_at', startOfMonth.toISOString());
  
  if (error) {
    throw handleSupabaseError(error, 'getMyCompletedTasksThisMonth');
  }
  
  return count || 0;
}

/**
 * Récupère les tâches terminées assignées à l'utilisateur le mois précédent
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre de tâches terminées
 */
async function getMyCompletedTasksLastMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null,
  startOfLastMonth: Date,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .eq('status', 'Termine')
    .gte('updated_at', startOfLastMonth.toISOString())
    .lt('updated_at', startOfMonth.toISOString());
  
  if (error) {
    throw handleSupabaseError(error, 'getMyCompletedTasksLastMonth');
  }
  
  return count || 0;
}

/**
 * Récupère les tâches en retard (due_date < today ET status != 'Termine' ET status != 'Annule')
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel, pour filtrer les tâches assignées)
 * @param today - Date d'aujourd'hui (format ISO string)
 * @returns Nombre de tâches en retard
 */
async function getOverdueTasks(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null,
  today: string
): Promise<number> {
  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .not('due_date', 'is', null)
    .lt('due_date', today)
    .neq('status', 'Termine')
    .neq('status', 'Annule');
  
  // Filtrer par utilisateur si profileId fourni
  if (profileId) {
    query = query.eq('assigned_to', profileId);
  }
  
  const { count, error } = await query;
  
  if (error) {
    throw handleSupabaseError(error, 'getOverdueTasks');
  }
  
  return count || 0;
}

/**
 * Récupère les tâches en cours assignées à l'utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @returns Nombre de tâches en cours
 */
async function getMyTasksInProgress(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null
): Promise<number> {
  if (!profileId) return 0;
  
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .eq('status', 'En_cours');
  
  if (error) {
    throw handleSupabaseError(error, 'getMyTasksInProgress');
  }
  
  return count || 0;
}

/**
 * Récupère les tâches en retard la semaine dernière (pour comparaison)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param lastWeekDate - Date d'il y a une semaine
 * @returns Nombre de tâches en retard
 */
async function getOverdueTasksLastWeek(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null,
  lastWeekDate: string
): Promise<number> {
  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .not('due_date', 'is', null)
    .lt('due_date', lastWeekDate)
    .neq('status', 'Termine')
    .neq('status', 'Annule');
  
  // Filtrer par utilisateur si profileId fourni
  if (profileId) {
    query = query.eq('assigned_to', profileId);
  }
  
  const { count, error } = await query;
  
  if (error) {
    throw handleSupabaseError(error, 'getOverdueTasksLastWeek');
  }
  
  return count || 0;
}

/**
 * Récupère les KPIs de tâches pour un utilisateur donné
 * 
 * @param profileId - ID du profil utilisateur (optionnel)
 * @returns KPIs de tâches avec tendances et données graphiques
 */
export async function getTaskKPIs(profileId: string | null = null): Promise<TaskKPIs> {
  const supabase = await createSupabaseServerClient();
  const { startOfMonth, startOfLastMonth, today } = getMonthDates();
  
  // Calculer la date d'il y a une semaine pour la comparaison des retards
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekDateStr = lastWeekDate.toISOString().split('T')[0];
  
  // Récupérer les valeurs actuelles
  const [
    myTasksTodo,
    myTasksCompletedThisMonth,
    tasksOverdue,
    myTasksInProgress
  ] = await Promise.all([
    getMyTasksTodo(supabase, profileId),
    getMyCompletedTasksThisMonth(supabase, profileId, startOfMonth),
    getOverdueTasks(supabase, profileId, today),
    getMyTasksInProgress(supabase, profileId)
  ]);
  
  // Récupérer les valeurs précédentes pour les tendances
  const [
    myTasksCompletedLastMonth,
    tasksOverdueLastWeek,
    // Pour les tâches à faire et en cours, on compare avec les valeurs actuelles
    // (pas de historique spécifique défini pour ces KPIs)
    myTasksTodoPrevious,
    myTasksInProgressPrevious
  ] = await Promise.all([
    getMyCompletedTasksLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getOverdueTasksLastWeek(supabase, profileId, lastWeekDateStr),
    // Valeurs précédentes simulées (pour l'instant, on peut les mettre à 0 ou calculer différemment)
    Promise.resolve(0),
    Promise.resolve(0)
  ]);
  
  // Calculer les tendances
  const trends = {
    myTasksTodoTrend: calculateTrend(myTasksTodo, myTasksTodoPrevious),
    myTasksCompletedTrend: calculateTrend(myTasksCompletedThisMonth, myTasksCompletedLastMonth),
    tasksOverdueTrend: calculateTrend(tasksOverdue, tasksOverdueLastWeek),
    myTasksInProgressTrend: calculateTrend(myTasksInProgress, myTasksInProgressPrevious)
  };
  
  // Générer les données graphiques
  const chartData = {
    todoData: generateChartData(myTasksTodo, myTasksTodoPrevious),
    completedData: generateChartData(myTasksCompletedThisMonth, myTasksCompletedLastMonth),
    overdueData: generateChartData(tasksOverdue, tasksOverdueLastWeek),
    inProgressData: generateChartData(myTasksInProgress, myTasksInProgressPrevious)
  };
  
  return {
    myTasksTodo,
    myTasksCompletedThisMonth,
    tasksOverdue,
    myTasksInProgress,
    trends,
    chartData
  };
}
