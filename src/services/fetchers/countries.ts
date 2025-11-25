import type { Country } from '@/types/country';
import { getSupabaseBrowserClient, type SupabaseBrowserClient } from './client';

type FetchCountriesOptions = {
  client?: SupabaseBrowserClient;
  limit?: number;
};

export async function fetchCountries(
  options: FetchCountriesOptions = {}
): Promise<Country[]> {
  const supabase = getSupabaseBrowserClient(options.client);
  let query = supabase
    .from('countries')
    .select('id, name')
    .order('name', { ascending: true });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[fetchCountries] ${error.message || 'Erreur Supabase'}`);
  }

  return (data ?? []) as Country[];
}
