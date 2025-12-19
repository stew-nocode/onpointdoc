import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour les KPIs d'activités
 * 
 * Structure identique à SupportTicketKPIs pour cohérence
 */
export type ActivityKPIs = {
  myActivitiesPlannedThisMonth: number;
  myActivitiesCompletedThisMonth: number;
  activitiesUpcomingThisWeek: number;
  myActivitiesInProgressToday: number;
  trends?: {
    myActivitiesPlannedTrend: number;
    myActivitiesCompletedTrend: number;
    activitiesUpcomingTrend: number;
    myActivitiesInProgressTrend: number;
  };
  chartData?: {
    plannedData: number[];
    completedData: number[];
    upcomingData: number[];
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
 * Construit les dates pour la semaine à venir (7 prochains jours)
 * 
 * @returns Objet contenant les dates de début et fin de semaine
 */
function getUpcomingWeekDates() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const startOfLastWeek = new Date(now);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  startOfLastWeek.setHours(0, 0, 0, 0);
  
  const endOfLastWeek = new Date(now);
  endOfLastWeek.setHours(23, 59, 59, 999);
  
  return { startOfToday, endOfWeek, startOfLastWeek, endOfLastWeek };
}

/**
 * Construit les dates pour aujourd'hui
 * 
 * @returns Objet contenant les dates de début et fin de la journée
 */
function getTodayDates() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);
  
  const endOfYesterday = new Date(now);
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);
  
  return { startOfToday, endOfToday, startOfYesterday, endOfYesterday };
}

/**
 * Récupère les activités planifiées créées par l'utilisateur ce mois
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfMonth - Date de début du mois
 * @returns Nombre d'activités planifiées
 */
async function getMyPlannedActivitiesThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', profileId)
    .eq('status', 'Planifie')
    .gte('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère les activités planifiées créées par l'utilisateur le mois précédent
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre d'activités planifiées
 */
async function getMyPlannedActivitiesLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfLastMonth: Date,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', profileId)
    .eq('status', 'Planifie')
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère les activités terminées créées par l'utilisateur ce mois
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfMonth - Date de début du mois
 * @returns Nombre d'activités terminées
 */
async function getMyCompletedActivitiesThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', profileId)
    .eq('status', 'Termine')
    .gte('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère les activités terminées créées par l'utilisateur le mois précédent
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre d'activités terminées
 */
async function getMyCompletedActivitiesLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfLastMonth: Date,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', profileId)
    .eq('status', 'Termine')
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère les activités à venir cette semaine (où l'utilisateur participe ou qu'il a créées)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfToday - Date de début d'aujourd'hui
 * @param endOfWeek - Date de fin de la semaine (7 jours)
 * @returns Nombre d'activités à venir
 */
async function getUpcomingActivitiesThisWeek(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfToday: Date,
  endOfWeek: Date
): Promise<number> {
  if (!profileId) return 0;
  
  // Récupérer les activités où l'utilisateur participe
  const { data: participantActivities } = await supabase
    .from('activity_participants')
    .select('activity_id')
    .eq('user_id', profileId);
  
  const participantActivityIds = participantActivities?.map(p => p.activity_id) || [];
  
  // Récupérer les activités créées par l'utilisateur
  const { data: createdActivities, count: createdCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: false })
    .eq('created_by', profileId)
    .not('status', 'in', '(Termine,Annule)')
    .not('planned_start', 'is', null)
    .gte('planned_start', startOfToday.toISOString())
    .lte('planned_start', endOfWeek.toISOString());
  
  // Si l'utilisateur ne participe à aucune activité, retourner seulement les créées
  if (participantActivityIds.length === 0) {
    return createdCount || 0;
  }
  
  // Récupérer les activités où l'utilisateur participe (qui ne sont pas déjà comptées)
  const createdIds = new Set(createdActivities?.map(a => a.id) || []);
  const uniqueParticipantIds = participantActivityIds.filter(id => !createdIds.has(id));
  
  if (uniqueParticipantIds.length === 0) {
    return createdCount || 0;
  }
  
  const { count: participantCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .in('id', uniqueParticipantIds)
    .not('status', 'in', '(Termine,Annule)')
    .not('planned_start', 'is', null)
    .gte('planned_start', startOfToday.toISOString())
    .lte('planned_start', endOfWeek.toISOString());
  
  return (createdCount || 0) + (participantCount || 0);
}

/**
 * Récupère les activités à venir la semaine précédente (pour comparaison)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfLastWeek - Date de début de la semaine précédente
 * @param endOfLastWeek - Date de fin de la semaine précédente
 * @returns Nombre d'activités à venir
 */
async function getUpcomingActivitiesLastWeek(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfLastWeek: Date,
  endOfLastWeek: Date
): Promise<number> {
  if (!profileId) return 0;
  
  // Récupérer les activités où l'utilisateur participe
  const { data: participantActivities } = await supabase
    .from('activity_participants')
    .select('activity_id')
    .eq('user_id', profileId);
  
  const participantActivityIds = participantActivities?.map(p => p.activity_id) || [];
  
  // Récupérer les activités créées par l'utilisateur
  const { data: createdActivities, count: createdCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: false })
    .eq('created_by', profileId)
    .not('status', 'in', '(Termine,Annule)')
    .not('planned_start', 'is', null)
    .gte('planned_start', startOfLastWeek.toISOString())
    .lte('planned_start', endOfLastWeek.toISOString());
  
  // Si l'utilisateur ne participe à aucune activité, retourner seulement les créées
  if (participantActivityIds.length === 0) {
    return createdCount || 0;
  }
  
  // Récupérer les activités où l'utilisateur participe (qui ne sont pas déjà comptées)
  const createdIds = new Set(createdActivities?.map(a => a.id) || []);
  const uniqueParticipantIds = participantActivityIds.filter(id => !createdIds.has(id));
  
  if (uniqueParticipantIds.length === 0) {
    return createdCount || 0;
  }
  
  const { count: participantCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .in('id', uniqueParticipantIds)
    .not('status', 'in', '(Termine,Annule)')
    .not('planned_start', 'is', null)
    .gte('planned_start', startOfLastWeek.toISOString())
    .lte('planned_start', endOfLastWeek.toISOString());
  
  return (createdCount || 0) + (participantCount || 0);
}

/**
 * Récupère les activités en cours aujourd'hui (où l'utilisateur participe ou qu'il a créées)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfToday - Date de début d'aujourd'hui
 * @param endOfToday - Date de fin d'aujourd'hui
 * @returns Nombre d'activités en cours
 */
async function getMyInProgressActivitiesToday(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfToday: Date,
  endOfToday: Date
): Promise<number> {
  if (!profileId) return 0;
  
  // Récupérer les activités où l'utilisateur participe
  const { data: participantActivities } = await supabase
    .from('activity_participants')
    .select('activity_id')
    .eq('user_id', profileId);
  
  const participantActivityIds = participantActivities?.map(p => p.activity_id) || [];
  
  // Récupérer les activités créées par l'utilisateur avec status En_cours
  const { data: createdActivities, count: createdCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: false })
    .eq('created_by', profileId)
    .eq('status', 'En_cours');
  
  // Si l'utilisateur ne participe à aucune activité, retourner seulement les créées
  if (participantActivityIds.length === 0) {
    return createdCount || 0;
  }
  
  // Récupérer les activités où l'utilisateur participe (qui ne sont pas déjà comptées)
  const createdIds = new Set(createdActivities?.map(a => a.id) || []);
  const uniqueParticipantIds = participantActivityIds.filter(id => !createdIds.has(id));
  
  if (uniqueParticipantIds.length === 0) {
    return createdCount || 0;
  }
  
  const { count: participantCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .in('id', uniqueParticipantIds)
    .eq('status', 'En_cours');
  
  return (createdCount || 0) + (participantCount || 0);
}

/**
 * Récupère les activités en cours hier (pour comparaison)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfYesterday - Date de début d'hier
 * @param endOfYesterday - Date de fin d'hier
 * @returns Nombre d'activités en cours
 */
async function getMyInProgressActivitiesYesterday(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfYesterday: Date,
  endOfYesterday: Date
): Promise<number> {
  if (!profileId) return 0;
  
  // Récupérer les activités où l'utilisateur participe
  const { data: participantActivities } = await supabase
    .from('activity_participants')
    .select('activity_id')
    .eq('user_id', profileId);
  
  const participantActivityIds = participantActivities?.map(p => p.activity_id) || [];
  
  // Récupérer les activités créées par l'utilisateur avec status En_cours (mises à jour hier)
  const { data: createdActivities, count: createdCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: false })
    .eq('created_by', profileId)
    .eq('status', 'En_cours')
    .gte('updated_at', startOfYesterday.toISOString())
    .lte('updated_at', endOfYesterday.toISOString());
  
  // Si l'utilisateur ne participe à aucune activité, retourner seulement les créées
  if (participantActivityIds.length === 0) {
    return createdCount || 0;
  }
  
  // Récupérer les activités où l'utilisateur participe (qui ne sont pas déjà comptées)
  const createdIds = new Set(createdActivities?.map(a => a.id) || []);
  const uniqueParticipantIds = participantActivityIds.filter(id => !createdIds.has(id));
  
  if (uniqueParticipantIds.length === 0) {
    return createdCount || 0;
  }
  
  const { count: participantCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .in('id', uniqueParticipantIds)
    .eq('status', 'En_cours')
    .gte('updated_at', startOfYesterday.toISOString())
    .lte('updated_at', endOfYesterday.toISOString());
  
  return (createdCount || 0) + (participantCount || 0);
}

/**
 * Récupère les données réelles des 7 derniers jours pour le mini graphique activités planifiées
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @returns Tableau de 7 valeurs (une par jour, du plus ancien au plus récent)
 */
async function getMyPlannedActivitiesLast7Days(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null
): Promise<number[]> {
  if (!profileId) return [0, 0, 0, 0, 0, 0, 0];
  
  const data: number[] = [];
  const today = new Date();
  
  // Parcourir les 7 derniers jours (du plus ancien au plus récent)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Début et fin de journée
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { count } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', profileId)
      .eq('status', 'Planifie')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
    
    data.push(count || 0);
  }
  
  return data;
}

/**
 * Récupère les données réelles des 7 derniers jours pour le mini graphique activités terminées
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @returns Tableau de 7 valeurs (une par jour, du plus ancien au plus récent)
 */
async function getMyCompletedActivitiesLast7Days(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null
): Promise<number[]> {
  if (!profileId) return [0, 0, 0, 0, 0, 0, 0];
  
  const data: number[] = [];
  const today = new Date();
  
  // Parcourir les 7 derniers jours (du plus ancien au plus récent)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Début et fin de journée
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { count } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', profileId)
      .eq('status', 'Termine')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
    
    data.push(count || 0);
  }
  
  return data;
}

