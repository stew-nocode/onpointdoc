import { getSupabaseBrowserClient, type SupabaseBrowserClient } from './client';

type Sector = {
  id: string;
  name: string;
};

type FetchSectorsOptions = {
  client?: SupabaseBrowserClient;
  limit?: number;
};

export async function fetchSectors(
  options: FetchSectorsOptions = {}
): Promise<Sector[]> {
  const supabase = getSupabaseBrowserClient(options.client);
  let query = supabase
    .from('sectors')
    .select('id, name')
    .order('name', { ascending: true });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[fetchSectors] ${error.message || 'Erreur Supabase'}`);
  }

  return (data ?? []) as Sector[];
}
