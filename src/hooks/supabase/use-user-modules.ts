/**
 * Hook personnalisé pour charger les modules assignés à un utilisateur
 * 
 * Utilise useSupabaseQuery pour charger les modules de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import { fetchUserModuleIds } from '@/services/fetchers';

type UseUserModulesResult = {
  moduleIds: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useUserModules(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseUserModulesResult {
  const enabled = options.enabled ?? true;
  const shouldFetch = enabled && Boolean(userId);

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['user-modules', userId] : null,
    () => fetchUserModuleIds(userId as string),
    { revalidateOnFocus: false }
  );

  return {
    moduleIds: (data as string[] | undefined) ?? [],
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

