import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { QuickFilter } from '@/types/ticket-filters';
import { getInitialStatus } from '@/lib/utils/ticket-status';
import { createJiraIssue } from '@/services/jira/client';

export const createTicket = async (payload: CreateTicketInput) => {
  const supabase = await createSupabaseServerClient();
  // Récupérer le profil de l'utilisateur connecté pour created_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_uid', user.id)
    .single();
  if (!profile) throw new Error('Profil utilisateur introuvable');

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: payload.title,
      description: payload.description,
      ticket_type: payload.type,
      canal: payload.channel, // Colonne DB = 'canal' (pas 'channel')
      product_id: payload.productId ?? null,
      module_id: payload.moduleId ?? null,
      submodule_id: (payload.submoduleId && payload.submoduleId !== '') ? payload.submoduleId : null,
      feature_id: (payload.featureId && payload.featureId !== '') ? payload.featureId : null,
      priority: payload.priority,
      duration_minutes: payload.durationMinutes ?? null,
      customer_context: payload.customerContext,
      contact_user_id: payload.contactUserId,
      bug_type: payload.bug_type ?? null,
      created_by: profile.id, // ID du profil (pas auth.uid())
      status: getInitialStatus(payload.type), // Statut initial selon le type (JIRA pour BUG/REQ, local pour ASSISTANCE)
      origin: 'supabase'
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Pour BUG et REQ, créer immédiatement le ticket JIRA
  if (payload.type === 'BUG' || payload.type === 'REQ') {
    try {
      const jiraResponse = await createJiraIssue({
        ticketId: data.id,
        title: payload.title,
        description: payload.description,
        ticketType: payload.type,
        priority: payload.priority,
        canal: payload.channel,
        productId: payload.productId ?? undefined,
        moduleId: payload.moduleId ?? undefined,
        customerContext: payload.customerContext,
        bugType: payload.bug_type ?? undefined
      });

      if (jiraResponse.success && jiraResponse.jiraIssueKey) {
        // Mettre à jour le ticket avec la clé JIRA
        await supabase
          .from('tickets')
          .update({
            jira_issue_key: jiraResponse.jiraIssueKey,
            origin: 'supabase'
          })
          .eq('id', data.id);

        // Enregistrer dans jira_sync
        await supabase.from('jira_sync').upsert({
          ticket_id: data.id,
          jira_issue_key: jiraResponse.jiraIssueKey,
          origin: 'supabase',
          last_synced_at: new Date().toISOString()
        });
      } else {
        console.error('Erreur lors de la création du ticket JIRA:', jiraResponse.error);
        // Enregistrer l'erreur dans jira_sync pour diagnostic
        await supabase.from('jira_sync').upsert({
          ticket_id: data.id,
          jira_issue_key: null,
          origin: 'supabase',
          sync_error: jiraResponse.error || 'Erreur inconnue lors de la création JIRA',
          last_synced_at: new Date().toISOString()
        });
        // Ne pas faire échouer la création du ticket Supabase si JIRA échoue
        // Le ticket sera créé dans Supabase et pourra être synchronisé plus tard
      }
    } catch (jiraError) {
      console.error('Erreur lors de la création du ticket JIRA:', jiraError);
      // Enregistrer l'erreur dans jira_sync pour diagnostic
      const errorMessage = jiraError instanceof Error ? jiraError.message : 'Erreur inconnue';
      await supabase.from('jira_sync').upsert({
        ticket_id: data.id,
        jira_issue_key: null,
        origin: 'supabase',
        sync_error: errorMessage,
        last_synced_at: new Date().toISOString()
      });
      // Ne pas faire échouer la création du ticket Supabase
    }
  }

  return data;
};

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = string; // Accepte tous les statuts (JIRA ou locaux)

/**
 * @deprecated Utiliser getTicketStatuses() depuis @/lib/constants/tickets
 * Conservé pour compatibilité avec le code existant
 */
