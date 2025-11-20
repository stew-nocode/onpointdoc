/**
 * Hook personnalisé pour charger une entreprise spécifique
 * 
 * Utilise useSupabaseQuery pour charger une entreprise de manière réutilisable
 */

'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Company } from '@/types/company';

type UseCompanyResult = {
  company: Company | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger une entreprise spécifique depuis Supabase
 * 
 * @param companyId - ID de l'entreprise à charger
 * @param options - Options de configuration
 * @returns Entreprise avec état de chargement
 * 
 * @example
 * const { company, isLoading } = useCompany(companyId);
 * if (isLoading) return <Loading />;
 * if (!company) return <NotFound />;
 * return <div>{company.name}</div>;
 */
export function useCompany(
  companyId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseCompanyResult {
  const {
    enabled = true
  } = options;

  const [state, setState] = useState<UseCompanyResult>({
    company: null,
    isLoading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchCompany = async () => {
    if (!companyId || !enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        throw new Error(error.message || 'Erreur Supabase');
      }

      setState({
        company: data as Company,
        isLoading: false,
        error: null,
        refetch: fetchCompany
      });
    } catch (error) {
      setState({
        company: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Erreur inconnue'),
        refetch: fetchCompany
      });
    }
  };

  useEffect(() => {
    fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, enabled]);

  return state;
}

