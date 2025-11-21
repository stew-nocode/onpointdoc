/**
 * Hook personnalisé pour gérer l'authentification et le rôle utilisateur
 * 
 * Extrait la logique d'authentification des composants pour une meilleure séparation des responsabilités
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ProfileRole } from '@/types/profile';

type AuthState = {
  user: { id: string; email: string } | null;
  role: ProfileRole | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Hook pour gérer l'authentification et le rôle utilisateur
 * 
 * @returns État d'authentification avec user, role, isLoading et error
 * 
 * @example
 * const { user, role, isLoading } = useAuth();
 * if (isLoading) return <Loading />;
 * if (!user) return <Login />;
 * if (role !== 'admin') return <Forbidden />;
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    error: null
  });

  const refreshAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setState({
          user: null,
          role: null,
          isLoading: false,
          error: authError ? new Error(authError.message) : null
        });
        return;
      }

      // Récupérer le rôle du profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_uid', user.id)
        .single();

      if (profileError || !profile) {
        setState({
          user: { id: user.id, email: user.email ?? '' },
          role: null,
          isLoading: false,
          error: profileError ? new Error(profileError.message) : null
        });
        return;
      }

      setState({
        user: { id: user.id, email: user.email ?? '' },
        role: profile.role as ProfileRole,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState({
        user: null,
        role: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Erreur d\'authentification')
      });
    }
  }, []);

  useEffect(() => {
    // Utiliser setTimeout pour éviter l'appel synchrone de setState
    const timer = setTimeout(() => {
      refreshAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshAuth]);

  return state;
}

