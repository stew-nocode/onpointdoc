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

export const listProducts = async (): Promise<Product[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, accent_color')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const listModules = async (): Promise<Module[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('modules').select('id, product_id, name').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const listSubmodules = async (): Promise<Submodule[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('submodules').select('id, module_id, name').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const listFeatures = async (): Promise<Feature[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('features').select('id, submodule_id, name').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const listModulesForCurrentUser = async (): Promise<Module[]> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase.from('profiles').select('id').eq('auth_uid', user.id).single();
  if (!profile) return [];
  const { data, error } = await supabase
    .from('user_module_assignments')
    .select('module:module_id ( id, product_id, name )')
    .eq('user_id', profile.id);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => row.module as Module).filter(Boolean);
};

export const listModulesByProduct = async (productId: string): Promise<Module[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('modules')
    .select('id, product_id, name')
    .eq('product_id', productId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

/**
 * Récupère les produits accessibles au département de l'utilisateur actuel
 * via la table product_department_link
 */
export const listProductsForCurrentUserDepartment = async (): Promise<Product[]> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('department_id')
    .eq('auth_uid', user.id)
    .single();

  if (!profile?.department_id) return [];

  const { data, error } = await supabase
    .from('product_department_link')
    .select('product:products(id, name, description, accent_color)')
    .eq('department_id', profile.department_id);

  if (error) throw new Error(error.message);
  
  // Supabase retourne product comme un tableau dans les relations
  return (data ?? [])
    .map((row: any) => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product;
      return product as Product | null;
    })
    .filter((p): p is Product => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Récupère le profil de l'utilisateur actuel avec son département
 */
export const getCurrentUserProfileWithDepartment = async (): Promise<{ id: string; department_id: string | null } | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, department_id')
    .eq('auth_uid', user.id)
    .single();

  return profile ?? null;
};


