import { getSupabaseBrowserClient, type SupabaseBrowserClient } from './client';

type FetchCompanySectorsOptions = {
  client?: SupabaseBrowserClient;
};

export async function fetchCompanySectorIds(
  companyId: string,
  options: FetchCompanySectorsOptions = {}
): Promise<string[]> {
  if (!companyId) {
    return [];
  }

  const supabase = getSupabaseBrowserClient(options.client);
  const { data, error } = await supabase
    .from('company_sector_link')
    .select('sector_id')
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`[fetchCompanySectorIds] ${error.message || 'Erreur Supabase'}`);
  }

  return (data ?? []).map((link) => String(link.sector_id));
}