export const TICKET_STATUSES = ['Nouveau', 'En_cours', 'Transfere', 'Resolue', 'Sprint Backlog', 'Traitement en Cours', 'Test en Cours', 'Terminé(e)', 'Terminé'] as const;

export const listTickets = async (type?: TicketTypeFilter, status?: TicketStatusFilter) => {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('tickets')
    .select('id, title, ticket_type, status, priority, assigned_to, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (type) {
    query = query.eq('ticket_type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const listTicketsPaginated = async (
  type?: TicketTypeFilter,
  status?: TicketStatusFilter,
  offset: number = 0,
  limit: number = 25,
  search?: string,
  quickFilter?: QuickFilter,
  currentProfileId?: string | null
) => {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('tickets')
    .select(`
      id,
      title,
      description,
      ticket_type,
      status,
      priority,
      canal,
      jira_issue_key,
      origin,
      target_date,
      bug_type,
      created_at,
      created_by,
      created_user:profiles!tickets_created_by_fkey(id, full_name),
      assigned_to,
      assigned_user:profiles!tickets_assigned_to_fkey(id, full_name),
      product:products(id, name),
      module:modules(id, name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('ticket_type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }

  // Recherche textuelle dans titre, description et clé Jira
  if (search && search.trim().length > 0) {
    const searchTerm = `%${search.trim()}%`;
    // Utiliser .or() avec la syntaxe correcte pour Supabase
    // Format: "col1.op.val1,col2.op.val2" (sans guillemets autour des valeurs)
    query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},jira_issue_key.ilike.${searchTerm}`);
  }

  query = applyQuickFilter(query, quickFilter, { currentProfileId: currentProfileId ?? undefined });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Transformer les données : Supabase retourne des tableaux pour les relations, on veut des objets uniques
  const transformedTickets = (data || []).map((ticket: any) => ({
    ...ticket,
    created_user: Array.isArray(ticket.created_user) 
      ? ticket.created_user[0] || null 
      : ticket.created_user,
    assigned_user: Array.isArray(ticket.assigned_user) 
      ? ticket.assigned_user[0] || null 
      : ticket.assigned_user,
    product: Array.isArray(ticket.product) 
      ? ticket.product[0] || null 
      : ticket.product,
    module: Array.isArray(ticket.module) 
      ? ticket.module[0] || null 
      : ticket.module
  }));

  return {
    tickets: transformedTickets,
    hasMore: count ? offset + limit < count : false,
    total: count || 0
  };
};

export function applyQuickFilter(
  query: any,
  quickFilter?: QuickFilter,
  options?: { currentProfileId?: string }
) {
  if (!quickFilter) {
    return query;
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfMonthStr = firstDayOfMonth.toISOString().slice(0, 10);

  switch (quickFilter) {
    case 'mine':
      if (options?.currentProfileId) {
        return query.eq('assigned_to', options.currentProfileId);
      }
      return query;
    case 'unassigned':
      return query.is('assigned_to', null);
    case 'overdue':
      return query
        .not('target_date', 'eq', null)
        .lt('target_date', todayStr);
    case 'to_validate':
      return query.eq('status', 'Transfere');
    case 'week':
      return query.gte('created_at', startOfWeekStr);
    case 'month':
      return query.gte('created_at', firstDayOfMonthStr);
    default:
      return query;
  }
}


export async function countTicketsByStatus(type: TicketTypeFilter) {
  const supabase = await createSupabaseServerClient();
  
  // Utiliser un Record dynamique pour accepter tous les statuts (JIRA ou locaux)
  const result: Record<string, number> = {};
  
  const { data, error } = await supabase
    .from('tickets')
    .select('status')
    .eq('ticket_type', type)
    .limit(1000);
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Compter tous les statuts dynamiquement
  for (const row of data ?? []) {
    const status = (row as any).status as string | null;
    if (status) {
      result[status] = (result[status] || 0) + 1;
    }
  }
  
  return result;
}

