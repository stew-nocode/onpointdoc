/**
 * Hook personnalisé pour générer des analyses via N8N
 * 
 * Gère l'état du modal, l'appel API et l'affichage de l'analyse
 */

'use client';

import { useState, useCallback } from 'react';
import type { AnalysisContext, AnalysisGeneratorState } from '@/types/n8n';

type UseAnalysisGeneratorOptions = {
  context: AnalysisContext;
  id: string;
  onSuccess?: (analysis: string) => void;
  onError?: (error: string) => void;
};

type UseAnalysisGeneratorResult = {
  open: boolean;
  isLoading: boolean;
  error: string | null;
  analysis: string | null;
  openModal: () => void;
  closeModal: () => void;
  generate: () => Promise<void>;
  reset: () => void;
};

/**
 * Hook pour gérer la génération d'analyses via N8N
 * 
 * @param options - Options de configuration
 * @returns État et méthodes pour gérer l'analyse
 * 
 * @example
 * const { openModal, isLoading, analysis, generate } = useAnalysisGenerator({
 *   context: 'ticket',
 *   id: ticketId
 * });
 */
export function useAnalysisGenerator(
  options: UseAnalysisGeneratorOptions
): UseAnalysisGeneratorResult {
  const { context, id, onSuccess, onError } = options;

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AnalysisGeneratorState>({
    isLoading: false,
    error: null,
    analysis: null
  });

  /**
   * Génère l'analyse via l'API
   */
  const generate = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, analysis: null }));

    try {
      const response = await fetch('/api/n8n/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ context, id })
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        let errorDetails = '';

        try {
          const errorData = await response.json();
          // La route API retourne { error: AppError } via handleApiError
          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
            if (errorData.error.details) {
              errorDetails = typeof errorData.error.details === 'string' 
                ? errorData.error.details 
                : JSON.stringify(errorData.error.details, null, 2);
            }
            // Ajouter le code d'erreur si présent
            if (errorData.error.code) {
              errorMessage = `[${errorData.error.code}] ${errorMessage}`;
            }
          } else {
            // Format alternatif
            errorMessage = errorData.message || errorData.error?.message || errorMessage;
            if (errorData.details) {
              errorDetails = typeof errorData.details === 'string'
                ? errorData.details
                : JSON.stringify(errorData.details, null, 2);
            }
          }
        } catch {
          // Si le parsing JSON échoue, essayer de récupérer le texte
          const errorText = await response.text().catch(() => '');
          if (errorText) {
            errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          }
        }

        const fullError = errorDetails 
          ? `${errorMessage}\n\nDétails:\n${errorDetails}`
          : errorMessage;

        throw new Error(fullError);
      }

      const result = await response.json();

      if (!result.success || !result.analysis) {
        throw new Error(result.error || 'Aucune analyse générée');
      }

      setState({
        isLoading: false,
        error: null,
        analysis: result.analysis
      });

      onSuccess?.(result.analysis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState({
        isLoading: false,
        error: errorMessage,
        analysis: null
      });
      onError?.(errorMessage);
    }
  }, [context, id, onSuccess, onError]);

  /**
   * Ouvre le modal et génère automatiquement l'analyse
   */
  const openModal = useCallback(() => {
    setOpen(true);
    generate();
  }, [generate]);

  /**
   * Ferme le modal
   */
  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      analysis: null
    });
    setOpen(false);
  }, []);

  return {
    open,
    isLoading: state.isLoading,
    error: state.error,
    analysis: state.analysis,
    openModal,
    closeModal,
    generate,
    reset
  };
}

