/**
 * Utilitaires pour l'authentification avec cache
 * 
 * Principe Clean Code - Niveau Senior :
 * - Centralise la logique d'authentification avec cache
 * - Évite les appels répétés qui causent le rate limit Supabase (429)
 * - Utilise React cache() pour mémoriser les résultats dans le render tree
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Récupère l'ID du profil utilisateur actuel (avec cache)
 * 
 * ✅ OPTIMISÉ : Utilise React cache() pour éviter les appels répétés
 * au même getUser() dans le même render tree (évite le rate limit 429)
 * 
 * Le cache React mémorise le résultat pour toute la durée du render tree,
 * ce qui signifie que plusieurs composants peuvent appeler cette fonction
 * sans déclencher plusieurs appels API.
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction pure et déterministe
 * - Cache automatique via React cache()
 * - Gestion d'erreur robuste (retourne null en cas d'erreur)
 * - Évite le rate limit Supabase
 * 
 * @returns L'ID du profil utilisateur ou null si non authentifié/erreur
 * 
 * @example
 * ```tsx
 * // Dans un Server Component
 * const profileId = await getCachedCurrentUserProfileId();
 * ```
 */
export const getCachedCurrentUserProfileId = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile.id;
  } catch (error) {
    // Logger l'erreur en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[getCachedCurrentUserProfileId] Error:', error);
    }
    return null;
  }
});

/**
 * Récupère l'utilisateur authentifié actuel (avec cache)
 * 
 * ✅ OPTIMISÉ : Utilise React cache() pour éviter les appels répétés
 * 
 * @returns L'utilisateur authentifié ou null si non authentifié/erreur
 */
export const getCachedCurrentUser = cache(async () => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    return user;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getCachedCurrentUser] Error:', error);
    }
    return null;
  }
});

/**
 * Récupère le rôle de l'utilisateur actuel (avec cache)
 * 
 * ✅ OPTIMISÉ : Utilise React cache() pour éviter les appels répétés
 * au même getUser() dans le même render tree (évite le rate limit 429)
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction pure et déterministe
 * - Cache automatique via React cache()
 * - Gestion d'erreur robuste (retourne null en cas d'erreur)
 * - Évite le rate limit Supabase
 * 
 * @returns Le rôle de l'utilisateur (string) ou null si non authentifié/erreur
 * 
 * @example
 * ```tsx
 * // Dans un Server Component
 * const userRole = await getCachedCurrentUserRole();
 * // 'agent', 'manager', 'admin', etc.
 * ```
 */
export const getCachedCurrentUserRole = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile.role as string;
  } catch (error) {
    // Logger l'erreur en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[getCachedCurrentUserRole] Error:', error);
    }
    return null;
  }
});

/**
 * Vérifie si l'utilisateur actuel est un agent du département Support
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction pure et déterministe
 * - Cache automatique via React cache()
 * - Logique claire : role = 'agent' AND department = 'Support'
 * 
 * @returns true si l'utilisateur est un agent support, false sinon
 * 
 * @example
 * ```tsx
 * // Dans un Server Component
 * const isSupportAgent = await getCachedIsSupportAgent();
 * if (isSupportAgent) {
 *   // Afficher le filtre "mine"
 * }
 * ```
 */
export const getCachedIsSupportAgent = cache(async (): Promise<boolean> => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, department')
      .eq('auth_uid', user.id)
      .single();

    if (profileError || !profile) {
      return false;
    }

    const role = (profile.role as string)?.toLowerCase() || '';
    const department = (profile.department as string)?.toLowerCase() || '';

    // ✅ D'après la vérification de l'enum user_role_t via MCP Supabase :
    // L'enum contient : {agent,manager,admin,director,client}
    // Il n'y a PAS de valeur 'agent_support' dans l'enum
    // Les agents support ont : role = 'agent' AND department = 'Support'
    return role === 'agent' && department === 'support';
  } catch (error) {
    // Logger l'erreur en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[getCachedIsSupportAgent] Error:', error);
    }
    return false;
  }
});

