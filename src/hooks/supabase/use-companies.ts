/**
 * Hook personnalisé pour charger la liste des entreprises
 * 
 * Utilise useSupabaseQuery pour charger les entreprises de manière réutilisable
 */

'use client';

import { useSupabaseQuery } from './use-supabase-query';
import type { Company } from '@/types/company';

type CompanyOption = {
  id: string;
  name: string;
};

type UseCompaniesResult = {
  companies: Company[];
  companyOptions: CompanyOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger la liste des entreprises depuis Supabase
 * 
 * @param options - Options de configuration
 * @returns Liste des entreprises avec état de chargement
 * 
 * @example
 * const { companies, isLoading } = useCompanies();
 * if (isLoading) return <Loading />;
 * return <Combobox options={companies.map(c => ({ value: c.id, label: c.name }))} />;
 */
export function useCompanies(options: { enabled?: boolean } = {}): UseCompaniesResult {
  const { data, error, isLoading, refetch } = useSupabaseQuery<Company[]>({
    table: 'companies',
    select: 'id, name',
    orderBy: { column: 'name', ascending: true },
    enabled: options.enabled ?? true
  });

  const companies = data ?? [];

  return {
    companies,
    companyOptions: companies.map((c) => ({ id: c.id, name: c.name })),
    isLoading,
    error,
    refetch
  };
}

