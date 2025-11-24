import type { Company } from '@/types/company';
import { getSupabaseBrowserClient, type SupabaseBrowserClient } from './client';

type CompanyFetcherOptions = {
  client?: SupabaseBrowserClient;
};

const COMPANY_ERROR_PREFIX = '[fetchCompany]';

function buildErrorMessage(defaultMessage: string, error?: { message?: string }): string {
  return error?.message ? `${COMPANY_ERROR_PREFIX} ${error.message}` : `${COMPANY_ERROR_PREFIX} ${defaultMessage}`;
}

export async function fetchCompanyById(
  companyId: string,
  options: CompanyFetcherOptions = {}
): Promise<Company | null> {
  if (!companyId) {
    return null;
  }

  const supabase = getSupabaseBrowserClient(options.client);
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(buildErrorMessage('Erreur Supabase lors du chargement de l’entreprise', error));
  }

  return data as Company;
}

export async function fetchCompanies(
  options: CompanyFetcherOptions & {
    search?: string;
    limit?: number;
  } = {}
): Promise<Company[]> {
  const supabase = getSupabaseBrowserClient(options.client);
  let query = supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });

  if (options.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(buildErrorMessage('Erreur Supabase lors du chargement des entreprises', error));
  }

  return (data ?? []) as Company[];
}
