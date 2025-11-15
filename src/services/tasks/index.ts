import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TaskPayload = {
  title: string;
  description?: string;
  dueDate?: string;
  linkedActivityId?: string;
  linkedTicketIds?: string[];
};

export const createTask = async (payload: TaskPayload) => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: payload.title,
      description: payload.description,
      due_date: payload.dueDate,
      status: 'A_FAIRE'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (payload.linkedActivityId) {
    await supabase.from('activity_task_link').insert({
      activity_id: payload.linkedActivityId,
      task_id: data.id
    });
  }

  if (payload.linkedTicketIds?.length) {
    const rows = payload.linkedTicketIds.map((ticketId) => ({
      ticket_id: ticketId,
      task_id: data.id
    }));
    await supabase.from('ticket_task_link').insert(rows);
  }

  return data;
};

