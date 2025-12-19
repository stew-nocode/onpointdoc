/**
 * Service for ticket navigation (prev/next)
 *
 * Strategy: Chronological ordering by created_at
 * - Simple, reliable, no session state needed
 * - Can be enhanced later to respect filters
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdjacentTickets = {
  previous: string | null;
  next: string | null;
};

/**
 * Get adjacent ticket IDs (previous and next) based on chronological order
 *
 * @param ticketId - Current ticket ID
 * @returns Object with previous and next ticket IDs (null if none)
 */
export async function getAdjacentTickets(ticketId: string): Promise<AdjacentTickets> {
  const supabase = await createSupabaseServerClient();

  // Get current ticket's created_at timestamp
  const { data: currentTicket, error: currentError } = await supabase
    .from('tickets')
    .select('created_at')
    .eq('id', ticketId)
    .single();

  if (currentError || !currentTicket) {
    return { previous: null, next: null };
  }

  // Get previous ticket (older, created before current)
  const { data: prevTicket } = await supabase
    .from('tickets')
    .select('id')
    .lt('created_at', currentTicket.created_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get next ticket (newer, created after current)
  const { data: nextTicket } = await supabase
    .from('tickets')
    .select('id')
    .gt('created_at', currentTicket.created_at)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    previous: prevTicket?.id ?? null,
    next: nextTicket?.id ?? null
  };
}
