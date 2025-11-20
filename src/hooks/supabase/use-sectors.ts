/**
 * Hook personnalisé pour charger la liste des secteurs
 * 
 * Utilise useSupabaseQuery pour charger les secteurs de manière réutilisable
 */

'use client';

import { useSupabaseQuery } from './use-supabase-query';

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

/**
 * Hook pour charger la liste des secteurs depuis Supabase
 * 
 * @param options - Options de configuration
 * @returns Liste des secteurs avec état de chargement
 * 
 * @example
 * const { sectors, isLoading } = useSectors();
 * if (isLoading) return <Loading />;
 * return <Select options={sectors.map(s => ({ value: s.id, label: s.name }))} />;
 */
export function useSectors(options: { enabled?: boolean } = {}): UseSectorsResult {
  const { data, error, isLoading, refetch } = useSupabaseQuery<Sector[]>({
    table: 'sectors',
    select: 'id, name',
    orderBy: { column: 'name', ascending: true },
    enabled: options.enabled ?? true
  });

  return {
    sectors: data ?? [],
    isLoading,
    error,
    refetch
  };
}

