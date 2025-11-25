import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour les statistiques d'un ticket
 */
export type TicketStats = {
  commentsCount: number;
  attachmentsCount: number;
  ageInDays: number;
  statusChangesCount: number;
  lastUpdateDate: string | null;
};

/**
 * Charge le nombre de commentaires d'un ticket
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @returns Nombre de commentaires
 */
async function loadCommentsCount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string
): Promise<number> {
  const { count } = await supabase
    .from('ticket_comments')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_id', ticketId);

  return count || 0;
}

/**
 * Charge le nombre de pièces jointes d'un ticket
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @returns Nombre de pièces jointes
 */
async function loadAttachmentsCount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string
): Promise<number> {
  const { count } = await supabase
    .from('ticket_attachments')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_id', ticketId);

  return count || 0;
}

/**
 * Calcule l'âge d'un ticket en jours
 * 
 * @param createdAt - Date de création du ticket
 * @returns Nombre de jours depuis la création
 */
function calculateAgeInDays(createdAt: string | null): number {
  if (!createdAt) return 0;

  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Charge le nombre de changements de statut d'un ticket
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @returns Nombre de changements de statut
 */
async function loadStatusChangesCount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string
): Promise<number> {
  const { count } = await supabase
    .from('ticket_status_history')
    .select('*', { count: 'exact', head: true })
    .eq('ticket_id', ticketId);

  return count || 0;
}

/**
 * Charge la date de dernière mise à jour d'un ticket
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @returns Date de dernière mise à jour (ISO string) ou null
 */
async function loadLastUpdateDate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('tickets')
    .select('updated_at')
    .eq('id', ticketId)
    .single();

  return data?.updated_at || null;
}

/**
 * Charge les statistiques complètes d'un ticket
 * 
 * @param ticketId - UUID du ticket
 * @param createdAt - Date de création du ticket
 * @returns Statistiques du ticket
 */
async function loadTicketStatsWithClient(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string,
  createdAt: string | null
): Promise<TicketStats> {
  const [commentsCount, attachmentsCount, statusChangesCount, lastUpdateDate] =
    await Promise.all([
      loadCommentsCount(supabase, ticketId),
      loadAttachmentsCount(supabase, ticketId),
      loadStatusChangesCount(supabase, ticketId),
      loadLastUpdateDate(supabase, ticketId)
    ]);

  const ageInDays = calculateAgeInDays(createdAt);

  return {
    commentsCount,
    attachmentsCount,
    ageInDays,
    statusChangesCount,
    lastUpdateDate
  };
}

async function loadTicketStatsFromSummary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ticketId: string
): Promise<TicketStats | null> {
  const { data, error } = await supabase
    .from('ticket_stats_summary')
    .select('ticket_id, comments_count, attachments_count, status_changes_count, last_update_date, created_at')
    .eq('ticket_id', ticketId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    commentsCount: data.comments_count ?? 0,
    attachmentsCount: data.attachments_count ?? 0,
    statusChangesCount: data.status_changes_count ?? 0,
    lastUpdateDate: data.last_update_date ?? null,
    ageInDays: calculateAgeInDays(data.created_at ?? null)
  };
}

export async function loadTicketStats(
  ticketId: string,
  createdAt: string | null
): Promise<TicketStats> {
  const supabase = await createSupabaseServerClient();
  const summaryStats = await loadTicketStatsFromSummary(supabase, ticketId);
  if (summaryStats) return summaryStats;
  return loadTicketStatsWithClient(supabase, ticketId, createdAt);
}

export async function loadTicketStatsBatch(
  ticketIds: string[]
): Promise<Record<string, TicketStats>> {
  if (!ticketIds.length) {
    return {};
  }

  const supabase = await createSupabaseServerClient();

  const result: Record<string, TicketStats> = {};

  const { data: summaryRows } = await supabase
    .from('ticket_stats_summary')
    .select('ticket_id, comments_count, attachments_count, status_changes_count, last_update_date, created_at')
    .in('ticket_id', ticketIds);

  const missingIds = new Set(ticketIds);

  (summaryRows ?? []).forEach((row) => {
    if (!row || !row.ticket_id) return;
    result[row.ticket_id] = {
      commentsCount: row.comments_count ?? 0,
      attachmentsCount: row.attachments_count ?? 0,
      statusChangesCount: row.status_changes_count ?? 0,
      lastUpdateDate: row.last_update_date ?? null,
      ageInDays: calculateAgeInDays(row.created_at ?? null)
    };
    missingIds.delete(row.ticket_id);
  });

  if (missingIds.size > 0) {
    const missingArray = Array.from(missingIds);
    const { data: ticketsMeta } = await supabase
      .from('tickets')
      .select('id, created_at')
      .in('id', missingArray);

    const createdAtMap = new Map<string, string | null>();
    (ticketsMeta ?? []).forEach((ticket) => {
      if (ticket && 'id' in ticket) {
        createdAtMap.set(String(ticket.id), ticket.created_at || null);
      }
    });

    const fallbackEntries = await Promise.all(
      missingArray.map(async (ticketId) => {
        const stats = await loadTicketStatsWithClient(
          supabase,
          ticketId,
          createdAtMap.get(ticketId) ?? null
        );
        return [ticketId, stats] as const;
      })
    );

    fallbackEntries.forEach(([ticketId, stats]) => {
      result[ticketId] = stats;
    });
  }

  return result;
}

