import type { Profile } from '@/types/profile';
import { getSupabaseBrowserClient, type SupabaseBrowserClient } from './client';

type ProfilesFetcherOptions = {
  client?: SupabaseBrowserClient;
};

const PROFILE_ERROR_PREFIX = '[fetchProfile]';

function resolveErrorMessage(defaultMessage: string, error?: { message?: string }): string {
  return error?.message ? `${PROFILE_ERROR_PREFIX} ${error.message}` : `${PROFILE_ERROR_PREFIX} ${defaultMessage}`;
}

export async function fetchProfileById(
  profileId: string,
  options: ProfilesFetcherOptions = {}
): Promise<Profile | null> {
  if (!profileId) {
    return null;
  }

  const supabase = getSupabaseBrowserClient(options.client);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    // PGRST116 = row not found
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(resolveErrorMessage('Erreur Supabase lors du chargement du profil', error));
  }

  return data as Profile;
}

export async function fetchProfilesByIds(
  profileIds: string[],
  options: ProfilesFetcherOptions = {}
): Promise<Profile[]> {
  if (!profileIds.length) {
    return [];
  }

  const supabase = getSupabaseBrowserClient(options.client);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', profileIds);

  if (error) {
    throw new Error(resolveErrorMessage('Erreur Supabase lors du chargement des profils', error));
  }

  return (data ?? []) as Profile[];
}
