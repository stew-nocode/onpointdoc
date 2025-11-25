import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/handlers';
import { loadTicketStats } from '@/services/tickets/stats/ticket';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Route API pour récupérer les statistiques d'un ticket
 * GET /api/tickets/[id]/stats
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await context.params;
    const { id } = paramsData;

    const supabase = await createSupabaseServerClient();

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('created_at')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return handleApiError(new Error('Ticket non trouvé'));
    }

    const stats = await loadTicketStats(id, ticket.created_at);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return handleApiError(error);
  }
}

