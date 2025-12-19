/**
 * Hook personnalisé pour gérer l'authentification et le rôle utilisateur
 * 
 * Extrait la logique d'authentification des composants pour une meilleure séparation des responsabilités
 */

'use client';

import { useEffect, useState, useRef } from 'react';
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

  // Utiliser une ref pour éviter les re-créations de la fonction
  const refreshAuthRef = useRef<() => Promise<void>>(async () => {});
  
  refreshAuthRef.current = async () => {
    try {
      setState(prev => {
        // Ne mettre à jour que si nécessaire (évite les re-renders inutiles)
        if (prev.isLoading) return prev;
        return { ...prev, isLoading: true, error: null };
      });
      
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setState(prev => {
          // Ne mettre à jour que si les valeurs ont changé
          const newError = authError ? authError.message : null;
          const prevError = prev.error?.message || null;
          
          if (
            prev.user === null && 
            prev.role === null && 
            !prev.isLoading && 
            prevError === newError
          ) {
            return prev;
          }
          return {
            user: null,
            role: null,
            isLoading: false,
            error: authError ? new Error(authError.message) : null
          };
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
        const newError = profileError ? profileError.message : null;
        setState(prev => {
          // Ne mettre à jour que si les valeurs ont changé
          const prevError = prev.error?.message || null;
          if (
            prev.user?.id === user.id &&
            prev.user?.email === (user.email ?? '') &&
            prev.role === null &&
            !prev.isLoading &&
            prevError === newError
          ) {
            return prev;
          }
          return {
            user: { id: user.id, email: user.email ?? '' },
            role: null,
            isLoading: false,
            error: profileError ? new Error(profileError.message) : null
          };
        });
        return;
      }

      const newRole = profile.role as ProfileRole;
      setState(prev => {
        // Ne mettre à jour que si les valeurs ont changé
        if (
          prev.user?.id === user.id &&
          prev.user?.email === (user.email ?? '') &&
          prev.role === newRole &&
          !prev.isLoading &&
          prev.error === null
        ) {
          return prev;
        }
        return {
          user: { id: user.id, email: user.email ?? '' },
          role: newRole,
          isLoading: false,
          error: null
        };
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erreur d\'authentification');
      const errorMessage = errorObj.message;
      setState(prev => {
        const prevError = prev.error?.message || null;
        if (
          prev.user === null && 
          prev.role === null && 
          !prev.isLoading && 
          prevError === errorMessage
        ) {
          return prev;
        }
        return {
          user: null,
          role: null,
          isLoading: false,
          error: errorObj
        };
      });
    }
  };

  useEffect(() => {
    // Appeler refreshAuth une seule fois au montage
    let isMounted = true;
    
    const initAuth = async () => {
      if (refreshAuthRef.current) {
        await refreshAuthRef.current();
      }
    };
    
    initAuth();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pas de dépendances - s'exécute une seule fois au montage

  return state;
}

