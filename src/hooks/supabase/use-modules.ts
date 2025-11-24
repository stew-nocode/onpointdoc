/**
 * Hook personnalisé pour charger la liste des modules
 * 
 * Utilise useSupabaseQuery pour charger les modules de manière réutilisable
 */

'use client';

import useSWR from 'swr';
import type { Module } from '@/types/module';
import { fetchModules } from '@/services/fetchers';

type ModuleOption = {
  id: string;
  name: string;
};

type UseModulesOptions = {
  enabled?: boolean;
  productId?: string;
  limit?: number;
};

type UseModulesResult = {
  modules: Module[];
  moduleOptions: ModuleOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useModules(options: UseModulesOptions = {}): UseModulesResult {
  const { enabled = true, productId, limit } = options;
  const shouldFetch = enabled;

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    shouldFetch ? ['modules', productId ?? 'all', limit ?? 'all'] : null,
    () => fetchModules({ productId, limit }),
    { revalidateOnFocus: false }
  );

  const modules = (data as Module[] | undefined) ?? [];

  return {
    modules,
    moduleOptions: modules.map((m) => ({ id: m.id, name: m.name })),
    isLoading: shouldFetch ? Boolean(isLoading) : false,
    error: (error as Error) ?? null,
    refetch: async () => {
      if (!shouldFetch) return;
      await mutate();
    }
  };
}

