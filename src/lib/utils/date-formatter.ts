import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Utilitaires pour le formatage des dates
 */

/**
 * Formate une date en format relatif (ex: "il y a 2 heures")
 * 
 * @param dateString - Date sous forme de string ISO
 * @param fallbackFormat - Format de fallback si l'erreur de parsing (défaut: format français simple)
 * @returns Date formatée en format relatif
 */
export function formatRelativeDate(
  dateString: string,
  fallbackFormat?: (date: Date) => string
): string {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: fr
    });
  } catch {
    if (fallbackFormat) {
      return fallbackFormat(new Date(dateString));
    }
    return new Date(dateString).toLocaleDateString('fr-FR');
  }
}

