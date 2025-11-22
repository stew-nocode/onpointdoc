import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';

type AuthResult = {
  userId: string;
  profileId: string;
};

/**
 * Vérifie que l'utilisateur est authentifié
 * 
 * @param supabase - Client Supabase
 * @returns ID de l'utilisateur authentifié
 * @throws ApplicationError si l'utilisateur n'est pas authentifié
 */
async function verifyUserIsAuthenticated(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<string> {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw createError.unauthorized('Vous devez être connecté');
  }

  return user.id;
}

/**
 * Charge le profil utilisateur basique
 * 
 * @param supabase - Client Supabase
 * @param userId - ID de l'utilisateur authentifié
 * @returns ID du profil
 * @throws ApplicationError si le profil n'existe pas
 */
async function loadUserProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string): Promise<string> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_uid', userId)
    .single();

  if (profileError || !profile) {
    throw createError.notFound('Profil utilisateur');
  }

  return profile.id;
}

/**
 * Charge le profil utilisateur avec le rôle
 * 
 * @param supabase - Client Supabase
 * @param userId - ID de l'utilisateur authentifié
 * @returns ID du profil et rôle
 * @throws ApplicationError si le profil n'existe pas
 */
async function loadUserProfileWithRole(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<{ profileId: string; role: string | null }> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_uid', userId)
    .single();

  if (profileError || !profile) {
    throw createError.notFound('Profil utilisateur');
  }

  return {
    profileId: profile.id,
    role: profile.role
  };
}

/**
 * Vérifie l'authentification de l'utilisateur et récupère son profil
 * 
 * @returns ID de l'utilisateur authentifié et ID du profil
 * @throws ApplicationError si l'utilisateur n'est pas authentifié
 */
export async function verifyUserAuthentication(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const userId = await verifyUserIsAuthenticated(supabase);
  const profileId = await loadUserProfile(supabase, userId);

  return {
    userId,
    profileId
  };
}

/**
 * Vérifie l'authentification et récupère le profil avec le rôle
 * 
 * @returns ID du profil et rôle de l'utilisateur
 * @throws ApplicationError si l'utilisateur n'est pas authentifié
 */
export async function verifyUserAuthenticationWithRole(): Promise<{
  profileId: string;
  role: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const userId = await verifyUserIsAuthenticated(supabase);

  return loadUserProfileWithRole(supabase, userId);
}

