/**
 * Utilitaires de retry avec backoff exponentiel
 * 
 * Permet de réessayer automatiquement les opérations qui échouent
 * avec un délai croissant entre chaque tentative.
 */

import { ApplicationError, createError, isApplicationError } from '@/lib/errors/types';

/**
 * Configuration pour le retry
 */
export type RetryConfig = {
  /** Nombre maximum de tentatives (défaut: 3) */
  maxRetries?: number;
  /** Délai initial en ms (défaut: 1000) */
  initialDelayMs?: number;
  /** Facteur multiplicateur pour le backoff (défaut: 2) */
  backoffFactor?: number;
  /** Délai maximum en ms (défaut: 30000) */
  maxDelayMs?: number;
  /** Ajouter du jitter aléatoire (défaut: true) */
  jitter?: boolean;
  /** Codes d'erreur qui ne doivent pas être retry */
  nonRetryableCodes?: string[];
  /** Callback appelé avant chaque retry */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
};

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 30000,
  jitter: true,
  nonRetryableCodes: [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'INVALID_INPUT'
  ],
  onRetry: () => {}
};

/**
 * Calcule le délai pour une tentative donnée
 * 
 * @param attempt - Numéro de la tentative (0-based)
 * @param config - Configuration
 * @returns Délai en ms
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  // Backoff exponentiel: delay = initialDelay * (factor ^ attempt)
  let delay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt);

  // Ajouter du jitter (±25%)
  if (config.jitter) {
    const jitterRange = delay * 0.25;
    delay += Math.random() * jitterRange * 2 - jitterRange;
  }

  // Limiter au délai maximum
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Vérifie si une erreur est retryable
 * 
 * @param error - Erreur à vérifier
 * @param config - Configuration
 * @returns true si l'erreur peut être réessayée
 */
function isRetryable(error: unknown, config: Required<RetryConfig>): boolean {
  if (isApplicationError(error)) {
    return !config.nonRetryableCodes.includes(error.code);
  }

  // Les erreurs réseau sont généralement retryables
  if (error instanceof Error) {
    const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'fetch failed'];
    return networkErrors.some(e => error.message.includes(e));
  }

  return true;
}

/**
 * Attend un certain temps
 * 
 * @param ms - Temps en millisecondes
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exécute une fonction avec retry et backoff exponentiel
 * 
 * @param fn - Fonction à exécuter
 * @param config - Configuration du retry
 * @returns Résultat de la fonction
 * @throws La dernière erreur si toutes les tentatives échouent
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => createJiraIssue(data),
 *   { maxRetries: 3, onRetry: (err, attempt) => console.log(`Retry ${attempt}`) }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const fullConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Si c'est la dernière tentative ou erreur non-retryable, throw
      if (attempt >= fullConfig.maxRetries || !isRetryable(error, fullConfig)) {
        throw error;
      }

      // Calculer le délai et attendre
      const delayMs = calculateDelay(attempt, fullConfig);
      fullConfig.onRetry(lastError, attempt + 1, delayMs);
      await sleep(delayMs);
    }
  }

  // Ne devrait jamais arriver, mais TypeScript a besoin de ça
  throw lastError ?? createError.internalError('Erreur inattendue dans withRetry');
}

/**
 * Résultat d'une opération avec retry
 */
export type RetryResult<T> = {
  success: boolean;
  data?: T;
  error?: ApplicationError;
  attempts: number;
};

/**
 * Exécute une fonction avec retry et retourne un résultat structuré
 * (ne throw pas d'erreur)
 * 
 * @param fn - Fonction à exécuter
 * @param config - Configuration du retry
 * @returns Résultat avec succès/erreur et nombre de tentatives
 * 
 * @example
 * ```typescript
 * const result = await withRetrySafe(
 *   () => createJiraIssue(data),
 *   { maxRetries: 3 }
 * );
 * 
 * if (result.success) {
 *   console.log('Created:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function withRetrySafe<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const fullConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config };
  let attempts = 0;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    attempts++;
    try {
      const data = await fn();
      return { success: true, data, attempts };
    } catch (error) {
      const lastError = error instanceof Error ? error : new Error(String(error));

      // Si c'est la dernière tentative ou erreur non-retryable, retourner l'erreur
      if (attempt >= fullConfig.maxRetries || !isRetryable(error, fullConfig)) {
        const appError = isApplicationError(error)
          ? error
          : createError.internalError('Erreur après plusieurs tentatives', lastError);

        return { success: false, error: appError, attempts };
      }

      // Calculer le délai et attendre
      const delayMs = calculateDelay(attempt, fullConfig);
      fullConfig.onRetry(lastError, attempt + 1, delayMs);
      await sleep(delayMs);
    }
  }

  // Ne devrait jamais arriver
  return {
    success: false,
    error: createError.internalError('Erreur inattendue'),
    attempts
  };
}

/**
 * Configuration prédéfinie pour les appels JIRA
 */
export const JIRA_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000,
  jitter: true,
  nonRetryableCodes: [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR'
  ]
};

/**
 * Configuration prédéfinie pour les appels Supabase
 */
export const SUPABASE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 500,
  backoffFactor: 2,
  maxDelayMs: 5000,
  jitter: true,
  nonRetryableCodes: [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'RLS_VIOLATION'
  ]
};

