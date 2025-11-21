/**
 * Hook personnalisé pour charger la liste des profils utilisateurs
 * 
 * Utilise useSupabaseQuery pour charger les profils de manière réutilisable
 */

'use client';

import { useMemo } from 'react';
import { useSupabaseQuery } from './use-supabase-query';
import type { Profile } from '@/types/profile';

type ProfileOption = {
  id: string;
  label: string;
};

type UseProfilesOptions = {
  /** Nombre maximum de profils à charger (défaut: 200) */
  limit?: number;
  /** Condition de chargement (défaut: true) */
  enabled?: boolean;
  /** Formater les profils en options pour Select/Combobox (défaut: false) */
  asOptions?: boolean;
};

type UseProfilesResult = {
  profiles: Profile[];
  profileOptions: ProfileOption[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook pour charger la liste des profils utilisateurs depuis Supabase
 * 
 * @param options - Options de configuration
 * @returns Liste des profils avec état de chargement
 * 
 * @example
 * // Charger les profils bruts
 * const { profiles, isLoading } = useProfiles({ limit: 100 });
 * 
 * // Charger les profils formatés en options
 * const { profileOptions, isLoading } = useProfiles({ asOptions: true });
 * return <Combobox options={profileOptions} />;
 */
export function useProfiles(options: UseProfilesOptions = {}): UseProfilesResult {
  const {
    limit = 200,
    enabled = true,
    asOptions = false
  } = options;

  // Mémoriser orderBy pour éviter les re-renders inutiles
  const orderBy = useMemo(() => ({ column: 'full_name', ascending: true } as const), []);

  const { data, error, isLoading, refetch } = useSupabaseQuery<Profile[]>({
    table: 'profiles',
    select: 'id, full_name, email',
    orderBy,
    limit,
    enabled
  });

  const profiles = data ?? [];
  
  // Formater les profils en options si demandé
  const profileOptions: ProfileOption[] = asOptions
    ? profiles.map((profile) => ({
        id: profile.id,
        label: profile.full_name || profile.email || 'Utilisateur'
      }))
    : [];

  return {
    profiles,
    profileOptions,
    isLoading,
    error,
    refetch
  };
}

