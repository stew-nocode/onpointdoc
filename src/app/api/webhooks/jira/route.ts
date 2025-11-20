import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { syncJiraToSupabase, JiraIssueData } from '@/services/jira';
import type { TicketType } from '@/types/ticket';
import { handleApiError } from '@/lib/errors/handlers';
import { createError } from '@/lib/errors/types';

/**
 * Route API pour recevoir les webhooks JIRA
 * 
 * Supporte trois formats :
 * 1. Format webhook JIRA natif : { webhookEvent, issue, ... }
 * 2. Format simplifié (legacy) : { event_type, ticket_id, jira_issue_key, updates }
 * 3. Format complet (Phase 1) : { ticket_id, jira_data: JiraIssueData }
 * 
 * Note: En production, cette route devrait être sécurisée (authentification, validation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Nouveau : Gérer le format webhook JIRA natif
    const webhookEvent = body.webhookEvent; // "jira:issue_created" ou "jira:issue_updated"
    const jiraIssue = body.issue;
    const jiraIssueKey = jiraIssue?.key;
    
    // Filtrer uniquement les tickets du projet OD (ignorer OBCS et autres projets)
    if (jiraIssueKey && !jiraIssueKey.startsWith('OD-')) {
      console.log(`[Webhook JIRA] Ticket ignoré (projet non OD): ${jiraIssueKey}`);
      return NextResponse.json({
        success: true,
        message: 'Ticket ignoré (projet non OD)',
        action: 'ignored',
        jira_issue_key: jiraIssueKey
      });
    }
    
    // Si c'est un webhook JIRA natif, transformer les données
    if (webhookEvent && jiraIssue) {
      // Utiliser Service Role pour contourner les RLS (webhook externe)
      const supabase = createSupabaseServiceRoleClient();

      // Transformer le format JIRA webhook vers notre format JiraIssueData
      const jiraData: JiraIssueData = {
        key: jiraIssue.key,
        id: jiraIssue.id,
        summary: jiraIssue.fields?.summary || '',
        description: typeof jiraIssue.fields?.description === 'string'
          ? jiraIssue.fields.description
          : JSON.stringify(jiraIssue.fields?.description || {}),
        status: {
          name: jiraIssue.fields?.status?.name || ''
        },
        priority: {
          name: jiraIssue.fields?.priority?.name || ''
        },
        issuetype: {
          name: jiraIssue.fields?.issuetype?.name || ''
        },
        reporter: jiraIssue.fields?.reporter
          ? {
              accountId: jiraIssue.fields.reporter.accountId,
              displayName: jiraIssue.fields.reporter.displayName
            }
          : undefined,
        assignee: jiraIssue.fields?.assignee
          ? {
              accountId: jiraIssue.fields.assignee.accountId,
              displayName: jiraIssue.fields.assignee.displayName
            }
          : undefined,
        resolution: jiraIssue.fields?.resolution
          ? {
              name: jiraIssue.fields.resolution.name
            }
          : undefined,
        fixVersions: jiraIssue.fields?.fixVersions?.map((fv: any) => ({ name: fv.name })) || [],
        created: jiraIssue.fields?.created || '',
        updated: jiraIssue.fields?.updated || '',
        labels: jiraIssue.fields?.labels || [],
        components: jiraIssue.fields?.components?.map((c: any) => ({ name: c.name })) || [],
        // Custom fields
        customfield_10020: jiraIssue.fields?.customfield_10020,
        customfield_10021: jiraIssue.fields?.customfield_10021,
        customfield_10045: jiraIssue.fields?.customfield_10045,
        customfield_10052: jiraIssue.fields?.customfield_10052,
        customfield_10053: jiraIssue.fields?.customfield_10053,
        customfield_10054: jiraIssue.fields?.customfield_10054,
        customfield_10055: jiraIssue.fields?.customfield_10055,
        customfield_10057: jiraIssue.fields?.customfield_10057,
        customfield_10083: jiraIssue.fields?.customfield_10083,
        customfield_10084: jiraIssue.fields?.customfield_10084,
        customfield_10111: jiraIssue.fields?.customfield_10111,
        customfield_10115: jiraIssue.fields?.customfield_10115
      };

      // Chercher le ticket par jira_issue_key
      const { data: existingTicket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, ticket_type')
        .eq('jira_issue_key', jiraIssueKey)
        .single();

      if (existingTicket) {
        // Ticket existe : synchroniser (mise à jour statut, assignation, etc.)
        try {
          // Passer le client Service Role pour contourner les RLS
          await syncJiraToSupabase(existingTicket.id, jiraData, supabase);
          return NextResponse.json({
            success: true,
            message: 'Ticket synchronisé avec succès',
            action: 'updated'
          });
        } catch (syncError: unknown) {
          return handleApiError(createError.jiraError('Erreur lors de la synchronisation du ticket depuis JIRA', syncError instanceof Error ? syncError : undefined));
        }
      } else if (ticketError?.code === 'PGRST116') {
        // Ticket n'existe pas (PGRST116 = no rows returned) : créer
        try {
          await createTicketFromJira(jiraData, supabase);
          return NextResponse.json({
            success: true,
            message: 'Ticket créé depuis JIRA avec succès',
            action: 'created'
          });
        } catch (createErr: unknown) {
          return handleApiError(createError.jiraError('Erreur lors de la création du ticket depuis JIRA', createErr instanceof Error ? createErr : undefined));
        }
      } else {
        // Autre erreur
        return handleApiError(createError.supabaseError('Erreur lors de la recherche du ticket', ticketError ? new Error(ticketError.message) : undefined));
      }
    }

    // Format complet avec jira_data (Phase 1) - Compatibilité
    const { ticket_id, jira_data } = body;
    if (ticket_id && jira_data) {
      // Filtrer uniquement les tickets du projet OD (ignorer OBCS et autres projets)
      const jiraKey = (jira_data as JiraIssueData)?.key;
      if (jiraKey && !jiraKey.startsWith('OD-')) {
        console.log(`[Webhook JIRA] Ticket ignoré (projet non OD): ${jiraKey}`);
        return NextResponse.json({
          success: true,
          message: 'Ticket ignoré (projet non OD)',
          action: 'ignored',
          jira_issue_key: jiraKey
        });
      }

      // Utiliser Service Role pour contourner les RLS (webhook externe)
      const supabase = createSupabaseServiceRoleClient();

      // Vérifier que le ticket existe
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, jira_issue_key, ticket_type')
        .eq('id', ticket_id)
        .single();

      if (ticketError || !ticket) {
        return handleApiError(createError.notFound('Ticket'));
      }

      try {
        // Passer le client Service Role pour contourner les RLS
        await syncJiraToSupabase(ticket_id, jira_data as JiraIssueData, supabase);
        return NextResponse.json({ success: true, message: 'Synchronisation complète réussie' });
      } catch (syncError: unknown) {
        return handleApiError(createError.jiraError('Erreur lors de la synchronisation complète depuis JIRA', syncError instanceof Error ? syncError : undefined));
      }
    }

    // Format simplifié (legacy) - Compatibilité avec l'ancien workflow
    const { event_type, jira_issue_key, updates } = body;
    if (event_type && jira_issue_key) {
      // Filtrer uniquement les tickets du projet OD (ignorer OBCS et autres projets)
      if (!jira_issue_key.startsWith('OD-')) {
        console.log(`[Webhook JIRA] Ticket ignoré (projet non OD): ${jira_issue_key}`);
        return NextResponse.json({
          success: true,
          message: 'Ticket ignoré (projet non OD)',
          action: 'ignored',
          jira_issue_key: jira_issue_key
        });
      }

      // Utiliser Service Role pour contourner les RLS (webhook externe)
      const supabase = createSupabaseServiceRoleClient();

      // Trouver le ticket par jira_issue_key
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, jira_issue_key, ticket_type')
        .eq('jira_issue_key', jira_issue_key)
        .single();

      if (ticketError || !ticket) {
        return handleApiError(createError.notFound('Ticket'));
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
              .eq('id', ticket.id);

            // Enregistrer dans l'historique
            if (updates.status_from && updates.status_to) {
              await supabase.from('ticket_status_history').insert({
                ticket_id: ticket.id,
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
              ticket_id: ticket.id,
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
              .eq('id', ticket.id);
          }
          break;
      }

      // Mettre à jour jira_sync (format simplifié)
      await supabase
        .from('jira_sync')
        .upsert({
          ticket_id: ticket.id,
          jira_issue_key,
          origin: 'jira',
          last_synced_at: new Date().toISOString(),
          sync_error: null
        });

      return NextResponse.json({ success: true });
    }

    // Si aucun format reconnu
    return handleApiError(createError.validationError('Format de webhook non reconnu'));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

/**
 * Mappe le type d'issue Jira vers le type de ticket Supabase
 */