/**
 * Récupère les données réelles des 7 derniers jours pour le mini graphique activités à venir
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @returns Tableau de 7 valeurs (une par jour, du plus ancien au plus récent)
 */
async function getUpcomingActivitiesLast7Days(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null
): Promise<number[]> {
  if (!profileId) return [0, 0, 0, 0, 0, 0, 0];
  
  const data: number[] = [];
  const today = new Date();
  
  // Récupérer les activités où l'utilisateur participe une seule fois
  const { data: participantActivities } = await supabase
    .from('activity_participants')
    .select('activity_id')
    .eq('user_id', profileId);
  
  const participantActivityIds = participantActivities?.map(p => p.activity_id) || [];
  
  // Parcourir les 7 derniers jours (du plus ancien au plus récent)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Début et fin de journée
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Compter les activités créées
    const { data: createdActivities, count: createdCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: false })
      .eq('created_by', profileId)
      .not('status', 'in', '(Termine,Annule)')
      .not('planned_start', 'is', null)
      .gte('planned_start', startOfDay.toISOString())
      .lte('planned_start', endOfDay.toISOString());
    
    // Si l'utilisateur ne participe à aucune activité, utiliser seulement les créées
    if (participantActivityIds.length === 0) {
      data.push(createdCount || 0);
      continue;
    }
    
    // Éviter les doublons : exclure les activités déjà comptées comme créées
    const createdIds = new Set(createdActivities?.map(a => a.id) || []);
    const uniqueParticipantIds = participantActivityIds.filter(id => !createdIds.has(id));
    
    if (uniqueParticipantIds.length === 0) {
      data.push(createdCount || 0);
      continue;
    }
    
    // Compter les activités où l'utilisateur participe (sans doublons)
    const { count: participantCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('id', uniqueParticipantIds)
      .not('status', 'in', '(Termine,Annule)')
      .not('planned_start', 'is', null)
      .gte('planned_start', startOfDay.toISOString())
      .lte('planned_start', endOfDay.toISOString());
    
    data.push((createdCount || 0) + (participantCount || 0));
  }
  
  return data;
}

/**
 * Récupère les données réelles des 7 derniers jours pour le mini graphique activités en cours
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @returns Tableau de 7 valeurs (une par jour, du plus ancien au plus récent)
 */
