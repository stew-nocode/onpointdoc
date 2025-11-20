import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Crée un client Supabase pour les Server Components, Server Actions et Route Handlers
 * 
 * NOTE: Dans Next.js 15, les cookies ne peuvent être modifiés que dans les Server Actions
 * ou Route Handlers. Dans les Server Components, les fonctions set/remove sont no-op.
 * 
 * Pour les Server Components, cette fonction crée un client en lecture seule.
 * Les cookies seront mis à jour automatiquement par Supabase via les Server Actions
 * lors des opérations d'authentification.
 */
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Dans Next.js 15, on ne peut modifier les cookies que dans les Server Actions
          // ou Route Handlers. Dans les Server Components, cette fonction doit être un no-op.
          // Les cookies seront mis à jour automatiquement par Supabase via les Server Actions
          // lors des opérations d'authentification (login, logout, etc.).
          // 
          // IMPORTANT: Ne pas appeler cookieStore.set() dans les Server Components.
          // Cette fonction est appelée par Supabase SSR mais doit rester vide ici.
          // Les cookies seront gérés par les Server Actions si nécessaire.
        },
        remove(name: string, options: CookieOptions) {
          // Même logique que set() - no-op dans les Server Components
          // Les cookies seront gérés par les Server Actions si nécessaire.
        }
      }
    }
  );
};

/**
 * Crée un client Supabase avec Service Role Key pour contourner les RLS
 * 
 * ⚠️ ATTENTION: Ce client contourne toutes les RLS policies.
 * À utiliser UNIQUEMENT pour :
 * - Les webhooks externes (JIRA, etc.)
 * - Les scripts d'administration
 * - Les opérations système qui nécessitent un accès complet
 * 
 * NE JAMAIS utiliser ce client dans :
 * - Les Server Components normaux
 * - Les Server Actions utilisateur
 * - Les routes API accessibles aux utilisateurs
 */
export const createSupabaseServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquant. ' +
      'Ce client est requis pour les webhooks externes qui doivent contourner les RLS.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