function mapJiraIssueTypeToTicketType(jiraIssueType: string): TicketType {
  const upperType = jiraIssueType.toUpperCase();
  if (upperType.includes('BUG')) {
    return 'BUG';
  }
  if (upperType.includes('REQ') || upperType.includes('REQUEST') || upperType.includes('STORY') || upperType.includes('REQUÊTE')) {
    return 'REQ';
  }
  return 'ASSISTANCE';
}

/**
 * Mappe un accountId Jira vers un profile_id Supabase
 */
async function mapJiraAccountIdToProfileId(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  jiraAccountId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('jira_user_id', jiraAccountId)
    .single();

  if (error || !data) {
    console.warn(`Aucun profil trouvé pour le jira_user_id "${jiraAccountId}"`);
    return null;
  }

  return data.id;
}

/**
 * Crée un ticket dans Supabase depuis les données JIRA
 * 
 * @param jiraData - Données du ticket JIRA
 * @param supabase - Client Supabase (Service Role)
 */
async function createTicketFromJira(
  jiraData: JiraIssueData,
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>
): Promise<void> {
  // Déterminer le type de ticket
  const ticketType = mapJiraIssueTypeToTicketType(jiraData.issuetype.name);

  // Mapper le reporter (créateur du ticket)
  const createdBy = jiraData.reporter?.accountId
    ? await mapJiraAccountIdToProfileId(supabase, jiraData.reporter.accountId)
    : null;

  // Mapper l'assigné
  const assignedTo = jiraData.assignee?.accountId
    ? await mapJiraAccountIdToProfileId(supabase, jiraData.assignee.accountId)
    : null;

  // Créer le ticket dans Supabase
  const { data: newTicket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      title: jiraData.summary,
      description: jiraData.description || null,
      ticket_type: ticketType,
      status: jiraData.status.name, // Pour BUG/REQ, stocker directement le statut JIRA
      priority: 'Medium', // Par défaut, sera mis à jour par syncJiraToSupabase si priorité disponible
      jira_issue_key: jiraData.key,
      origin: 'jira',
      created_by: createdBy,
      assigned_to: assignedTo,
      created_at: jiraData.created || new Date().toISOString(),
      updated_at: jiraData.updated || new Date().toISOString(),
      last_update_source: 'jira'
    })
    .select('id')
    .single();

  if (ticketError || !newTicket) {
    throw new Error(`Erreur lors de la création du ticket: ${ticketError?.message || 'Unknown error'}`);
  }

  // Utiliser syncJiraToSupabase pour compléter les données (priorité, produits, modules, etc.)
  // Cela garantit que tous les champs sont correctement mappés
  // Passer le client Service Role pour contourner les RLS
  await syncJiraToSupabase(newTicket.id, jiraData, supabase);
}