async function getMyInProgressActivitiesLast7Days(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null
): Promise<number[]> {
  if (!profileId) return [0, 0, 0, 0, 0, 0, 0];
  
  const data: number[] = [];
  const today = new Date();
  
  // Récupérer les activités où l'utilisateur participe une seule fois
  const { data: participantActivities } = await supabase
    .from('activity_participants')
    .select('activity_id')
    .eq('user_id', profileId);
  
  const participantActivityIds = participantActivities?.map(p => p.activity_id) || [];
  
  // Parcourir les 7 derniers jours (du plus ancien au plus récent)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Début et fin de journée
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Compter les activités créées avec status En_cours
    const { data: createdActivities, count: createdCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: false })
      .eq('created_by', profileId)
      .eq('status', 'En_cours')
      .gte('updated_at', startOfDay.toISOString())
      .lte('updated_at', endOfDay.toISOString());
    
    // Si l'utilisateur ne participe à aucune activité, utiliser seulement les créées
    if (participantActivityIds.length === 0) {
      data.push(createdCount || 0);
      continue;
    }
    
    // Éviter les doublons : exclure les activités déjà comptées comme créées
    const createdIds = new Set(createdActivities?.map(a => a.id) || []);
    const uniqueParticipantIds = participantActivityIds.filter(id => !createdIds.has(id));
    
    if (uniqueParticipantIds.length === 0) {
      data.push(createdCount || 0);
      continue;
    }
    
    // Compter les activités où l'utilisateur participe (sans doublons)
    const { count: participantCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('id', uniqueParticipantIds)
      .eq('status', 'En_cours')
      .gte('updated_at', startOfDay.toISOString())
      .lte('updated_at', endOfDay.toISOString());
    
    data.push((createdCount || 0) + (participantCount || 0));
  }
  
  return data;
}

/**
 * Calcule les KPIs pour les activités
 * Inclut les tendances par rapport au mois/semaine précédent et données pour mini graphiques
 * 
 * @param profileId - ID du profil de l'utilisateur (optionnel, null si non connecté)
 * @returns Les 4 KPIs avec tendances et données de graphique
 */
export async function getActivityKPIs(
  profileId: string | null
): Promise<ActivityKPIs> {
  const supabase = await createSupabaseServerClient();
  const { startOfMonth, startOfLastMonth } = getMonthDates();
  const { startOfToday, endOfWeek, startOfLastWeek, endOfLastWeek } = getUpcomingWeekDates();
  const { startOfToday: todayStart, endOfToday, startOfYesterday, endOfYesterday } = getTodayDates();

  // Exécuter toutes les requêtes en parallèle
  const [
    myPlannedThisMonth,
    myPlannedLastMonth,
    myCompletedThisMonth,
    myCompletedLastMonth,
    upcomingThisWeek,
    upcomingLastWeek,
    inProgressToday,
    inProgressYesterday,
    plannedLast7Days,
    completedLast7Days,
    upcomingLast7Days,
    inProgressLast7Days
  ] = await Promise.all([
    getMyPlannedActivitiesThisMonth(supabase, profileId, startOfMonth),
    getMyPlannedActivitiesLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getMyCompletedActivitiesThisMonth(supabase, profileId, startOfMonth),
    getMyCompletedActivitiesLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getUpcomingActivitiesThisWeek(supabase, profileId, startOfToday, endOfWeek),
    getUpcomingActivitiesLastWeek(supabase, profileId, startOfLastWeek, endOfLastWeek),
    getMyInProgressActivitiesToday(supabase, profileId, todayStart, endOfToday),
    getMyInProgressActivitiesYesterday(supabase, profileId, startOfYesterday, endOfYesterday),
    getMyPlannedActivitiesLast7Days(supabase, profileId),
    getMyCompletedActivitiesLast7Days(supabase, profileId),
    getUpcomingActivitiesLast7Days(supabase, profileId),
    getMyInProgressActivitiesLast7Days(supabase, profileId)
  ]);

  const current = {
    myActivitiesPlannedThisMonth: myPlannedThisMonth,
    myActivitiesCompletedThisMonth: myCompletedThisMonth,
    activitiesUpcomingThisWeek: upcomingThisWeek,
    myActivitiesInProgressToday: inProgressToday
  };

  const previous = {
    myPlanned: myPlannedLastMonth,
    myCompleted: myCompletedLastMonth,
    upcoming: upcomingLastWeek,
    inProgress: inProgressYesterday
  };

  // Calculer les tendances
  const trends = {
    myActivitiesPlannedTrend: calculateTrend(current.myActivitiesPlannedThisMonth, previous.myPlanned),
    myActivitiesCompletedTrend: calculateTrend(current.myActivitiesCompletedThisMonth, previous.myCompleted),
    activitiesUpcomingTrend: calculateTrend(current.activitiesUpcomingThisWeek, previous.upcoming),
    myActivitiesInProgressTrend: calculateTrend(current.myActivitiesInProgressToday, previous.inProgress)
  };

  // Utiliser les données réelles des 7 derniers jours
  const chartData = {
    plannedData: plannedLast7Days,
    completedData: completedLast7Days,
    upcomingData: upcomingLast7Days,
    inProgressData: inProgressLast7Days
  };

  return {
    ...current,
    trends,
    chartData
  };
}
