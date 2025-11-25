/**
 * Hook personnalisé pour charger la liste des entreprises
 * 
 * Utilise useSupabaseQuery pour charger les entreprises de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import type { Company } from '@/types/company';
import { fetchCompanies } from '@/services/fetchers';

type CompanyOption = {
  id: string;
  name: string;
};

type UseCompaniesOptions = {
  enabled?: boolean;
  search?: string;
  limit?: number;
};

type UseCompaniesResult = {
  companies: Company[];
  companyOptions: CompanyOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useCompanies(options: UseCompaniesOptions = {}): UseCompaniesResult {
  const { enabled = true, search, limit } = options;
  const shouldFetch = enabled;

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['companies', search ?? '', limit ?? 'all'] : null,
    () => fetchCompanies({ search, limit }),
    { revalidateOnFocus: false }
  );

  const companies = (data as Company[] | undefined) ?? [];

  return {
    companies,
    companyOptions: companies.map((c) => ({ id: c.id, name: c.name })),
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

