import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchJiraIssue, syncTicketFromJira } from '@/services/jira/sync-manual';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';
import { z } from 'zod';

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
    const paramsData = await params;
    const validationResult = z.object({ id: z.string().uuid() }).safeParse(paramsData);
    if (!validationResult.success) {
      return handleApiError(createError.validationError('ID de ticket invalide', {
        issues: validationResult.error.issues
      }));
    }
    const { id } = validationResult.data;
    const supabase = await createSupabaseServerClient();

    // Vérifier que le ticket existe et a une clé JIRA
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, title')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return handleApiError(createError.notFound('Ticket'));
    }

    if (!ticket.jira_issue_key) {
      return handleApiError(createError.validationError('Ce ticket n\'a pas de clé JIRA associée'));
    }

    // Synchroniser depuis JIRA
    const success = await syncTicketFromJira(ticket.jira_issue_key);

    if (!success) {
      return handleApiError(createError.jiraError('Erreur lors de la synchronisation depuis JIRA'));
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
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

