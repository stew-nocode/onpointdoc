/**
 * Client Supabase avec service_role
 * 
 * ⚠️ ATTENTION: Ce client bypass le RLS !
 * À utiliser UNIQUEMENT pour :
 * - Webhooks (pas d'utilisateur authentifié)
 * - Tâches de fond (cron jobs)
 * - Opérations système
 * 
 * NE JAMAIS exposer côté client !
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Crée un client Supabase avec la clé service_role
 * Ce client bypass complètement le RLS
 */
export function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}


