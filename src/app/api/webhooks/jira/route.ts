import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { syncJiraToSupabase, JiraIssueData } from '@/services/jira';

/**
 * Route API pour recevoir les webhooks JIRA via N8N
 * 
 * Cette route est appelée par N8N après traitement des événements JIRA
 * pour mettre à jour Supabase avec les statuts, commentaires et assignations.
 * 
 * Supporte deux formats :
 * 1. Format simplifié (legacy) : { event_type, ticket_id, jira_issue_key, updates }
 * 2. Format complet (Phase 1) : { ticket_id, jira_data: JiraIssueData }
 * 
 * Note: En production, cette route devrait être sécurisée (authentification, validation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, ticket_id, jira_issue_key, updates, jira_data } = body;

    if (!ticket_id) {
      return NextResponse.json(
        { error: 'ticket_id requis' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Vérifier que le ticket existe
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, ticket_type')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    // Format complet avec jira_data (Phase 1)
    if (jira_data) {
      try {
        await syncJiraToSupabase(ticket_id, jira_data as JiraIssueData);
        return NextResponse.json({ success: true, message: 'Synchronisation complète réussie' });
      } catch (syncError) {
        console.error('Erreur lors de la synchronisation complète:', syncError);
        return NextResponse.json(
          { error: 'Erreur de synchronisation', message: syncError instanceof Error ? syncError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    // Format simplifié (legacy) - Compatibilité avec l'ancien workflow
    if (!jira_issue_key) {
      return NextResponse.json(
        { error: 'jira_issue_key requis pour le format simplifié' },
        { status: 400 }
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

    // Mettre à jour jira_sync (format simplifié)
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

