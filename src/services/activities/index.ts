import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ActivityPayload = {
  title: string;
  activityType: 'REVUE' | 'BRAINSTORMING' | 'ATELIER' | 'DEMO';
  plannedStart: string;
  plannedEnd: string;
  linkedTicketIds?: string[];
};

export const createActivity = async (payload: ActivityPayload) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('activities')
    .insert({
      title: payload.title,
      activity_type: payload.activityType,
      planned_start: payload.plannedStart,
      planned_end: payload.plannedEnd,
      status: 'BROUILLON'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (payload.linkedTicketIds?.length) {
    const links = payload.linkedTicketIds.map((ticketId) => ({
      ticket_id: ticketId,
      activity_id: data.id
    }));
    await supabase.from('ticket_activity_link').insert(links);
  }

  return data;
};

