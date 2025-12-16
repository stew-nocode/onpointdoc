/**
 * Utilitaires pour formater la durée d'assistance
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (formater les durées)
 * - Fonction pure (pas d'effets de bord)
 * - Types explicites
 */

/**
 * Formate une durée en minutes en format lisible
 * 
 * @param minutes - Durée en minutes
 * @returns Format lisible (ex: "45 min", "2h 15min", "2j 3h")
 */
export function formatAssistanceDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days}j`;
  }
  return `${days}j ${remainingHours}h`;
}
