/**
 * Types d'erreur personnalisés pour l'application
 * Permet une gestion d'erreur robuste et typée
 */

export enum ErrorCode {
  // Erreurs d'authentification
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Erreurs de validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Erreurs de données
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Erreurs de services externes
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  JIRA_ERROR = 'JIRA_ERROR',
  N8N_ERROR = 'N8N_ERROR',

  // Erreurs internes
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Erreurs de permission
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RLS_VIOLATION = 'RLS_VIOLATION'
}

export type AppError = {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  originalError?: Error;
};

/**
 * Classe d'erreur personnalisée pour l'application
 */
export class ApplicationError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.originalError = originalError;

    // Maintient la stack trace correcte
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  /**
   * Convertit l'erreur en objet JSON pour la réponse API
   */
  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message
          }
        : undefined
    };
  }
}

/**
 * Factory functions pour créer des erreurs typées
 */
export const createError = {
  unauthorized: (message: string = 'Non autorisé', details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.UNAUTHORIZED, message, 401, details),

  forbidden: (message: string = 'Accès interdit', details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.FORBIDDEN, message, 403, details),

  notFound: (resource: string = 'Ressource', details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.NOT_FOUND, `${resource} introuvable`, 404, details),

  validationError: (message: string, details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  conflict: (message: string, details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.CONFLICT, message, 409, details),

  supabaseError: (message: string, originalError?: Error, details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.SUPABASE_ERROR, message, 500, details, originalError),

  jiraError: (message: string, originalError?: Error, details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.JIRA_ERROR, message, 500, details, originalError),

  n8nError: (message: string, originalError?: Error, details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.N8N_ERROR, message, 500, details, originalError),

  networkError: (message: string, originalError?: Error, details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.NETWORK_ERROR, message, 500, details, originalError),

  internalError: (message: string = 'Erreur interne', originalError?: Error, details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.INTERNAL_ERROR, message, 500, details, originalError),

  configurationError: (message: string = 'Erreur de configuration', details?: Record<string, unknown>) =>
    new ApplicationError(ErrorCode.INTERNAL_ERROR, message, 500, details)
};

/**
 * Type guard pour vérifier si une erreur est une ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

/**
 * Convertit une erreur inconnue en ApplicationError
 */
export function normalizeError(error: unknown): ApplicationError {
  if (isApplicationError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createError.internalError('Une erreur est survenue', error);
  }

  return createError.internalError('Une erreur inconnue est survenue');
}

