/**
 * Hook personnalisé pour charger les secteurs d'une entreprise
 * 
 * Utilise useSupabaseQuery pour charger les secteurs de manière réutilisable
 */

'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type UseCompanySectorsResult = {
  sectorIds: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger les secteurs d'une entreprise depuis Supabase
 * 
 * @param companyId - ID de l'entreprise
 * @param options - Options de configuration
 * @returns IDs des secteurs avec état de chargement
 * 
 * @example
 * const { sectorIds, isLoading } = useCompanySectors(companyId);
 * if (isLoading) return <Loading />;
 * return <div>{sectorIds.length} secteurs assignés</div>;
 */
export function useCompanySectors(
  companyId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseCompanySectorsResult {
  const {
    enabled = true
  } = options;

  const [state, setState] = useState<UseCompanySectorsResult>({
    sectorIds: [],
    isLoading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchSectors = async () => {
    if (!companyId || !enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('company_sector_link')
        .select('sector_id')
        .eq('company_id', companyId);

      if (error) {
        throw new Error(error.message || 'Erreur Supabase');
      }

      const sectorIds = (data ?? []).map((link) => link.sector_id as string);

      setState({
        sectorIds,
        isLoading: false,
        error: null,
        refetch: fetchSectors
      });
    } catch (error) {
      setState({
        sectorIds: [],
        isLoading: false,
        error: error instanceof Error ? error : new Error('Erreur inconnue'),
        refetch: fetchSectors
      });
    }
  };

  useEffect(() => {
    fetchSectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, enabled]);

  return state;
}

