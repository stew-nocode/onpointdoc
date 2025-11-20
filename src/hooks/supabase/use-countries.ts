/**
 * Hook personnalisé pour charger la liste des pays
 * 
 * Utilise useSupabaseQuery pour charger les pays de manière réutilisable
 */

'use client';

import { useSupabaseQuery } from './use-supabase-query';
import type { Country } from '@/types/country';

type UseCountriesResult = {
  countries: Country[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger la liste des pays depuis Supabase
 * 
 * @param options - Options de configuration
 * @returns Liste des pays avec état de chargement
 * 
 * @example
 * const { countries, isLoading } = useCountries();
 * if (isLoading) return <Loading />;
 * return <Select options={countries.map(c => ({ value: c.id, label: c.name }))} />;
 */
export function useCountries(options: { enabled?: boolean } = {}): UseCountriesResult {
  const { data, error, isLoading, refetch } = useSupabaseQuery<Country[]>({
    table: 'countries',
    select: 'id, name',
    orderBy: { column: 'name', ascending: true },
    enabled: options.enabled ?? true
  });

  return {
    countries: data ?? [],
    isLoading,
    error,
    refetch
  };
}

