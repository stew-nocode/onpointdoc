import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour un profil utilisateur basique (id, nom, email)
 */
export type BasicProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

/**
 * Récupère le rôle de l'utilisateur authentifié côté serveur
 * 
 * @returns Rôle de l'utilisateur ou null si non authentifié
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_uid', user.id)
      .single();

    return profile?.role ?? null;
  } catch {
    return null;
  }
}

/**
 * Récupère l'ID du profil de l'utilisateur authentifié côté serveur
 * 
 * @returns ID du profil ou null si non authentifié
 */
export async function getCurrentUserProfileId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    return profile?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Récupère le profil complet de l'utilisateur authentifié côté serveur
 * 
 * @returns Profil complet ou null si non authentifié
 */
export async function getCurrentUserProfile(): Promise<{
  id: string;
  role: string;
  department?: string | null;
  full_name?: string | null;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, department, full_name')
      .eq('auth_uid', user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      role: profile.role,
      department: profile.department,
      full_name: profile.full_name,
    };
  } catch {
    return null;
  }
}

/**
 * Liste tous les profils utilisateurs basiques
 * 
 * @returns Liste des profils avec id, full_name, email
 */
export async function listBasicProfiles(): Promise<BasicProfile[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true });

    if (error) {
      throw error;
    }

    return (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
    }));
  } catch {
    return [];
  }
}
