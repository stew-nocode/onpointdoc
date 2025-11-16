import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Route API pour recevoir les webhooks JIRA via N8N
 * 
 * Cette route est appelée par N8N après traitement des événements JIRA
 * pour mettre à jour Supabase avec les statuts, commentaires et assignations.
 * 
 * Note: En production, cette route devrait être sécurisée (authentification, validation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, ticket_id, jira_issue_key, updates } = body;

    if (!ticket_id || !jira_issue_key) {
      return NextResponse.json(
        { error: 'ticket_id et jira_issue_key requis' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Vérifier que le ticket existe
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour selon le type d'événement
    switch (event_type) {
      case 'status_changed':
        if (updates?.status) {
          await supabase
            .from('tickets')
            .update({
              status: updates.status,
              last_update_source: 'jira'
            })
            .eq('id', ticket_id);

          // Enregistrer dans l'historique
          if (updates.status_from && updates.status_to) {
            await supabase.from('ticket_status_history').insert({
              ticket_id,
              status_from: updates.status_from,
              status_to: updates.status_to,
              source: 'jira'
            });
          }
        }
        break;

      case 'comment_added':
        if (updates?.comment) {
          await supabase.from('ticket_comments').insert({
            ticket_id,
            content: updates.comment.content,
            origin: 'jira_comment',
            user_id: null // Peut être mappé depuis JIRA si nécessaire
          });
        }
        break;

      case 'assignee_changed':
        if (updates?.assigned_to_id) {
          await supabase
            .from('tickets')
            .update({
              assigned_to: updates.assigned_to_id,
              last_update_source: 'jira'
            })
            .eq('id', ticket_id);
        }
        break;
    }

    // Mettre à jour jira_sync
    await supabase
      .from('jira_sync')
      .upsert({
        ticket_id,
        jira_issue_key,
        origin: 'jira',
        last_synced_at: new Date().toISOString(),
        sync_error: null
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook JIRA:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

