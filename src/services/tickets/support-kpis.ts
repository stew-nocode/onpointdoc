import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SupportTicketKPIs = {
  myTicketsOverdue: number;
  assistanceCountThisMonth: number;
  myTicketsResolvedThisMonth: number;
  bugAndReqTransferred: number;
  trends?: {
    myTicketsOverdueTrend: number;
    assistanceCountTrend: number;
    myTicketsResolvedTrend: number;
    bugAndReqTransferredTrend: number;
  };
  chartData?: {
    overdueData: number[];
    assistanceData: number[];
    resolvedData: number[];
    transferredData: number[];
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
 * Récupère le nombre de tickets ASSISTANCE créés ce mois
 * 
 * @param supabase - Client Supabase
 * @param startOfMonth - Date de début du mois
 * @returns Nombre de tickets ASSISTANCE
 */
async function getAssistanceCountThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  startOfMonth: Date
) {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'ASSISTANCE')
    .gte('created_at', startOfMonth.toISOString());
  return count || 0;
}

/**
 * Récupère le nombre de tickets ASSISTANCE créés le mois précédent
 * 
 * @param supabase - Client Supabase
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre de tickets ASSISTANCE du mois précédent
 */
async function getAssistanceCountLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  startOfLastMonth: Date,
  startOfMonth: Date
) {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_type', 'ASSISTANCE')
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
 * Récupère le nombre de tickets BUG et REQ transférés ce mois
 * 
 * @param supabase - Client Supabase
 * @param startOfMonth - Date de début du mois
 * @returns Nombre de tickets transférés
 */
async function getBugAndReqTransferredThisMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  startOfMonth: Date
) {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('ticket_type', ['BUG', 'REQ'])
    .not('jira_issue_key', 'is', null)
    .gte('created_at', startOfMonth.toISOString());
  return count || 0;
}

/**
 * Récupère le nombre de tickets BUG et REQ transférés le mois précédent
 * 
 * @param supabase - Client Supabase
 * @param startOfLastMonth - Date de début du mois précédent
 * @param startOfMonth - Date de début du mois actuel
 * @returns Nombre de tickets transférés du mois précédent
 */
async function getBugAndReqTransferredLastMonth(
  supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? Awaited<T> : never,
  startOfLastMonth: Date,
  startOfMonth: Date
) {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('ticket_type', ['BUG', 'REQ'])
    .not('jira_issue_key', 'is', null)
    .gte('created_at', startOfLastMonth.toISOString())
    .lt('created_at', startOfMonth.toISOString());
  return count || 0;
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
    assistanceCountThisMonth,
    assistanceCountLastMonth,
    myTicketsResolvedThisMonth,
    myTicketsResolvedLastMonth,
    bugAndReqTransferred,
    bugAndReqTransferredLastMonth
  ] = await Promise.all([
    getOverdueTickets(supabase, profileId, today),
    getOverdueTicketsLastMonth(supabase, profileId, endOfLastMonth, startOfMonth),
    getAssistanceCountThisMonth(supabase, startOfMonth),
    getAssistanceCountLastMonth(supabase, startOfLastMonth, startOfMonth),
    getResolvedTicketsThisMonth(supabase, profileId, startOfMonth),
    getResolvedTicketsLastMonth(supabase, profileId, startOfLastMonth, startOfMonth),
    getBugAndReqTransferredThisMonth(supabase, startOfMonth),
    getBugAndReqTransferredLastMonth(supabase, startOfLastMonth, startOfMonth)
  ]);

  const current = {
    myTicketsOverdue,
    assistanceCountThisMonth,
    myTicketsResolvedThisMonth,
    bugAndReqTransferred
  };

  const lastMonth = {
    myTicketsOverdue: myTicketsOverdueLastMonth,
    assistanceCount: assistanceCountLastMonth,
    myTicketsResolved: myTicketsResolvedLastMonth,
    bugAndReqTransferred: bugAndReqTransferredLastMonth
  };

  // Calculer les tendances
  const trends = {
    myTicketsOverdueTrend: calculateTrend(current.myTicketsOverdue, lastMonth.myTicketsOverdue),
    assistanceCountTrend: calculateTrend(current.assistanceCountThisMonth, lastMonth.assistanceCount),
    myTicketsResolvedTrend: calculateTrend(current.myTicketsResolvedThisMonth, lastMonth.myTicketsResolved),
    bugAndReqTransferredTrend: calculateTrend(current.bugAndReqTransferred, lastMonth.bugAndReqTransferred)
  };

  // Générer les données de graphique
  const chartData = {
    overdueData: generateChartData(current.myTicketsOverdue, lastMonth.myTicketsOverdue),
    assistanceData: generateChartData(current.assistanceCountThisMonth, lastMonth.assistanceCount),
    resolvedData: generateChartData(current.myTicketsResolvedThisMonth, lastMonth.myTicketsResolved),
    transferredData: generateChartData(current.bugAndReqTransferred, lastMonth.bugAndReqTransferred)
  };

  return {
    ...current,
    trends,
    chartData
  };
}
