import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTicketInput } from '@/lib/validators/ticket';

export const createTicket = async (payload: CreateTicketInput) => {
  const supabase = createSupabaseServerClient();
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
    status: payload.type === 'ASSISTANCE' ? 'Nouveau' : 'En_cours', // Aligné avec enum Supabase
    origin: 'supabase'
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const listTickets = async () => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('id, title, ticket_type, status, priority, assigned_to, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

