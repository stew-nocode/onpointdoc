/**
 * Utilitaires pour extraire et manipuler les données de produits depuis les relations Supabase
 * 
 * Les relations Supabase peuvent retourner soit un objet unique, soit un tableau, soit null.
 * Ces utilitaires permettent de normaliser l'accès aux données.
 */

/**
 * Type pour une relation produit Supabase
 */
export type SupabaseProductRelation =
  | { id: string; name: string }
  | { id: string; name: string }[]
  | null;

/**
 * Type pour une relation module Supabase
 */
export type SupabaseModuleRelation =
  | { id: string; name: string }
  | { id: string; name: string }[]
  | null;

/**
 * Extrait un produit d'une relation Supabase (simple ou array)
 * 
 * @param product - Relation produit de Supabase (peut être un objet, un tableau ou null)
 * @returns Produit normalisé ou null si absent
 * 
 * @example
 * extractProduct({ id: '1', name: 'Product A' }) // { id: '1', name: 'Product A' }
 * extractProduct([{ id: '1', name: 'Product A' }]) // { id: '1', name: 'Product A' }
 * extractProduct(null) // null
 */
export function extractProduct(
  product: SupabaseProductRelation
): { id: string; name: string } | null {
  if (!product) return null;
  return Array.isArray(product) ? product[0] : product;
}

/**
 * Extrait un module d'une relation Supabase (simple ou array)
 * 
 * @param module - Relation module de Supabase (peut être un objet, un tableau ou null)
 * @returns Module normalisé ou null si absent
 * 
 * @example
 * extractModule({ id: '1', name: 'Module A' }) // { id: '1', name: 'Module A' }
 * extractModule([{ id: '1', name: 'Module A' }]) // { id: '1', name: 'Module A' }
 * extractModule(null) // null
 */
export function extractModule(
  module: SupabaseModuleRelation
): { id: string; name: string } | null {
  if (!module) return null;
  return Array.isArray(module) ? module[0] : module;
}


