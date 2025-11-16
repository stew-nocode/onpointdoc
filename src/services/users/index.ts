import { createSupabaseServerClient } from '@/lib/supabase/server';

export type BasicProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function listBasicProfiles(limit = 100): Promise<BasicProfile[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name', { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}


