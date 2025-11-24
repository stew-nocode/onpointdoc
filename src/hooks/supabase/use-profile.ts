/**
 * Hook personnalisé pour charger un profil utilisateur spécifique
 * 
 * Utilise useSupabaseQuery pour charger un profil de manière réutilisable
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/profile';

type UseProfileResult = {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger un profil utilisateur spécifique depuis Supabase
 * 
 * @param userId - ID du profil à charger
 * @param options - Options de configuration
 * @returns Profil avec état de chargement
 * 
 * @example
 * const { profile, isLoading } = useProfile(userId);
 * if (isLoading) return <Loading />;
 * if (!profile) return <NotFound />;
 * return <div>{profile.full_name}</div>;
 */
export function useProfile(
  userId: string | null | undefined,
  options: { enabled?: boolean } = {}
): UseProfileResult {
  const {
    enabled = true
  } = options;

  const [state, setState] = useState<UseProfileResult>({
    profile: null,
    isLoading: true,
    error: null,
    refetch: async () => {}
  });

  const fetchProfile = useCallback(async () => {
    if (!userId || !enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message || 'Erreur Supabase');
      }

      setState({
        profile: data as Profile,
        isLoading: false,
        error: null,
        refetch: fetchProfile
      });
    } catch (error) {
      setState({
        profile: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Erreur inconnue'),
        refetch: fetchProfile
      });
    }
  }, [userId, enabled]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return state;
}

