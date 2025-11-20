/**
 * Hook personnalisé pour gérer la redirection si non authentifié
 * 
 * Extrait la logique de redirection des composants pour une meilleure séparation des responsabilités
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './use-auth';

type UseAuthRedirectOptions = {
  /** Chemin de redirection si non authentifié (défaut: '/auth/login') */
  redirectTo?: string;
  /** Pathnames à exclure de la vérification (ex: ['/auth/login']) */
  excludePaths?: string[];
};

/**
 * Hook pour rediriger automatiquement si l'utilisateur n'est pas authentifié
 * 
 * @param options - Options de configuration
 * 
 * @example
 * // Redirection par défaut vers /auth/login
 * useAuthRedirect();
 * 
 * // Redirection personnalisée
 * useAuthRedirect({ redirectTo: '/login', excludePaths: ['/public'] });
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}): void {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { user, isLoading } = useAuth();
  
  const {
    redirectTo = '/auth/login',
    excludePaths = ['/auth']
  } = options;

  useEffect(() => {
    // Ne pas vérifier pendant le chargement
    if (isLoading) return;

    // Ne pas vérifier si on est sur une page exclue
    if (excludePaths.some(path => pathname.startsWith(path))) return;

    // Rediriger si non authentifié
    if (!user) {
      router.replace(`${redirectTo}?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, pathname, router, redirectTo, excludePaths]);
}

