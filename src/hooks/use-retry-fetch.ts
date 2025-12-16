'use client';

/**
 * Hook réutilisable pour gérer les requêtes fetch avec retry automatique
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Une seule responsabilité (gérer les retries de fetch)
 * - Réutilisable : Peut être utilisé pour n'importe quelle requête fetch
 * - Configurable : Options personnalisables (maxRetries, backoff, timeout)
 * - Type-safe : Générique pour supporter différents types de réponses
 * - Gestion d'erreur robuste : Détecte différents types d'erreurs réseau
 * 
 * Inspiré des meilleures pratiques de React hooks (alibaba/hooks, usehooks-ts)
 * 
 * @example
 * ```tsx
 * const { fetchWithRetry, isLoading, error } = useRetryFetch({
 *   maxRetries: 2,
 *   retryDelay: 1000,
 *   timeout: 30000
 * });
 * 
 * const data = await fetchWithRetry('/api/tickets/list?page=1');
 * ```
 */

import { useState, useCallback, useRef } from 'react';

export type RetryOptions = {
  /**
   * Nombre maximum de tentatives (incluant la première)
   * @default 2
   */
  maxRetries?: number;
  
  /**
   * Délai entre les tentatives en millisecondes
   * Utilise un backoff exponentiel : delay * retryNumber
   * @default 1000
   */
  retryDelay?: number;
  
  /**
   * Timeout pour chaque requête en millisecondes
   * @default 30000 (30 secondes)
   */
  timeout?: number;
  
  /**
   * Fonction pour déterminer si une erreur est retryable
   * @param error - L'erreur à évaluer
   * @param response - La réponse HTTP si disponible
   * @returns true si l'erreur peut être retryée
   */
  shouldRetry?: (error: unknown, response: Response | null) => boolean;
  
  /**
   * Callback appelé avant chaque retry
   * @param attemptNumber - Numéro de la tentative (1-based)
   * @param error - L'erreur qui a déclenché le retry
   */
  onRetry?: (attemptNumber: number, error: unknown) => void;
};

export type UseRetryFetchReturn = {
  /**
   * Fonction pour effectuer une requête fetch avec retry automatique
   * 
   * @param url - URL ou RequestInfo à fetch
   * @param init - Options de fetch (optionnel)
   * @returns Promise<Response> - La réponse de la requête réussie
   * @throws Error si toutes les tentatives échouent
   */
  fetchWithRetry: (
    url: string | URL | Request,
    init?: RequestInit
  ) => Promise<Response>;
  
  /**
   * Indique si une requête est en cours
   */
  isLoading: boolean;
  
  /**
   * Message d'erreur si la dernière requête a échoué
   */
  error: string | null;
  
  /**
   * Réinitialise l'état d'erreur
   */
  clearError: () => void;
};

/**
 * Détermine si une erreur est retryable par défaut
 */
function defaultShouldRetry(error: unknown, response: Response | null): boolean {
  // Erreurs réseau (TypeError, AbortError, etc.)
  if (error instanceof TypeError) {
    return true;
  }
  
  if (error instanceof Error) {
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();
    
    // Erreurs réseau communes
    if (
      errorName === 'aborterror' ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout')
    ) {
      return true;
    }
  }
  
  // Erreurs serveur (5xx) sont retryables
  if (response && response.status >= 500 && response.status < 600) {
    return true;
  }
  
  return false;
}

/**
 * Crée un message d'erreur user-friendly à partir d'une erreur
 */
function createErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return error.message.includes('network') || error.message.includes('fetch')
      ? 'Erreur de connexion réseau. Vérifiez votre connexion.'
      : 'Erreur réseau lors de la requête.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Erreur inconnue lors de la requête.';
}

/**
 * Hook pour gérer les requêtes fetch avec retry automatique
 * 
 * @param options - Options de configuration pour le retry
 * @returns Fonctions et état pour gérer les requêtes avec retry
 */
export function useRetryFetch(
  options: RetryOptions = {}
): UseRetryFetchReturn {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    timeout = 30000,
    shouldRetry = defaultShouldRetry,
    onRetry
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  
  /**
   * Effectue une requête fetch avec retry automatique
   */
  const fetchWithRetry = useCallback(
    async (
      url: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> => {
      // Éviter les requêtes concurrentes
      if (isLoadingRef.current) {
        throw new Error('Une requête est déjà en cours');
      }
      
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      let lastError: Error | null = null;
      let lastResponse: Response | null = null;
      
      try {
        // Tenter la requête jusqu'à maxRetries fois
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Créer un AbortSignal avec timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              timeout
            );
            
            // Effectuer la requête avec le signal d'abort
            const response = await fetch(url, {
              ...init,
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Si la réponse est OK, retourner immédiatement
            if (response.ok) {
              isLoadingRef.current = false;
              setIsLoading(false);
              return response;
            }
            
            // Si erreur serveur (5xx) et retryable, continuer
            if (response.status >= 500 && response.status < 600) {
              lastResponse = response;
              
              if (attempt < maxRetries && shouldRetry(null, response)) {
                // Appeler le callback onRetry si fourni
                if (onRetry) {
                  onRetry(attempt, new Error(`Erreur ${response.status}: ${response.statusText}`));
                }
                
                // Attendre avant de retry (backoff exponentiel)
                await new Promise(resolve => 
                  setTimeout(resolve, retryDelay * attempt)
                );
                continue;
              }
            }
            
            // Si erreur client (4xx), ne pas retry
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          } catch (fetchError: unknown) {
            lastError = fetchError instanceof Error 
              ? fetchError 
              : new Error('Erreur inconnue lors de la requête');
            
            // Vérifier si l'erreur est retryable
            if (attempt < maxRetries && shouldRetry(fetchError, lastResponse)) {
              // Appeler le callback onRetry si fourni
              if (onRetry) {
                onRetry(attempt, fetchError);
              }
              
              // Logger en développement
              if (process.env.NODE_ENV === 'development') {
                console.warn(
                  `[useRetryFetch] Tentative ${attempt}/${maxRetries} après erreur:`,
                  fetchError
                );
              }
              
              // Attendre avant de retry (backoff exponentiel)
              await new Promise(resolve => 
                setTimeout(resolve, retryDelay * attempt)
              );
              continue;
            }
            
            // Si non retryable ou dernière tentative, throw l'erreur
            throw lastError;
          }
        }
        
        // Ne devrait jamais arriver ici, mais TypeScript le requiert
        throw lastError || new Error('Toutes les tentatives ont échoué');
      } catch (err: unknown) {
        isLoadingRef.current = false;
        setIsLoading(false);
        
        const errorMessage = createErrorMessage(err);
        setError(errorMessage);
        
        // Logger l'erreur complète en développement
        if (process.env.NODE_ENV === 'development') {
          console.error('[useRetryFetch] Erreur finale après retries:', err);
        }
        
        throw err;
      }
    },
    [maxRetries, retryDelay, timeout, shouldRetry, onRetry]
  );
  
  /**
   * Réinitialise l'état d'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    fetchWithRetry,
    isLoading,
    error,
    clearError
  };
}

