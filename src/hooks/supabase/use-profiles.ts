/**
 * Hook personnalisé pour charger la liste des profils utilisateurs
 * 
 * Utilise useSupabaseQuery pour charger les profils de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import type { Profile } from '@/types/profile';
import { fetchProfilesList } from '@/services/fetchers';

type ProfileOption = {
  id: string;
  label: string;
};

type UseProfilesOptions = {
  limit?: number;
  enabled?: boolean;
  asOptions?: boolean;
};

type UseProfilesResult = {
  profiles: Profile[];
  profileOptions: ProfileOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useProfiles(options: UseProfilesOptions = {}): UseProfilesResult {
  const {
    limit = 200,
    enabled = true,
    asOptions = false
  } = options;

  const shouldFetch = enabled;

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['profiles', limit] : null,
    () => fetchProfilesList({ limit }),
    { revalidateOnFocus: false }
  );

  const profiles = (data as Profile[] | undefined) ?? [];

  const profileOptions: ProfileOption[] = asOptions
    ? profiles.map((profile) => ({
        id: profile.id,
        label: profile.full_name || profile.email || 'Utilisateur'
      }))
    : [];

  return {
    profiles,
    profileOptions,
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

