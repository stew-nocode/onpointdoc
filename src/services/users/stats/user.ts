import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour les statistiques d'un utilisateur (rapporteur ou assigné)
 */
export type UserTicketStats = {
  totalTickets: number;
  createdThisMonth: number;
  assignedThisMonth: number;
  resolved: number;
  inProgress: number;
  overdue: number;
  resolutionRate: number;
};

/**
 * Charge le nombre total de tickets créés par un utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - UUID du profil utilisateur
 * @returns Nombre total de tickets créés
 */
async function loadTotalCreatedTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<number> {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', profileId);

  return count || 0;
}

/**
 * Charge le nombre total de tickets assignés à un utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - UUID du profil utilisateur
 * @returns Nombre total de tickets assignés
 */
async function loadTotalAssignedTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<number> {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId);

  return count || 0;
}

/**
 * Calcule le début du mois actuel
 * 
 * @returns Date de début du mois (ISO string)
 */
function getStartOfMonth(): string {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString();
}

/**
 * Calcule la date du jour
 * 
 * @returns Date du jour (ISO string)
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Charge le nombre de tickets créés ce mois par un utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - UUID du profil utilisateur
 * @returns Nombre de tickets créés ce mois
 */
async function loadCreatedThisMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<number> {
  const startOfMonth = getStartOfMonth();

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', profileId)
    .gte('created_at', startOfMonth);

  return count || 0;
}

/**
 * Charge le nombre de tickets assignés ce mois à un utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - UUID du profil utilisateur
 * @returns Nombre de tickets assignés ce mois
 */
async function loadAssignedThisMonth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<number> {
  const startOfMonth = getStartOfMonth();

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .gte('created_at', startOfMonth);

  return count || 0;
}

/**
 * Charge le nombre de tickets résolus par un utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - UUID du profil utilisateur
 * @returns Nombre de tickets résolus
 */
async function loadResolvedTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<number> {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .in('status', ['Resolue', 'Terminé', 'Terminé(e)']);

  return count || 0;
}

/**
 * Charge le nombre de tickets en cours pour un utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - UUID du profil utilisateur
 * @returns Nombre de tickets en cours
 */
async function loadInProgressTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<number> {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .not('status', 'in', '(Resolue,Terminé,Terminé(e))');

  return count || 0;
}

/**
 * Charge le nombre de tickets en retard pour un utilisateur
 * 
 * @param supabase - Client Supabase
 * @param profileId - UUID du profil utilisateur
 * @param today - Date du jour (YYYY-MM-DD)
 * @returns Nombre de tickets en retard
 */
async function loadOverdueTickets(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string,
  today: string
): Promise<number> {
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .lt('target_date', today)
    .not('status', 'in', '(Resolue,Terminé,Terminé(e))');

  return count || 0;
}

/**
 * Calcule le taux de résolution en pourcentage
 * 
 * @param resolved - Nombre de tickets résolus
 * @param total - Nombre total de tickets
 * @returns Taux de résolution (0-100)
 */
function calculateResolutionRate(resolved: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((resolved / total) * 100);
}

/**
 * Charge les statistiques complètes d'un utilisateur (rapporteur)
 * 
 * @param profileId - UUID du profil utilisateur
 * @returns Statistiques de l'utilisateur en tant que rapporteur
 */
async function loadReporterStatsWithClient(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<UserTicketStats> {
  const [totalTickets, createdThisMonth] = await Promise.all([
    loadTotalCreatedTickets(supabase, profileId),
    loadCreatedThisMonth(supabase, profileId)
  ]);

  return {
    totalTickets,
    createdThisMonth,
    assignedThisMonth: 0,
    resolved: 0,
    inProgress: 0,
    overdue: 0,
    resolutionRate: 0
  };
}

export async function loadReporterStats(profileId: string): Promise<UserTicketStats> {
  const supabase = await createSupabaseServerClient();
  return loadReporterStatsWithClient(supabase, profileId);
}

/**
 * Charge les statistiques complètes d'un utilisateur (assigné)
 * 
 * @param profileId - UUID du profil utilisateur
 * @returns Statistiques de l'utilisateur en tant qu'assigné
 */
async function loadAssignedStatsWithClient(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<UserTicketStats> {
  const today = getToday();

  const [
    totalTickets,
    assignedThisMonth,
    resolved,
    inProgress,
    overdue
  ] = await Promise.all([
    loadTotalAssignedTickets(supabase, profileId),
    loadAssignedThisMonth(supabase, profileId),
    loadResolvedTickets(supabase, profileId),
    loadInProgressTickets(supabase, profileId),
    loadOverdueTickets(supabase, profileId, today)
  ]);

  const resolutionRate = calculateResolutionRate(resolved, totalTickets);

  return {
    totalTickets,
    createdThisMonth: 0,
    assignedThisMonth,
    resolved,
    inProgress,
    overdue,
    resolutionRate
  };
}

export async function loadAssignedStats(profileId: string): Promise<UserTicketStats> {
  const supabase = await createSupabaseServerClient();
  return loadAssignedStatsWithClient(supabase, profileId);
}

export async function loadUserStatsBatch(
  profileIds: string[],
  type: 'reporter' | 'assigned'
): Promise<Record<string, UserTicketStats>> {
  if (!profileIds.length) {
    return {};
  }

  const supabase = await createSupabaseServerClient();

  const entries = await Promise.all(
    profileIds.map(async (profileId) => {
      const stats = type === 'reporter'
        ? await loadReporterStatsWithClient(supabase, profileId)
        : await loadAssignedStatsWithClient(supabase, profileId);
      return [profileId, stats] as const;
    })
  );

  return Object.fromEntries(entries);
}

