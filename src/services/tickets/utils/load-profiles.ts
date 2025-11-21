import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ProfileBasic = {
  id: string;
  full_name: string | null;
  email: string | null;
};

/**
 * Charge les profils utilisateurs par leurs IDs
 * 
 * @param userIds - Tableau d'IDs d'utilisateurs
 * @returns Map des profils par ID
 */
export async function loadProfilesByIds(
  userIds: string[]
): Promise<Map<string, ProfileBasic>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  return new Map((profiles || []).map((p) => [p.id, p]));
}

