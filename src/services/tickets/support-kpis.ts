import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SupportTicketKPIs = {
  myTicketsOverdue: number;
  assistanceCountThisMonth: number;
  myTicketsResolvedThisMonth: number;
  bugAndReqTransferred: number;
  totalInteractionTime: number; // Temps total d'interaction en minutes
  trends?: {
    myTicketsOverdueTrend: number;
    assistanceCountTrend: number;
    myTicketsResolvedTrend: number;
    bugAndReqTransferredTrend: number;
    totalInteractionTimeTrend: number;
  };
  chartData?: {
    overdueData: number[];
    assistanceData: number[];
    resolvedData: number[];
    transferredData: number[];
    interactionTimeData: number[]; // Données des 7 derniers jours
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
 * Récupère les tickets en retard pour un profil
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param today - Date du jour (YYYY-MM-DD)
 * @returns Nombre de tickets en retard
 */
async function getOverdueTickets(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  today: string
) {
  if (!profileId) return 0;
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .lt('target_date', today)
    .not('status', 'in', '(Resolue,Terminé,Terminé(e))');
  return count || 0;
}

/**
 * Récupère les tickets en retard du mois précédent pour un profil
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param endOfLastMonth - Date de fin du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre de tickets en retard du mois précédent
 */
async function getOverdueTicketsLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  endOfLastMonth: Date,
  startOfMonth: Date
) {
  if (!profileId) return 0;
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .lt('target_date', endOfLastMonth.toISOString().split('T')[0])
    .not('status', 'in', '(Resolue,Terminé,Terminé(e))')
    .lt('created_at', startOfMonth.toISOString());
  return count || 0;
}

/**
 * Récupère le nombre de tickets ASSISTANCE de l'agent ce mois
 * (créés par l'agent OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @param startOfMonth - Date de début du mois
 * @returns Nombre de tickets ASSISTANCE
 */
async function getMyAssistanceCountThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfMonth: Date
) {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'ASSISTANCE')
    .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
    .gte('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère le nombre de tickets ASSISTANCE de l'agent le mois précédent
 * (créés par l'agent OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre de tickets ASSISTANCE du mois précédent
 */
async function getMyAssistanceCountLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfLastMonth: Date,
  startOfMonth: Date
) {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'ASSISTANCE')
    .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère le nombre de tickets résolus ce mois pour un profil
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfMonth - Date de début du mois
 * @returns Nombre de tickets résolus
 */
async function getResolvedTicketsThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfMonth: Date
) {
  if (!profileId) return 0;
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .in('status', ['Resolue', 'Terminé', 'Terminé(e)'])
    .gte('created_at', startOfMonth.toISOString());
  return count || 0;
}

/**
 * Récupère le nombre de tickets résolus le mois précédent pour un profil
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil (optionnel)
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre de tickets résolus du mois précédent
 */
async function getResolvedTicketsLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfLastMonth: Date,
  startOfMonth: Date
) {
  if (!profileId) return 0;
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .in('status', ['Resolue', 'Terminé', 'Terminé(e)'])
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());
  return count || 0;
}

/**
 * Récupère le nombre de tickets BUG et REQ transférés de l'agent ce mois
 * (créés par l'agent OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @param startOfMonth - Date de début du mois
 * @returns Nombre de tickets transférés
 */
async function getMyBugAndReqTransferredThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfMonth: Date
) {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('ticket_type', ['BUG', 'REQ'])
    .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
    .not('jira_issue_key', 'is', null)
    .gte('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère le nombre de tickets BUG et REQ transférés de l'agent le mois précédent
 * (créés par l'agent OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre de tickets transférés du mois précédent
 */
async function getMyBugAndReqTransferredLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfLastMonth: Date,
  startOfMonth: Date
) {
  if (!profileId) return 0;
  
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('ticket_type', ['BUG', 'REQ'])
    .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
    .not('jira_issue_key', 'is', null)
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());
  
  return count || 0;
}

/**
 * Récupère les données réelles des 7 derniers jours pour le mini graphique ASSISTANCE
 * (créés par l'agent OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @returns Tableau de 7 valeurs (une par jour, du plus ancien au plus récent)
 */
async function getMyAssistanceLast7Days(
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
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_type', 'ASSISTANCE')
      .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
    
    data.push(count || 0);
  }
  
  return data;
}

/**
 * Récupère les données réelles des 7 derniers jours pour le mini graphique BUG/REQ transférés
 * (créés par l'agent OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @returns Tableau de 7 valeurs (une par jour, du plus ancien au plus récent)
 */
async function getMyBugAndReqTransferredLast7Days(
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
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('ticket_type', ['BUG', 'REQ'])
      .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
      .not('jira_issue_key', 'is', null)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
    
    data.push(count || 0);
  }
  
  return data;
}

/**
 * Récupère le temps total d'interaction de l'agent ce mois
 * (somme des duration_minutes pour les tickets créés OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @param startOfMonth - Date de début du mois
 * @returns Temps total en minutes
 */
async function getMyTotalInteractionTimeThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { data } = await supabase
    .from('tickets')
    .select('duration_minutes')
    .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
    .not('duration_minutes', 'is', null)
    .gte('created_at', startOfMonth.toISOString());
  
  if (!data) return 0;
  
  return data.reduce((sum, ticket) => sum + (ticket.duration_minutes || 0), 0);
}

