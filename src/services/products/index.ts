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

export type Submodule = {
  id: string;
  module_id: string;
  name: string;
};

export type Feature = {
  id: string;
  submodule_id: string;
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

export const listSubmodules = async (): Promise<Submodule[]> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('submodules')
    .select('id, module_id, name')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des sous-modules: ${error.message}`);
  }

  return data ?? [];
};

export const listFeatures = async (): Promise<Feature[]> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('features')
    .select('id, submodule_id, name')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des fonctionnalités: ${error.message}`);
  }

  return data ?? [];
};

/**
 * Retourne les modules auxquels l'utilisateur courant (auth) est affecté,
 * en se basant sur la table de liaison public.user_module_assignments (user_id -> profiles.id).
 */
export const listModulesForCurrentUser = async (): Promise<Module[]> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Récupérer le profile.id correspondant à l'auth.uid
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_uid', user.id)
    .single();
  if (profileErr || !profile) return [];

  const { data, error } = await supabase
    .from('user_module_assignments')
    .select('module:module_id ( id, product_id, name )')
    .eq('user_id', profile.id);

  if (error) {
    throw new Error(`Erreur lors de la récupération des modules affectés: ${error.message}`);
  }

  return (data ?? []).map((row: any) => row.module as Module).filter(Boolean);
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

