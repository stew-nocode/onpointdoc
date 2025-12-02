/**
 * Service optimisé pour compter les tickets par période
 * 
 * OPTIMISATION : Au lieu de faire N requêtes (une par date),
 * on récupère TOUS les tickets de la période en une seule requête,
 * puis on groupe par date dans JavaScript.
 * 
 * Gain : 24 requêtes → 1 requête = 96% de réduction
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TicketCount = {
  bugs: number;
  reqs: number;
  assistances: number;
};

export type TicketRaw = {
  id: string;
  created_at: string;
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
  created_by: string | null;
  resolved_at: string | null;
  duration_minutes: number | null;
};

/**
 * Récupère TOUS les tickets de la période en une seule requête
 */
async function fetchAllTicketsInPeriod(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
  endDate: Date,
  agentIds?: string[]
): Promise<TicketRaw[]> {
  try {
    let query = supabase
      .from('tickets')
      .select('id, created_at, ticket_type, created_by, resolved_at, duration_minutes')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Filtrer par agent si spécifié
    if (agentIds && agentIds.length > 0) {
      query = query.in('created_by', agentIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupportEvolutionV2] Error fetching all tickets:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }

    return (data || []) as TicketRaw[];
  } catch (err) {
    console.error('[SupportEvolutionV2] Exception fetching all tickets:', err);
    return [];
  }
}

/**
 * Groupe les tickets par période (date) et compte par type
 */
function groupTicketsByDateRange(
  tickets: TicketRaw[],
  dateRanges: Array<{ date: string; start: Date; end: Date }>
): Map<string, TicketCount> {
  const result = new Map<string, TicketCount>();

  // Initialiser toutes les dates avec 0
  dateRanges.forEach(({ date }) => {
    result.set(date, { bugs: 0, reqs: 0, assistances: 0 });
  });

  // Grouper les tickets par date
  tickets.forEach((ticket) => {
    const ticketDate = new Date(ticket.created_at);

    // Trouver dans quelle plage de dates ce ticket appartient
    for (const { date, start, end } of dateRanges) {
      if (ticketDate >= start && ticketDate <= end) {
        const counts = result.get(date) || { bugs: 0, reqs: 0, assistances: 0 };
        
        switch (ticket.ticket_type) {
          case 'BUG':
            counts.bugs++;
            break;
          case 'REQ':
            counts.reqs++;
            break;
          case 'ASSISTANCE':
            counts.assistances++;
            break;
        }
        
        result.set(date, counts);
        break;
      }
    }
  });

  return result;
}

/**
 * Calcule le temps d'assistance total par période
 */
function groupAssistanceTimeByDateRange(
  tickets: TicketRaw[],
  dateRanges: Array<{ date: string; start: Date; end: Date }>
): Map<string, number> {
  const result = new Map<string, number>();

  // Initialiser toutes les dates avec 0
  dateRanges.forEach(({ date }) => {
    result.set(date, 0);
  });

  // Filtrer seulement les tickets ASSISTANCE résolus avec duration_minutes
  const assistanceTickets = tickets.filter(
    (ticket) =>
      ticket.ticket_type === 'ASSISTANCE' &&
      ticket.resolved_at &&
      ticket.duration_minutes !== null &&
      ticket.duration_minutes !== undefined
  );

  // Grouper par date de résolution
  assistanceTickets.forEach((ticket) => {
    if (!ticket.resolved_at) return;

    const resolvedDate = new Date(ticket.resolved_at);

    // Trouver dans quelle plage de dates cette résolution appartient
    for (const { date, start, end } of dateRanges) {
      if (resolvedDate >= start && resolvedDate <= end) {
        const currentTime = result.get(date) || 0;
        result.set(date, currentTime + (ticket.duration_minutes || 0));
        break;
      }
    }
  });

  return result;
}

/**
 * Compte les tickets par type pour plusieurs périodes en une seule requête
 * 
 * OPTIMISATION : Une seule requête au lieu de N requêtes (une par période)
 */
export async function countTicketsByDateRanges(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  dateRanges: Array<{ date: string; start: Date; end: Date }>,
  agentIds?: string[]
): Promise<Map<string, TicketCount>> {
  try {
    // Trouver la période globale (min start, max end)
    const globalStart = dateRanges.reduce(
      (min, range) => (range.start < min ? range.start : min),
      dateRanges[0]?.start || new Date()
    );
    const globalEnd = dateRanges.reduce(
      (max, range) => (range.end > max ? range.end : max),
      dateRanges[0]?.end || new Date()
    );

    // Une seule requête pour récupérer TOUS les tickets de la période globale
    const allTickets = await fetchAllTicketsInPeriod(supabase, globalStart, globalEnd, agentIds);

    if (process.env.NODE_ENV === 'development') {
      console.log('[SupportEvolutionV2] Fetched all tickets:', {
        totalTickets: allTickets.length,
        dateRangesCount: dateRanges.length,
        globalStart: globalStart.toISOString(),
        globalEnd: globalEnd.toISOString(),
      });
    }

    // Grouper par date dans JavaScript (beaucoup plus rapide)
    return groupTicketsByDateRange(allTickets, dateRanges);
  } catch (error) {
    console.error('[SupportEvolutionV2] Error in countTicketsByDateRanges:', error);
    // Retourner un map vide en cas d'erreur
    return new Map();
  }
}

/**
 * Calcule le temps d'assistance par période en une seule requête
 */
export async function calculateAssistanceTimeByDateRanges(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  dateRanges: Array<{ date: string; start: Date; end: Date }>,
  agentIds?: string[]
): Promise<Map<string, number>> {
  try {
    // Trouver la période globale (min start, max end)
    const globalStart = dateRanges.reduce(
      (min, range) => (range.start < min ? range.start : min),
      dateRanges[0]?.start || new Date()
    );
    const globalEnd = dateRanges.reduce(
      (max, range) => (range.end > max ? range.end : max),
      dateRanges[0]?.end || new Date()
    );

    // Une seule requête pour récupérer TOUS les tickets ASSISTANCE de la période
    let query = supabase
      .from('tickets')
      .select('id, created_at, ticket_type, created_by, resolved_at, duration_minutes')
      .eq('ticket_type', 'ASSISTANCE')
      .not('resolved_at', 'is', null)
      .not('duration_minutes', 'is', null)
      .gte('resolved_at', globalStart.toISOString())
      .lte('resolved_at', globalEnd.toISOString())
      .in('status', ['Resolue', 'Résolu', 'Terminé', 'Terminé(e)', 'Termine']);

    // Filtrer par agent si spécifié
    if (agentIds && agentIds.length > 0) {
      query = query.in('created_by', agentIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupportEvolutionV2] Error fetching assistance tickets:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return new Map();
    }

    const tickets = (data || []) as TicketRaw[];

    if (process.env.NODE_ENV === 'development') {
      console.log('[SupportEvolutionV2] Fetched assistance tickets:', {
        totalTickets: tickets.length,
        dateRangesCount: dateRanges.length,
      });
    }

    // Grouper par date dans JavaScript
    return groupAssistanceTimeByDateRange(tickets, dateRanges);
  } catch (error) {
    console.error('[SupportEvolutionV2] Error in calculateAssistanceTimeByDateRanges:', error);
    return new Map();
  }
}

