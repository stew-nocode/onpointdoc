/**
 * Utilitaires pour l'affichage des informations utilisateur
 */

/**
 * Récupère le nom d'affichage d'un utilisateur
 * 
 * @param user - Objet utilisateur avec full_name et email
 * @param fallback - Texte de fallback si l'utilisateur est null/undefined (défaut: "Système")
 * @returns Le nom d'affichage de l'utilisateur
 */
export function getUserDisplayName(
  user?: { full_name: string | null; email: string | null } | null,
  fallback = 'Système'
): string {
  if (!user) return fallback;
  return user.full_name || user.email || 'Utilisateur inconnu';
}

