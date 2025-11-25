/**
 * Hook personnalisé pour charger un profil utilisateur spécifique
 * 
 * Utilise useSupabaseQuery pour charger un profil de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import type { Profile } from '@/types/profile';
import { fetchProfileById } from '@/services/fetchers';

type UseProfileResult = {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useProfile(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseProfileResult {
  const enabled = options.enabled ?? true;
  const shouldFetch = enabled && Boolean(userId);

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['profile', userId] : null,
    () => fetchProfileById(userId as string),
    {
      revalidateOnFocus: false
    }
  );

  return {
    profile: (data as Profile | null) ?? null,
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

