import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTicketInput } from '@/lib/validators/ticket';

export const createTicket = async (payload: CreateTicketInput) => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: payload.title,
      description: payload.description,
      ticket_type: payload.type,
      canal: payload.channel, // Colonne DB = 'canal' (pas 'channel')
      product_id: payload.productId ?? null,
      module_id: payload.moduleId ?? null,
      priority: payload.priority,
      duration_minutes: payload.durationMinutes,
      customer_context: payload.customerContext,
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

