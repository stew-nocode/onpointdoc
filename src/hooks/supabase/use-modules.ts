/**
 * Hook personnalisé pour charger la liste des modules
 * 
 * Utilise useSupabaseQuery pour charger les modules de manière réutilisable
 */

'use client';

import { useSupabaseQuery } from './use-supabase-query';
import type { Module } from '@/types/module';

type ModuleOption = {
  id: string;
  name: string;
};

type UseModulesResult = {
  modules: Module[];
  moduleOptions: ModuleOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger la liste des modules depuis Supabase
 * 
 * @param options - Options de configuration
 * @returns Liste des modules avec état de chargement
 * 
 * @example
 * const { modules, isLoading } = useModules();
 * if (isLoading) return <Loading />;
 * return <Select options={modules.map(m => ({ value: m.id, label: m.name }))} />;
 */
export function useModules(options: { enabled?: boolean } = {}): UseModulesResult {
  const { data, error, isLoading, refetch } = useSupabaseQuery<Module[]>({
    table: 'modules',
    select: 'id, name',
    orderBy: { column: 'name', ascending: true },
    enabled: options.enabled ?? true
  });

  const modules = data ?? [];

  return {
    modules,
    moduleOptions: modules.map((m) => ({ id: m.id, name: m.name })),
    isLoading,
    error,
    refetch
  };
}

