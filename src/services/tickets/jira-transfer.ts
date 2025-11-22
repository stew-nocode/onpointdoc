import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createJiraIssue } from '@/services/jira/client';

/**
 * Transfère un ticket Assistance vers JIRA (appel direct à l'API JIRA)
 * 
 * Workflow :
 * 1. Met à jour le statut du ticket à "Transféré" dans Supabase
 * 2. Crée le ticket JIRA directement via l'API JIRA
 * 3. Enregistre dans jira_sync pour tracking
 * 4. Après transfert, le ticket ASSISTANCE utilisera les statuts JIRA
 * 
 * @param ticketId - UUID du ticket à transférer
 * @returns Le ticket mis à jour avec le statut "Transféré" et la clé JIRA
 */
export const transferTicketToJira = async (ticketId: string) => {
  const supabase = await createSupabaseServerClient();

  // 1. Récupérer le ticket pour vérifier qu'il est bien une ASSISTANCE et en statut "En_cours"
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, ticket_type, status, title, description, canal, priority, product_id, module_id, customer_context')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    throw new Error(`Ticket non trouvé: ${ticketError?.message ?? 'Ticket introuvable'}`);
  }

  if (ticket.ticket_type !== 'ASSISTANCE') {
    throw new Error('Seuls les tickets ASSISTANCE peuvent être transférés vers JIRA');
  }

  if (ticket.status !== 'En_cours') {
    throw new Error('Le ticket doit être en statut "En_cours" pour être transféré');
  }

  // 2. Mettre à jour le statut à "Transféré"
  const { data: updatedTicket, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'Transfere',
      last_update_source: 'supabase'
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour du statut: ${updateError.message}`);
  }

  // 3. Enregistrer dans ticket_status_history
  await supabase.from('ticket_status_history').insert({
    ticket_id: ticketId,
    status_from: 'En_cours',
    status_to: 'Transfere',
    source: 'supabase'
  });

  // 4. Créer le ticket JIRA directement (sans N8N)
  try {
    const jiraResponse = await createJiraIssue({
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description || '',
      ticketType: 'BUG', // Les ASSISTANCE transférés deviennent des BUG dans JIRA
      priority: ticket.priority as 'Low' | 'Medium' | 'High' | 'Critical',
      canal: ticket.canal || null,
      productId: ticket.product_id || undefined,
      moduleId: ticket.module_id || undefined,
      customerContext: ticket.customer_context || undefined
    });

    if (jiraResponse.success && jiraResponse.jiraIssueKey) {
      // Mettre à jour le ticket avec la clé JIRA
      await supabase
        .from('tickets')
        .update({ jira_issue_key: jiraResponse.jiraIssueKey })
        .eq('id', ticketId);

      // Enregistrer dans jira_sync
      await supabase.from('jira_sync').upsert({
        ticket_id: ticketId,
        jira_issue_key: jiraResponse.jiraIssueKey,
        origin: 'supabase',
        last_synced_at: new Date().toISOString()
      });

      // Upload des pièces jointes vers JIRA
      try {
        const { uploadTicketAttachmentsToJira } = await import('@/services/jira/attachments/upload');
        await uploadTicketAttachmentsToJira(jiraResponse.jiraIssueKey, ticketId);
      } catch (attachmentError) {
        // Ne pas faire échouer le transfert si l'upload des pièces jointes échoue
        // L'erreur est silencieuse car le ticket principal a été créé avec succès
      }
    } else {
      throw new Error(`Impossible de créer le ticket JIRA: ${jiraResponse.error || 'Erreur inconnue'}`);
    }
  } catch (error) {
    // Re-lancer l'erreur pour que l'utilisateur soit informé
    throw new Error(`Erreur lors du transfert vers JIRA: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }

  return updatedTicket;
};

/**
 * Récupère les détails complets d'un ticket avec ses relations
 */
export const getTicketById = async (ticketId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      product:products(id, name),
      module:modules(id, name),
      jira_sync:jira_sync(jira_issue_key, last_synced_at, sync_error)
    `)
    .eq('id', ticketId)
    .single();

  if (error) {
    throw new Error(`Erreur lors de la récupération du ticket: ${error.message}`);
  }

  return data;
};

