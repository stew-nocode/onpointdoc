import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchJiraIssue, syncTicketFromJira } from '@/services/jira/sync-manual';

/**
 * Route API pour synchroniser manuellement un ticket depuis JIRA
 * 
 * GET /api/tickets/[id]/sync-jira
 * 
 * Récupère les données JIRA du ticket et synchronise vers Supabase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Vérifier que le ticket existe et a une clé JIRA
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, title')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    if (!ticket.jira_issue_key) {
      return NextResponse.json(
        { error: 'Ce ticket n\'a pas de clé JIRA associée' },
        { status: 400 }
      );
    }

    // Synchroniser depuis JIRA
    const success = await syncTicketFromJira(ticket.jira_issue_key);

    if (!success) {
      return NextResponse.json(
        { error: 'Erreur lors de la synchronisation depuis JIRA' },
        { status: 500 }
      );
    }

    // Récupérer le ticket mis à jour
    const { data: updatedTicket } = await supabase
      .from('tickets')
      .select('id, status, jira_issue_key')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Ticket synchronisé avec succès',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

