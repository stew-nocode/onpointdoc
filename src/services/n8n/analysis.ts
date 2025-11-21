/**
 * Service pour générer des analyses via N8N
 * 
 * Ce service construit la question pré-remplie selon le contexte
 * et appelle le webhook N8N pour générer l'analyse.
 */

import type { AnalysisContext, AnalysisResult } from '@/types/n8n';
import { createError } from '@/lib/errors/types';
import { parseN8NResponse, validateAnalysisResponse } from './analysis-validators';

/**
 * Construit la question pré-remplie selon le contexte
 * 
 * @param context - Le contexte de l'analyse (ticket, company, contact)
 * @param id - L'identifiant de l'entité (UUID)
 * @returns La question formatée pour N8N
 */
function buildQuestion(context: AnalysisContext, id: string): string {
  const baseQuestion = `Analyse l'historique complet`;
  
  switch (context) {
    case 'ticket':
      return `${baseQuestion} du ticket ${id}. Fournis une analyse détaillée des interactions, des statuts, des commentaires, des tendances et des recommandations.`;
    
    case 'company':
      return `${baseQuestion} de l'entreprise ${id}. Fournis une analyse des tickets liés, des contacts, des tendances, des besoins et des opportunités.`;
    
    case 'contact':
      return `${baseQuestion} du contact ${id}. Fournis une analyse des tickets, des interactions, des tendances, des besoins spécifiques et des recommandations.`;
    
    default:
      throw createError.validationError(`Contexte invalide: ${context}`);
  }
}

/**
 * Génère une analyse via le webhook N8N
 * 
 * @param context - Le contexte de l'analyse (ticket, company, contact)
 * @param id - L'identifiant de l'entité (UUID)
 * @returns L'analyse générée ou une erreur
 * 
 * @throws {ApplicationError} Si le webhook N8N n'est pas configuré ou si la requête échoue
 */
export async function generateAnalysis(
  context: AnalysisContext,
  id: string
): Promise<AnalysisResult> {
  // Récupérer l'URL du webhook N8N depuis les variables d'environnement
  const webhookUrl = process.env.N8N_ANALYSIS_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_ANALYSIS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    throw createError.internalError('Le webhook N8N pour l\'analyse n\'est pas configuré. Veuillez définir N8N_ANALYSIS_WEBHOOK_URL ou NEXT_PUBLIC_N8N_ANALYSIS_WEBHOOK_URL dans les variables d\'environnement.');
  }

  // Construire la question pré-remplie
  const question = buildQuestion(context, id);

  try {
    // Appeler le webhook N8N
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optionnel : ajouter une authentification si nécessaire
        ...(process.env.N8N_API_KEY && {
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`
        })
      },
      body: JSON.stringify({
        context,
        id, // Toujours utiliser l'ID (UUID) pour les tickets
        question
      }),
      // Timeout de 60 secondes (les analyses IA peuvent prendre du temps)
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erreur inconnue');
      throw createError.networkError(`Erreur HTTP ${response.status}: ${errorText}`);
    }

    // Parser et valider la réponse N8N
    const data = await parseN8NResponse(response);
    validateAnalysisResponse(data);

    // data.analysis est garanti non-null par validateAnalysisResponse
    if (!data.analysis) {
      throw createError.n8nError('L\'analyse est manquante après validation');
    }

    return {
      success: true,
      analysis: data.analysis
    };
  } catch (error) {
    // Gérer les erreurs de timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError.networkError('Le webhook N8N a pris trop de temps à répondre (timeout 60s)');
    }

    // Gérer les autres erreurs
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    throw createError.n8nError(
      `Erreur lors de l'appel au webhook N8N: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      error instanceof Error ? error : undefined
    );
  }
}

