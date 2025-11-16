import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ActivityPayload = {
  title: string;
  activityType: 'REVUE' | 'BRAINSTORMING' | 'ATELIER' | 'DEMO';
  plannedStart: string;
  plannedEnd: string;
  linkedTicketIds?: string[];
};

export const createActivity = async (payload: ActivityPayload) => {
  const supabase = createSupabaseServerClient();

  // Renseigner team_id depuis le profil courant
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

  const { data, error } = await supabase
    .from('activities')
    .insert({
      title: payload.title,
      activity_type: payload.activityType,
      planned_start: payload.plannedStart,
      planned_end: payload.plannedEnd,
      team_id: teamId,
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

