/**
 * Types pour l'intégration N8N - Analyse générée par IA
 */

/**
 * Contextes disponibles pour générer une analyse
 */
export type AnalysisContext = 'ticket' | 'company' | 'contact';

/**
 * Données d'entrée pour générer une analyse
 */
export type GenerateAnalysisInput = {
  context: AnalysisContext;
  id: string;
};

/**
 * Réponse du webhook N8N contenant l'analyse générée
 */
export type N8NAnalysisResponse = {
  success: boolean;
  analysis?: string; // Texte formaté (Markdown ou HTML)
  error?: string;
};

/**
 * Résultat de la génération d'analyse
 */
export type AnalysisResult = {
  success: boolean;
  analysis: string;
  error?: string;
};

/**
 * État du hook d'analyse
 */
export type AnalysisGeneratorState = {
  isLoading: boolean;
  error: string | null;
  analysis: string | null;
};

