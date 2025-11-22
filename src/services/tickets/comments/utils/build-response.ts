import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TicketComment } from '@/services/tickets/comments';

/**
 * Charge le profil utilisateur pour un commentaire
 * 
 * @param supabase - Client Supabase
 * @param profileId - ID du profil
 * @returns Informations du profil utilisateur
 */
async function loadUserProfileForComment(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string
): Promise<{ id: string; full_name: string | null; email: string | null } | null> {
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', profileId)
    .single();

  return userProfile;
}

/**
 * Construit l'objet utilisateur à partir du profil
 * 
 * @param userProfile - Profil utilisateur chargé
 * @returns Objet utilisateur pour le commentaire
 */
function buildUserObject(userProfile: { id: string; full_name: string | null; email: string | null } | null) {
  return userProfile
    ? {
        id: userProfile.id,
        full_name: userProfile.full_name,
        email: userProfile.email
      }
    : undefined;
}

/**
 * Construit l'objet commentaire de base
 * 
 * @param comment - Données brutes du commentaire
 * @returns Objet commentaire sans utilisateur
 */
function buildBaseComment(comment: {
  id: string;
  ticket_id: string;
  user_id: string | null;
  content: string;
  origin: string | null;
  created_at: string;
}) {
  return {
    id: comment.id,
    ticket_id: comment.ticket_id,
    user_id: comment.user_id,
    content: comment.content,
    origin: comment.origin as 'app' | 'jira' | null,
    created_at: comment.created_at
  };
}

/**
 * Construit la réponse d'un commentaire avec les informations de l'utilisateur
 * 
 * @param comment - Données brutes du commentaire
 * @param profileId - ID du profil de l'utilisateur
 * @returns Commentaire avec les informations de l'utilisateur
 */
export async function buildCommentResponse(
  comment: {
    id: string;
    ticket_id: string;
    user_id: string | null;
    content: string;
    origin: string | null;
    created_at: string;
  },
  profileId: string
): Promise<TicketComment> {
  const supabase = await createSupabaseServerClient();
  const userProfile = await loadUserProfileForComment(supabase, profileId);

  return {
    ...buildBaseComment(comment),
    user: buildUserObject(userProfile)
  };
}

