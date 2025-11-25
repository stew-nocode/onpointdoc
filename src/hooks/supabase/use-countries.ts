/**
 * Hook personnalisé pour charger la liste des pays
 * 
 * Utilise useSupabaseQuery pour charger les pays de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import type { Country } from '@/types/country';
import { fetchCountries } from '@/services/fetchers';

type UseCountriesResult = {
  countries: Country[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useCountries(options: { enabled?: boolean } = {}): UseCountriesResult {
  const shouldFetch = options.enabled ?? true;

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['countries'] : null,
    () => fetchCountries(),
    { revalidateOnFocus: false }
  );

  return {
    countries: (data as Country[] | undefined) ?? [],
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

