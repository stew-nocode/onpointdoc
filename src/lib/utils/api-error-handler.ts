import { toast } from 'sonner';

/**
 * Gère les erreurs d'API de manière standardisée
 * 
 * @param error - L'erreur capturée
 * @param defaultMessage - Message par défaut si l'erreur n'est pas une Error
 * @returns Le message d'erreur
 */
export function handleApiError(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

/**
 * Affiche une notification d'erreur et retourne le message
 * 
 * @param error - L'erreur capturée
 * @param defaultMessage - Message par défaut
 * @returns Le message d'erreur
 */
export function showApiErrorToast(error: unknown, defaultMessage: string): string {
  const errorMessage = handleApiError(error, defaultMessage);
  toast.error(errorMessage);
  return errorMessage;
}

/**
 * Parse une réponse JSON d'erreur depuis une API
 * 
 * @param response - Réponse fetch
 * @returns Erreur parsée ou message par défaut
 */
export async function parseApiError(response: Response): Promise<string> {
  try {
    const error = await response.json();
    return error.error || 'Erreur lors de la requête';
  } catch {
    return 'Erreur lors de la requête';
  }
}

