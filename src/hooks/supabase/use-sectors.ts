/**
 * Hook personnalisé pour charger la liste des secteurs
 * 
 * Utilise useSupabaseQuery pour charger les secteurs de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import { fetchSectors } from '@/services/fetchers';

type Sector = {
  id: string;
  name: string;
};

type UseSectorsResult = {
  sectors: Sector[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useSectors(options: { enabled?: boolean } = {}): UseSectorsResult {
  const shouldFetch = options.enabled ?? true;

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['sectors'] : null,
    () => fetchSectors(),
    { revalidateOnFocus: false }
  );

  return {
    sectors: (data as Sector[] | undefined) ?? [],
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

