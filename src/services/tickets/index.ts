import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTicketInput } from '@/lib/validators/ticket';

export const createTicket = async (payload: CreateTicketInput) => {
  const supabase = createSupabaseServerClient();

  // Récupère team_id du profil courant pour peupler le ticket
  const {
    data: { user }
  } = await supabase.auth.getUser();
  let teamId: string | null = null;
  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', user.id)
      .single();
    teamId = (profile?.team_id as string | null) ?? null;
  }

  const { data, error } = await supabase.from('tickets').insert({
    title: payload.title,
    description: payload.description,
    ticket_type: payload.type,
    canal: payload.channel, // Colonne DB = 'canal' (pas 'channel')
    product_id: payload.productId ?? null,
    module_id: payload.moduleId ?? null,
    priority: payload.priority,
    duration_minutes: payload.durationMinutes,
    customer_context: payload.customerContext,
    team_id: teamId,
    status: payload.type === 'ASSISTANCE' ? 'Nouveau' : 'En_cours', // Aligné avec enum Supabase
    origin: 'supabase'
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = 'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue';

export const listTickets = async (type?: TicketTypeFilter, status?: TicketStatusFilter) => {
  const supabase = createSupabaseServerClient();
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

export const TICKET_STATUSES: TicketStatusFilter[] = ['Nouveau', 'En_cours', 'Transfere', 'Resolue'];

export const countTicketsByStatus = async (type: TicketTypeFilter) => {
  const supabase = createSupabaseServerClient();

  const results = await Promise.all(
    TICKET_STATUSES.map(async (s) => {
      const { count, error } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('ticket_type', type)
        .eq('status', s);
      if (error) {
        return [s, 0] as const;
      }
      return [s, count ?? 0] as const;
    })
  );

  const totals: Record<TicketStatusFilter, number> = {
    Nouveau: 0,
    En_cours: 0,
    Transfere: 0,
    Resolue: 0
  };
  results.forEach(([status, value]) => {
    totals[status] = value;
  });
  return totals;
};

