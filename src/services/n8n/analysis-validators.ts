/**
 * Utilitaires de validation pour les réponses N8N
 * 
 * Fonctions pures pour valider et parser les réponses du webhook N8N
 */

import type { N8NAnalysisResponse } from '@/types/n8n';
import { createError } from '@/lib/errors/types';

/**
 * Valide que la réponse N8N est un objet valide
 * 
 * @param data - Les données à valider
 * @returns true si valide, sinon lance une erreur
 * @throws {ApplicationError} Si les données sont invalides
 */
export function validateN8NResponse(data: unknown): asserts data is N8NAnalysisResponse {
  if (!data || typeof data !== 'object') {
    throw createError.n8nError(
      `Le webhook N8N a retourné une réponse invalide (format inattendu): ${JSON.stringify(data)}`
    );
  }
}

/**
 * Valide que la réponse N8N contient une analyse valide
 * 
 * @param data - La réponse N8N validée
 * @throws {ApplicationError} Si l'analyse est manquante ou invalide
 */
export function validateAnalysisResponse(data: N8NAnalysisResponse): void {
  if (!data.success || !data.analysis) {
    const errorMessage = data.error || 
      (data.success === false ? 'Le workflow N8N a échoué' : 'Le champ "analysis" est manquant dans la réponse');
    
    throw createError.n8nError(
      `Le webhook N8N n'a pas retourné d'analyse valide: ${errorMessage}. Réponse complète: ${JSON.stringify(data)}`
    );
  }
}

/**
 * Parse la réponse JSON du webhook N8N
 * 
 * @param response - La réponse HTTP
 * @returns La réponse parsée et validée
 * @throws {ApplicationError} Si le parsing échoue
 */
export async function parseN8NResponse(response: Response): Promise<N8NAnalysisResponse> {
  try {
    const data = (await response.json()) as N8NAnalysisResponse;
    validateN8NResponse(data);
    return data;
  } catch (parseError) {
    // Si la réponse n'est pas du JSON valide, logger et renvoyer une erreur
    const responseText = await response.text().catch(() => 'Réponse non lisible');
    throw createError.n8nError(
      `Le webhook N8N a retourné une réponse non-JSON valide: ${responseText.substring(0, 200)}`
    );
  }
}

