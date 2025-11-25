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

type UserStatsSummaryRow = {
  profile_id: string;
  total_created: number | null;
  created_this_month: number | null;
  total_assigned: number | null;
  assigned_this_month: number | null;
  resolved_total: number | null;
  in_progress_total: number | null;
  overdue_total: number | null;
};

async function loadUserStatsSummaryRow(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<UserStatsSummaryRow | null> {
  const { data, error } = await supabase
    .from('user_ticket_stats_current_month')
    .select('profile_id, total_created, created_this_month, total_assigned, assigned_this_month, resolved_total, in_progress_total, overdue_total')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

function mapSummaryToReporter(row: UserStatsSummaryRow): UserTicketStats {
  return {
    totalTickets: row.total_created ?? 0,
    createdThisMonth: row.created_this_month ?? 0,
    assignedThisMonth: 0,
    resolved: 0,
    inProgress: 0,
    overdue: 0,
    resolutionRate: 0
  };
}

function mapSummaryToAssigned(row: UserStatsSummaryRow): UserTicketStats {
  const totalTickets = row.total_assigned ?? 0;
  const resolved = row.resolved_total ?? 0;
  return {
    totalTickets,
    createdThisMonth: 0,
    assignedThisMonth: row.assigned_this_month ?? 0,
    resolved,
    inProgress: row.in_progress_total ?? 0,
    overdue: row.overdue_total ?? 0,
    resolutionRate: calculateResolutionRate(resolved, totalTickets)
  };
}

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
  const summary = await loadUserStatsSummaryRow(supabase, profileId);
  if (summary) {
    return mapSummaryToReporter(summary);
  }

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
  const summary = await loadUserStatsSummaryRow(supabase, profileId);
  if (summary) {
    return mapSummaryToAssigned(summary);
  }

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

  const result: Record<string, UserTicketStats> = {};

  const { data: summaryRows } = await supabase
    .from('user_ticket_stats_current_month')
    .select('profile_id, total_created, created_this_month, total_assigned, assigned_this_month, resolved_total, in_progress_total, overdue_total')
    .in('profile_id', profileIds);

  const missingIds = new Set(profileIds);

  (summaryRows ?? []).forEach((row) => {
    if (!row || !row.profile_id) return;
    const stats = type === 'reporter'
      ? mapSummaryToReporter(row as UserStatsSummaryRow)
      : mapSummaryToAssigned(row as UserStatsSummaryRow);
    result[row.profile_id] = stats;
    missingIds.delete(row.profile_id);
  });

  if (missingIds.size > 0) {
    const fallbackEntries = await Promise.all(
      Array.from(missingIds).map(async (profileId) => {
        const stats = type === 'reporter'
          ? await loadReporterStatsWithClient(supabase, profileId)
          : await loadAssignedStatsWithClient(supabase, profileId);
        return [profileId, stats] as const;
      })
    );
    fallbackEntries.forEach(([profileId, stats]) => {
      result[profileId] = stats;
    });
  }

  return result;
}

