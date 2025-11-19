import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { TicketTypeFilter, TicketStatusFilter } from '@/lib/constants/tickets';
import { TICKET_STATUSES } from '@/lib/constants/tickets';

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
      created_by: profile.id, // ID du profil (pas auth.uid())
      status: payload.type === 'ASSISTANCE' ? 'Nouveau' : 'En_cours', // Aligné avec enum Supabase
      origin: 'supabase'
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Types et constantes exportés depuis @/lib/constants/tickets pour éviter les imports serveur côté client
export type { TicketTypeFilter, TicketStatusFilter } from '@/lib/constants/tickets';
export { TICKET_STATUSES } from '@/lib/constants/tickets';

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
  search?: string
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
      created_at,
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

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Normaliser les données : s'assurer que assigned_user, product et module sont des objets ou null
  const normalizedTickets = (data || []).map((ticket: any) => ({
    ...ticket,
    assigned_user: Array.isArray(ticket.assigned_user) 
      ? (ticket.assigned_user[0] || null)
      : ticket.assigned_user || null,
    product: Array.isArray(ticket.product)
      ? (ticket.product[0] || null)
      : ticket.product || null,
    module: Array.isArray(ticket.module)
      ? (ticket.module[0] || null)
      : ticket.module || null
  }));

  return {
    tickets: normalizedTickets,
    hasMore: count ? offset + limit < count : false,
    total: count || 0
  };
};

export async function countTicketsByStatus(type: TicketTypeFilter) {
  const supabase = await createSupabaseServerClient();
  const result: Record<(typeof TICKET_STATUSES)[number], number> = {
    Nouveau: 0,
    En_cours: 0,
    Transfere: 0,
    Resolue: 0
  };
  const { data, error } = await supabase
    .from('tickets')
    .select('status')
    .eq('ticket_type', type)
    .limit(1000);
  if (error) {
    throw new Error(error.message);
  }
  for (const row of data ?? []) {
    const status = (row as any).status as (typeof TICKET_STATUSES)[number] | null;
    if (status && status in result) {
      result[status] += 1;
    }
  }
  return result;
}

