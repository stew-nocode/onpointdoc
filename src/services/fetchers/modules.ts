import type { Module } from '@/types/module';
import { getSupabaseBrowserClient, type SupabaseBrowserClient } from './client';

type ModuleFetcherOptions = {
  client?: SupabaseBrowserClient;
};

const MODULE_ERROR_PREFIX = '[fetchModules]';

function formatError(defaultMessage: string, error?: { message?: string }): string {
  return error?.message ? `${MODULE_ERROR_PREFIX} ${error.message}` : `${MODULE_ERROR_PREFIX} ${defaultMessage}`;
}

export async function fetchModules(
  options: ModuleFetcherOptions & {
    productId?: string;
    limit?: number;
  } = {}
): Promise<Module[]> {
  const supabase = getSupabaseBrowserClient(options.client);
  let query = supabase
    .from('modules')
    .select('id, name, product_id')
    .order('name', { ascending: true });

  if (options.productId) {
    query = query.eq('product_id', options.productId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatError('Erreur Supabase lors du chargement des modules', error));
  }

  return (data ?? []) as Module[];
}

export async function fetchUserModuleIds(
  userId: string,
  options: ModuleFetcherOptions = {}
): Promise<string[]> {
  if (!userId) {
    return [];
  }

  const supabase = getSupabaseBrowserClient(options.client);
  const { data, error } = await supabase
    .from('user_module_assignments')
    .select('module_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(formatError('Erreur Supabase lors du chargement des modules utilisateur', error));
  }

  return (data ?? []).map((link) => String(link.module_id));
}