/**
 * Récupère le temps total d'interaction de l'agent le mois précédent
 * (somme des duration_minutes pour les tickets créés OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Temps total en minutes
 */
async function getMyTotalInteractionTimeLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  profileId: string | null,
  startOfLastMonth: Date,
  startOfMonth: Date
): Promise<number> {
  if (!profileId) return 0;
  
  const { data } = await supabase
    .from('tickets')
    .select('duration_minutes')
    .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
    .not('duration_minutes', 'is', null)
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());
  
  if (!data) return 0;
  
  return data.reduce((sum, ticket) => sum + (ticket.duration_minutes || 0), 0);
}

/**
 * Récupère les données réelles des 7 derniers jours pour le mini graphique temps d'interaction
 * (somme des duration_minutes pour les tickets créés OU assignés à l'agent)
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil de l'agent (optionnel)
 * @returns Tableau de 7 valeurs (une par jour, du plus ancien au plus récent) en minutes
 */
async function getMyInteractionTimeLast7Days(
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
    
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('duration_minutes')
      .or(`created_by.eq.${profileId},assigned_to.eq.${profileId}`)
      .not('duration_minutes', 'is', null)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
    
    const dayTotal = ticketsData
      ? ticketsData.reduce((sum, ticket) => sum + (ticket.duration_minutes || 0), 0)
      : 0;
    
    data.push(dayTotal);
  }
  
  return data;
}

/**
 * Calcule les KPIs pour les agents support dans la page tickets
 * Inclut les tendances par rapport au mois précédent et données pour mini graphiques
 * 
 * @param profileId - ID du profil de l'agent support (optionnel, null si non connecté)
 * @returns Les 4 KPIs avec tendances et données de graphique
 */
export async function getSupportTicketKPIs(
  profileId: string | null
): Promise<SupportTicketKPIs> {
  const supabase = await createSupabaseServerClient();
  const { startOfMonth, startOfLastMonth, endOfLastMonth, today } = getMonthDates();

  // Exécuter toutes les requêtes en parallèle
  const [
    myTicketsOverdue,
    myTicketsOverdueLastMonth,
    myAssistanceCountThisMonth,
    myAssistanceCountLastMonth,
    myTicketsResolvedThisMonth,
    myTicketsResolvedLastMonth,
    myBugAndReqTransferred,
    myBugAndReqTransferredLastMonth,
    myTotalInteractionTime,
    myTotalInteractionTimeLastMonth,
    assistanceLast7Days,
    bugAndReqTransferredLast7Days,
    interactionTimeLast7Days
  ] = await Promise.all([
    getOverdueTickets(supabase, profileId, today),
    getOverdueTicketsLastMonth(supabase, profileId, endOfLastMonth, startOfMonth),
    getMyAssistanceCountThisMonth(supabase, profileId, startOfMonth),
    getMyAssistanceCountLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getResolvedTicketsThisMonth(supabase, profileId, startOfMonth),
    getResolvedTicketsLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getMyBugAndReqTransferredThisMonth(supabase, profileId, startOfMonth),
    getMyBugAndReqTransferredLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getMyTotalInteractionTimeThisMonth(supabase, profileId, startOfMonth),
    getMyTotalInteractionTimeLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getMyAssistanceLast7Days(supabase, profileId),
    getMyBugAndReqTransferredLast7Days(supabase, profileId),
    getMyInteractionTimeLast7Days(supabase, profileId)
  ]);

  const current = {
    myTicketsOverdue,
    assistanceCountThisMonth: myAssistanceCountThisMonth,
    myTicketsResolvedThisMonth,
    bugAndReqTransferred: myBugAndReqTransferred,
    totalInteractionTime: myTotalInteractionTime
  };

  const lastMonth = {
    myTicketsOverdue: myTicketsOverdueLastMonth,
    assistanceCount: myAssistanceCountLastMonth,
    myTicketsResolved: myTicketsResolvedLastMonth,
    bugAndReqTransferred: myBugAndReqTransferredLastMonth,
    totalInteractionTime: myTotalInteractionTimeLastMonth
  };

  // Calculer les tendances
  const trends = {
    myTicketsOverdueTrend: calculateTrend(current.myTicketsOverdue, lastMonth.myTicketsOverdue),
    assistanceCountTrend: calculateTrend(current.assistanceCountThisMonth, lastMonth.assistanceCount),
    myTicketsResolvedTrend: calculateTrend(current.myTicketsResolvedThisMonth, lastMonth.myTicketsResolved),
    bugAndReqTransferredTrend: calculateTrend(current.bugAndReqTransferred, lastMonth.bugAndReqTransferred),
    totalInteractionTimeTrend: calculateTrend(current.totalInteractionTime, lastMonth.totalInteractionTime)
  };

  // Générer les données de graphique
  const chartData = {
    overdueData: generateChartData(current.myTicketsOverdue, lastMonth.myTicketsOverdue),
    assistanceData: assistanceLast7Days, // ✅ Utiliser données réelles au lieu de simulation
    resolvedData: generateChartData(current.myTicketsResolvedThisMonth, lastMonth.myTicketsResolved),
    transferredData: bugAndReqTransferredLast7Days, // ✅ Utiliser données réelles au lieu de simulation
    interactionTimeData: interactionTimeLast7Days // ✅ Utiliser données réelles
  };

  return {
    ...current,
    trends,
    chartData
  };
}
