/**
 * Hook personnalisé pour charger une entreprise spécifique
 * 
 * Utilise useSupabaseQuery pour charger une entreprise de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import type { Company } from '@/types/company';
import { fetchCompanyById } from '@/services/fetchers';

type UseCompanyResult = {
  company: Company | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useCompany(
  companyId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseCompanyResult {
  const enabled = options.enabled ?? true;
  const shouldFetch = enabled && Boolean(companyId);

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['company', companyId] : null,
    () => fetchCompanyById(companyId as string),
    { revalidateOnFocus: false }
  );

  return {
    company: (data as Company | null) ?? null,
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

