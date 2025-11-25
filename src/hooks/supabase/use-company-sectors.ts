/**
 * Hook personnalisé pour charger les secteurs d'une entreprise
 * 
 * Utilise useSupabaseQuery pour charger les secteurs de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import { fetchCompanySectorIds } from '@/services/fetchers';

type UseCompanySectorsResult = {
  sectorIds: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useCompanySectors(
  companyId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseCompanySectorsResult {
  const shouldFetch = (options.enabled ?? true) && Boolean(companyId);

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['company-sectors', companyId] : null,
    () => fetchCompanySectorIds(companyId as string),
    { revalidateOnFocus: false }
  );

  return {
    sectorIds: (data as string[] | undefined) ?? [],
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

