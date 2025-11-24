/**
 * Utilitaires pour extraire et manipuler les données de profils depuis les relations Supabase
 */

/**
 * Type pour une relation profil Supabase
 */
export type SupabaseProfileRelation =
  | { id: string; full_name: string | null; role: string }
  | { id: string; full_name: string | null; role: string }[]
  | null;

/**
 * Type pour une relation profil simplifiée (juste le rôle)
 */
export type SupabaseProfileRoleRelation =
  | { role: string }
  | { role: string }[]
  | null;

/**
 * Extrait un profil d'une relation Supabase (simple ou array)
 * 
 * @param profile - Relation profil de Supabase (peut être un objet, un tableau ou null)
 * @returns Profil normalisé ou null si absent
 */
export function extractProfile(
  profile: SupabaseProfileRelation
): { id: string; full_name: string | null; role: string } | null {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] : profile;
}

/**
 * Extrait un rôle d'une relation profil simplifiée (simple ou array)
 * 
 * @param profile - Relation profil avec juste le rôle (peut être un objet, un tableau ou null)
 * @returns Rôle ou null si absent
 */
export function extractProfileRole(
  profile: SupabaseProfileRoleRelation
): string | null {
  if (!profile) return null;
  const profileObj = Array.isArray(profile) ? profile[0] : profile;
  return profileObj.role || null;
}


