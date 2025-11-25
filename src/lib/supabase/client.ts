import { createBrowserClient } from '@supabase/ssr';

/**
 * Crée un client Supabase pour le navigateur
 * 
 * @throws Error si les variables d'environnement sont manquantes
 */
export const createSupabaseBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Variables d\'environnement Supabase manquantes. ' +
      'Vérifiez que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies dans .env.local'
    );
  }

  return createBrowserClient(url, key);
};

