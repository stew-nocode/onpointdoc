/**
 * Hook personnalisé pour charger les modules assignés à un utilisateur
 * 
 * Utilise useSupabaseQuery pour charger les modules de manière réutilisable
 */

'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type UseUserModulesResult = {
  moduleIds: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger les modules assignés à un utilisateur depuis Supabase
 * 
 * @param userId - ID de l'utilisateur
 * @param options - Options de configuration
 * @returns IDs des modules assignés avec état de chargement
 * 
 * @example
 * const { moduleIds, isLoading } = useUserModules(userId);
 * if (isLoading) return <Loading />;
 * return <div>{moduleIds.length} modules assignés</div>;
 */
export function useUserModules(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseUserModulesResult {
  const {
    enabled = true
  } = options;

  const [state, setState] = useState<UseUserModulesResult>({
    moduleIds: [],
    isLoading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchModules = async () => {
    if (!userId || !enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('user_module_assignments')
        .select('module_id')
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message || 'Erreur Supabase');
      }

      const moduleIds = (data ?? []).map((link) => link.module_id as string);

      setState({
        moduleIds,
        isLoading: false,
        error: null,
        refetch: fetchModules
      });
    } catch (error) {
      setState({
        moduleIds: [],
        isLoading: false,
        error: error instanceof Error ? error : new Error('Erreur inconnue'),
        refetch: fetchModules
      });
    }
  };

  useEffect(() => {
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled]);

  return state;
}

