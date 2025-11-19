import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Transfère un ticket Assistance vers JIRA via N8N
 * 
 * Workflow :
 * 1. Met à jour le statut du ticket à "Transféré" dans Supabase
 * 2. Enregistre dans jira_sync pour tracking
 * 3. Déclenche le webhook N8N qui créera le ticket JIRA
 * 
 * @param ticketId - UUID du ticket à transférer
 * @returns Le ticket mis à jour avec le statut "Transféré"
 */
export const transferTicketToJira = async (ticketId: string) => {
  const supabase = createSupabaseServerClient();

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

  // 4. Préparer les données pour N8N
  const n8nPayload = {
    ticket_id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    canal: ticket.canal,
    priority: ticket.priority,
    product_id: ticket.product_id,
    module_id: ticket.module_id,
    customer_context: ticket.customer_context,
    action: 'transfer_to_jira'
  };

  // 5. Appeler le webhook N8N (si configuré)
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nWebhookUrl) {
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload)
      });

      if (!response.ok) {
        console.error('Erreur lors de l\'appel au webhook N8N:', await response.text());
        // Ne pas faire échouer la transaction si N8N est down, le statut est déjà mis à jour
      } else {
        const n8nResponse = await response.json();
        // Si N8N retourne le jira_issue_key, l'enregistrer
        if (n8nResponse.jira_issue_key) {
          await supabase.from('jira_sync').upsert({
            ticket_id: ticketId,
            jira_issue_key: n8nResponse.jira_issue_key,
            origin: 'supabase',
            last_synced_at: new Date().toISOString()
          });

          // Mettre à jour le ticket avec le jira_issue_key
          await supabase
            .from('tickets')
            .update({ jira_issue_key: n8nResponse.jira_issue_key })
            .eq('id', ticketId);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel au webhook N8N:', error);
      // Ne pas faire échouer la transaction, le statut est déjà mis à jour
    }
  } else {
    console.warn('N8N_WEBHOOK_URL non configuré. Le transfert JIRA ne sera pas automatique.');
  }

  return updatedTicket;
};

/**
 * Récupère les détails complets d'un ticket avec ses relations
 */
export const getTicketById = async (ticketId: string) => {
  const supabase = createSupabaseServerClient();
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

