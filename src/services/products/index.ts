import { createSupabaseServerClient } from '@/lib/supabase/server';

export type Product = {
  id: string;
  name: string;
  description: string | null;
  accent_color: string | null;
};

export type Module = {
  id: string;
  product_id: string;
  name: string;
};

/**
 * Récupère tous les produits depuis Supabase
 */
export const listProducts = async (): Promise<Product[]> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, accent_color')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des produits: ${error.message}`);
  }

  return data ?? [];
};

/**
 * Récupère tous les modules depuis Supabase
 */
export const listModules = async (): Promise<Module[]> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('modules')
    .select('id, product_id, name')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des modules: ${error.message}`);
  }

  return data ?? [];
};

/**
 * Récupère les modules pour un produit donné
 */
export const listModulesByProduct = async (productId: string): Promise<Module[]> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('modules')
    .select('id, product_id, name')
    .eq('product_id', productId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des modules: ${error.message}`);
  }

  return data ?? [];
};

